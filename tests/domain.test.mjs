import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';

// Compile the actual application modules in memory; no duplicate test-only logic.
const modules = new Map();
function moduleUrl(path) {
  if (modules.has(path)) return modules.get(path);
  const source = fs.readFileSync(new URL(path, import.meta.url), 'utf8').replaceAll('import.meta.env', 'globalThis.__testEnv');
  const output = stripTypeScriptTypes(source).replace(/from ['"]([^'"]+)['"]/g, (_match, name) => `from '${moduleUrl(new URL(`${name}.ts`, new URL(path, import.meta.url)).href)}'`);
  const url = `data:text/javascript;base64,${Buffer.from(output).toString('base64')}`;
  modules.set(path, url);
  return url;
}

const seed = await import(moduleUrl('../src/data/seed.ts'));
const scoring = await import(moduleUrl('../src/lib/scoring.ts'));
const ai = await import(moduleUrl('../src/lib/ai.ts'));
const storage = await import(moduleUrl('../src/lib/storage.ts'));

test('package dependencies are pinned to the lockfile versions', () => {
  const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(pkg.engines.node, '>=22.12.0');
  assert.deepEqual(pkg.dependencies, {
    '@vitejs/plugin-react': '6.1.1', vite: '8.3.0', typescript: '7.0.2', react: '19.3.0', 'react-dom': '19.3.0',
  });
  assert.deepEqual(pkg.devDependencies, { '@types/react': '19.3.0', '@types/react-dom': '19.3.0' });
});

test('score is deterministic, immutable, and bounded by the published rules', () => {
  const task = structuredClone(seed.seedTasks[0]);
  const before = structuredClone(task);
  const first = scoring.scoreTask(task);
  const second = scoring.scoreTask(task);
  assert.deepEqual(first, second);
  assert.deepEqual(task, before);
  assert.equal(first.total, 100);
  assert.equal(Object.values(scoring.SCORE_RULES).reduce((sum, rule) => sum + rule.points, 0), 100);
  assert.throws(() => { scoring.SCORE_RULES.users.points = 0; }, TypeError);
  assert.equal(scoring.scoreTask({ ...seed.blankTask(), data: null }).total, 0);
});

test('score weights, missing details, and readiness boundaries are exact', () => {
  assert.equal(scoring.scoreTask(seed.blankTask()).total, 0);
  const complete = seed.seedTasks[0];
  for (const [field, weight] of [['need', 20], ['context', 20], ['data', 20], ['expectedResult', 15], ['successCriteria', 15], ['constraints', 10], ['users', 10], ['contact', 10], ['interactionFormat', 10]]) {
    const result = scoring.scoreTask({ ...complete, [field]: '   ' });
    assert.equal(result.total, 100 - weight);
    assert.equal(result.missing.length, 1);
  }
  for (const [score, level] of [[0, 'DRAFT'], [39, 'DRAFT'], [40, 'WORKING'], [69, 'WORKING'], [70, 'READY'], [89, 'READY'], [90, 'PRIORITY'], [100, 'PRIORITY']]) {
    assert.equal(scoring.readinessLevel(score), level);
  }
});

test('the local AI asks three questions and applies only valid human answers', async () => {
  const task = seed.feedbackAnalysisDemo();
  const questions = await ai.mockAiAdapter.getClarifyingQuestions(task);
  assert.equal(questions.length, 3);
  assert.equal(new Set(questions.map(question => question.field)).size, 3);

  const answers = Object.fromEntries(questions.map(question => [question.id, `Human supplied facts for ${question.field}`]));
  const next = await ai.mockAiAdapter.applyAnswers(task, questions, answers);
  assert.equal(task.need, '');
  for (const question of questions) assert.equal(next[question.field], answers[question.id]);

  const hostileQuestions = [
    { id: 'published', field: 'published', question: 'Change publication', mode: 'replace' },
    { id: 'id', field: 'id', question: 'Change ID', mode: 'replace' },
    { id: 'need', field: 'need', question: 'Need', mode: 'replace' },
    { id: 'need-again', field: 'need', question: 'Need again', mode: 'replace' },
  ];
  const safe = await ai.mockAiAdapter.applyAnswers(task, hostileQuestions, { published: 'true', id: 'overwritten', need: 'Only this field changes', 'need-again': 'Must be ignored' });
  assert.equal(safe.published, false);
  assert.equal(safe.id, task.id);
  assert.equal(safe.need, 'Only this field changes');
});

test('AI falls back on malformed, duplicate, overlong, unsafe, HTTP, and network responses', async () => {
  globalThis.__testEnv = { VITE_TASK_DOCTOR_ENDPOINT: 'https://example.com/ai' };
  const originalFetch = globalThis.fetch;
  const fallback = await ai.mockAiAdapter.getClarifyingQuestions(seed.blankTask());
  const invalidPayloads = [
    null,
    {},
    { questions: [] },
    { questions: [{ field: 'need', question: 'One' }, { field: 'data', question: 'Two' }] },
    { questions: [{ field: 'id', question: 'Overwrite ID' }, { field: 'data', question: 'Data?' }, { field: 'users', question: 'Users?' }] },
    { questions: [{ field: 'need', question: 'One' }, { field: 'need', question: 'Duplicate' }, { field: 'users', question: 'Users?' }] },
    { questions: [{ field: 'need', question: 'x'.repeat(501) }, { field: 'data', question: 'Data?' }, { field: 'users', question: 'Users?' }] },
  ];
  try {
    for (const payload of invalidPayloads) {
      globalThis.fetch = async () => ({ ok: true, json: async () => payload });
      assert.deepEqual(await ai.createAiAdapter().getClarifyingQuestions(seed.blankTask()), fallback);
    }
    for (const fetch of [async () => { throw Error('offline'); }, async () => ({ ok: false }), async () => ({ ok: true, json: async () => { throw Error('invalid JSON'); } })]) {
      globalThis.fetch = fetch;
      assert.deepEqual(await ai.createAiAdapter().getClarifyingQuestions(seed.blankTask()), fallback);
    }
    globalThis.fetch = async (_url, options) => {
      assert.equal(JSON.parse(options.body).prompt, ai.AI_PROMPT);
      return { ok: true, json: async () => ({ questions: ['need', 'data', 'users'].map(field => ({ field, question: `Describe ${field}` })) }) };
    };
    assert.equal((await ai.createAiAdapter().getClarifyingQuestions(seed.blankTask()))[0].id, 'live-1');

    globalThis.__testEnv = { VITE_TASK_DOCTOR_ENDPOINT: 'javascript:alert(1)' };
    globalThis.fetch = async () => { throw Error('Unsafe URL must not be fetched'); };
    assert.deepEqual(await ai.createAiAdapter().getClarifyingQuestions(seed.blankTask()), fallback);
  } finally {
    globalThis.fetch = originalFetch;
    globalThis.__testEnv = {};
  }
});

test('storage recovers from corruption and validates persisted record shape', () => {
  const values = new Map();
  globalThis.localStorage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  assert.equal(storage.loadTasks().length, 5);
  values.set('aisana.tasks.v1', '{broken');
  assert.equal(storage.loadTasks().length, 5);
  values.set('aisana.tasks.v1', '[{}]');
  assert.equal(storage.loadTasks().length, 5);
  values.set('aisana.tasks.v1', JSON.stringify([seed.seedTasks[0], seed.seedTasks[0]]));
  assert.equal(storage.loadTasks().length, 5);
  values.set('aisana.proposals.v1', JSON.stringify([{ ...seed.seedProposals[0], prototypeUrl: 'javascript:alert(1)' }]));
  assert.equal(storage.loadProposals().length, 5);
  values.set('aisana.proposals.v1', JSON.stringify([{ ...seed.seedProposals[0], status: 'ACCEPTED', progress: { evidence: 'Proof', confirmedAt: 'not-a-date', points: 10 } }]));
  assert.equal(storage.loadProposals().length, 5);

  storage.saveTasks([]);
  assert.deepEqual(storage.loadTasks(), []);
  globalThis.localStorage.setItem = () => { throw Error('quota'); };
  assert.doesNotThrow(() => storage.saveTasks(seed.seedTasks));
  assert.match(storage.storageWarning, /session only/);
});

test('a +10 progress confirmation makes the business decision final', () => {
  const pending = { ...seed.seedProposals[0], status: 'PENDING' };
  assert.deepEqual(storage.confirmProposalProgress([pending], pending.id, 'Evidence'), [pending]);

  const accepted = storage.setProposalStatus([pending], pending.id, 'ACCEPTED');
  const confirmed = storage.confirmProposalProgress(accepted, pending.id, 'Business reviewed the prototype.', '2026-09-23T10:00:00.000Z');
  assert.equal(confirmed[0].status, 'ACCEPTED');
  assert.deepEqual(confirmed[0].progress, { evidence: 'Business reviewed the prototype.', confirmedAt: '2026-09-23T10:00:00.000Z', points: 10 });

  const rejectedAfterProgress = storage.setProposalStatus(confirmed, pending.id, 'REJECTED');
  const reconfirmed = storage.confirmProposalProgress(confirmed, pending.id, 'New evidence', '2026-09-24T10:00:00.000Z');
  assert.deepEqual(rejectedAfterProgress, confirmed);
  assert.deepEqual(reconfirmed, confirmed);
});
