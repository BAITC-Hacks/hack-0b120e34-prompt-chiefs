import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';

// Compile the actual application modules in memory; no alternate business logic.
const cache = new Map();
function moduleUrl(path) {
  path = new URL(path, import.meta.url).href;
  if (cache.has(path)) return cache.get(path);
  const source = fs.readFileSync(new URL(path, import.meta.url), 'utf8').replaceAll('import.meta.env', 'globalThis.__testEnv');
  const output = stripTypeScriptTypes(source).replace(/from ['"]([^'"]+)['"]/g, (_match, name) => `from '${moduleUrl(new URL(`${name}.ts`, new URL(path, import.meta.url)).href)}'`);
  const url = `data:text/javascript;base64,${Buffer.from(output).toString('base64')}`;
  cache.set(path, url);
  return url;
}
const seed = await import(moduleUrl('../src/data/seed.ts'));
const scoring = await import(moduleUrl('../src/lib/scoring.ts'));
const ai = await import(moduleUrl('../src/lib/ai.ts'));
const storage = await import(moduleUrl('../src/lib/storage.ts'));
const proposals = await import(moduleUrl('../src/lib/proposals.ts'));
const recommendations = await import(moduleUrl('../src/lib/recommendations.ts'));

// One realistic value per scored field; each passes the length, distinct-symbol and pattern checks.
const VALID_FIELD_VALUES = {
  context: 'Операторы вручную разбирают обращения', need: 'Автоматически группировать обращения',
  data: 'CSV с 500 обезличенными отзывами', expectedResult: 'Веб-прототип с фильтрами',
  successCriteria: 'Точность не ниже 80%', constraints: 'Две недели, локально', users: 'Операторы поддержки',
  contact: 'a@b.kz', interactionFormat: 'Созвон раз в неделю',
};

function installStorage(t) {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const values = new Map();
  const browserStorage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, writable: true, value: browserStorage });
  storage.resetDemoData();
  values.clear();
  t.after(() => {
    browserStorage.setItem = (key, value) => values.set(key, value);
    browserStorage.getItem = key => values.get(key) ?? null;
    storage.resetDemoData();
    if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor);
    else delete globalThis.localStorage;
  });
  return { values, browserStorage };
}

test('five complete datasets, valid references and all readiness levels', () => {
  for (const items of [seed.seedTasks, seed.seedDrafts, seed.seedTeams, seed.seedProposals]) assert.ok(items.length >= 5);
  assert.deepEqual(new Set(seed.seedTasks.map(t => scoring.scoreTask(t).level)), new Set(['DRAFT', 'WORKING', 'READY', 'PRIORITY']));
  for (const proposal of seed.seedProposals) {
    assert.ok(seed.seedTasks.some(t => t.id === proposal.taskId));
    assert.ok(seed.seedTeams.some(t => t.id === proposal.teamId));
  }
});
test('score weights, missing details and readiness boundaries', () => {
  assert.equal(scoring.scoreTask(seed.blankTask()).total, 0);
  const complete = seed.seedTasks[0];
  assert.equal(scoring.scoreTask(complete).total, 100);
  for (const [field, weight] of [['need',20],['context',20],['data',20],['expectedResult',15],['successCriteria',15],['constraints',10],['users',10],['contact',10],['interactionFormat',10]]) {
    const result = scoring.scoreTask({ ...complete, [field]: '   ' });
    assert.equal(result.total, 100 - weight);
    assert.equal(result.missing.length, 1);
  }
  for (const [score, level] of [[0,'DRAFT'],[39,'DRAFT'],[40,'WORKING'],[69,'WORKING'],[70,'READY'],[89,'READY'],[90,'PRIORITY'],[100,'PRIORITY']]) assert.equal(scoring.readinessLevel(score), level);
});
test('AI asks at least three questions and applies only human answers', async () => {
  for (const task of [seed.blankTask(), ...seed.seedTasks]) {
    const questions = await ai.mockAiAdapter.getClarifyingQuestions(task);
    assert.ok(questions.length >= 3);
    assert.deepEqual(await ai.mockAiAdapter.applyAnswers(task, questions, {}), task);
  }
  const task = seed.feedbackAnalysisDemo();
  const questions = await ai.mockAiAdapter.getClarifyingQuestions(task);
  const answers = Object.fromEntries(questions.map(q => [q.id, `Human supplied facts for ${q.field}`]));
  const next = await ai.mockAiAdapter.applyAnswers(task, questions, answers);
  assert.equal(task.need, '');
  assert.equal(next.context, task.context);
  for (const q of questions) assert.equal(next[q.field], answers[q.id]);
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
test('storage tolerates corruption and preserves confirmed progress', t => {
  const { values } = installStorage(t);
  assert.equal(storage.loadTasks().length, 5);
  values.set('aisana.tasks.v1', '{broken');
  assert.equal(storage.loadTasks().length, 5);
  values.set('aisana.tasks.v1', '[{}]');
  assert.equal(storage.loadTasks().length, 5);
  const proposal = {...seed.seedProposals[0], status:'ACCEPTED', progress:{evidence:'Validated prototype',confirmedAt:new Date().toISOString(),points:10}};
  storage.saveProposals([proposal]);
  assert.deepEqual(storage.loadProposals(), [proposal]);
  storage.saveTasks([]);
  assert.deepEqual(storage.loadTasks(), []);
  globalThis.localStorage.setItem = () => {throw Error('quota')};
  assert.doesNotThrow(()=>storage.saveTasks(seed.seedTasks));
  assert.match(storage.storageWarning, /session only/);
});

test('score ignores supplied scores and metadata, never mutates inputs and stays in range', () => {
  const original = Object.freeze({ ...seed.blankTask(), score: 100, rating: 100, breakdown: { users: 100 } });
  assert.equal(scoring.scoreTask(original).total, 0);
  const fields = Object.keys(scoring.FIELD_MIN_LENGTH);
  // Exercise all 512 presence combinations, including the paired categories.
  for (let mask = 0; mask < 2 ** fields.length; mask++) {
    const task = { ...seed.seedTasks[0] };
    fields.forEach((field, bit) => { if (!(mask & (1 << bit))) task[field] = ''; });
    const result = scoring.scoreTask(Object.freeze(task));
    assert.ok(Number.isInteger(result.total) && result.total >= 0 && result.total <= 100);
    assert.equal(result.total + result.missing.reduce((sum, gap) => sum + gap.points, 0), 100);
    assert.deepEqual(scoring.scoreTask(task), result);
    assert.deepEqual(scoring.scoreTask({ ...task, published: false }), result);
  }
  for (const value of [NaN, Infinity, -1, 101]) assert.throws(() => scoring.readinessLevel(value), RangeError);
});

test('scoring thresholds reject malformed values and agree with offline questions', async () => {
  for (const [field, min] of Object.entries(scoring.FIELD_MIN_LENGTH)) {
    for (const bad of [undefined, null, 123, {}, [], ' '.repeat(100), 'x'.repeat(min - 1), 'а'.repeat(min + 20)]) {
      assert.equal(scoring.isFieldComplete(field, bad), false);
      const task = { ...seed.seedTasks[0], [field]: bad };
      assert.ok(scoring.scoreTask(task).total < 100);
      const questions = await ai.mockAiAdapter.getClarifyingQuestions(task);
      assert.equal(questions[0].field, field);
    }
    assert.ok(VALID_FIELD_VALUES[field].length >= min);
    assert.equal(scoring.isFieldComplete(field, `  ${VALID_FIELD_VALUES[field]}  `), true);
  }
});

test('AI rejects duplicate, oversized and metadata-targeting question sets', async () => {
  const task = seed.blankTask();
  const fallback = await ai.mockAiAdapter.getClarifyingQuestions(task);
  const valid = ['need', 'data', 'users'].map(field => ({ field, question: `Describe ${field}` }));
  for (const questions of [
    [valid[0], valid[0], valid[0]],
    [...valid, ...valid],
    [...valid, { field: 'published', question: 'Publish now?' }],
    [...valid, { field: 'rating', question: 'Give 100?' }],
    [...valid, null],
    [{ field: '__proto__', question: 'Change prototype?' }, ...valid],
    [{ field: 'need', question: '   ' }, valid[1], valid[2]],
    Array.from({ length: 12 }, () => valid[0]),
  ]) {
    const adapter = ai.createAiAdapter({ endpoint: '/api/doctor', fetcher: async () => ({ ok: true, json: async () => ({ questions }) }) });
    assert.deepEqual(await adapter.getClarifyingQuestions(task), fallback);
    assert.deepEqual(adapter.getDiagnostics(), { mode: 'offline', reason: 'invalid-response' });
  }
});

test('AI cannot apply metadata, inherited answers or non-string answers', async () => {
  const task = Object.freeze(seed.blankTask());
  const questions = ['id', 'published', 'createdAt', 'score', 'rating', '__proto__', 'constructor']
    .map((field, i) => ({ id: `bad-${i}`, field, mode: 'replace' }));
  const answers = Object.fromEntries(questions.map(q => [q.id, 'injected']));
  questions.push({ id: 'inherited', field: 'need', mode: 'replace' });
  questions.push({ id: 'number', field: 'data', mode: 'replace' });
  questions.push({ id: 'bad-mode', field: 'users', mode: 'delete' });
  Object.setPrototypeOf(answers, { inherited: 'untrusted inherited fact' });
  answers.number = 100;
  answers['bad-mode'] = 'delete users';
  assert.deepEqual(await ai.mockAiAdapter.applyAnswers(task, questions, answers), task);
});

test('AI copies only provided facts, preserves existing appended text and ignores server facts', async () => {
  const task = Object.freeze({ ...seed.seedTasks[0] });
  const questions = await ai.mockAiAdapter.getClarifyingQuestions(task);
  const answers = Object.fromEntries(questions.map(q => [q.id, '  Human clarification  ']));
  const updated = await ai.mockAiAdapter.applyAnswers(task, questions, answers);
  for (const q of questions) assert.equal(updated[q.field], `${task[q.field]}\nHuman clarification`);
  const adapter = ai.createAiAdapter({ endpoint: '/api/doctor', fetcher: async (_url, options) => {
    const input = JSON.parse(options.body);
    assert.equal(input.prompt, ai.AI_PROMPT);
    for (const key of ['published', 'createdAt', 'id', 'score', 'teams']) assert.equal(Object.hasOwn(input.task, key), false);
    return { ok: true, json: async () => ({
      questions: ['need', 'data', 'users'].map(field => ({ field, question: `Describe ${field}` })),
      suggestedFields: { data: 'Invented dataset', published: true }, score: 100,
    }) };
  } });
  const draft = { ...seed.blankTask(), score: 100, teams: [{ name: 'Private' }] };
  const live = await adapter.getClarifyingQuestions(draft);
  assert.deepEqual(await adapter.applyAnswers(draft, live, {}), draft);
  assert.deepEqual(adapter.getDiagnostics(), { mode: 'live', reason: 'success' });
  adapter.getDiagnostics().mode = 'offline';
  assert.equal(adapter.getDiagnostics().mode, 'live');
});

test('AI reports offline, HTTP, invalid JSON and network fallback explicitly', async () => {
  assert.deepEqual(ai.createAiAdapter({ endpoint: '' }).getDiagnostics(), { mode: 'offline', reason: 'not-configured' });
  for (const [fetcher, reason] of [
    [async () => ({ ok: false }), 'http'],
    [async () => ({ ok: true, json: async () => { throw Error('bad JSON'); } }), 'invalid-response'],
    [async () => { throw Error('offline'); }, 'network'],
  ]) {
    const adapter = ai.createAiAdapter({ endpoint: '/api/doctor', fetcher });
    assert.equal((await adapter.getClarifyingQuestions(seed.blankTask())).length, 3);
    assert.deepEqual(adapter.getDiagnostics(), { mode: 'offline', reason });
  }
});

test('AI aborts a slow request and a slow JSON body, then recovers on a later request', async () => {
  for (const slowBody of [false, true]) {
    let signal;
    let calls = 0;
    const adapter = ai.createAiAdapter({
      endpoint: '/api/doctor', timeoutMs: 10,
      fetcher: async (_url, options) => {
        if (calls++) return { ok: true, json: async () => ({ questions: ['need', 'data', 'users'].map(field => ({ field, question: `Describe ${field}` })) }) };
        signal = options.signal;
        const pending = () => new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(Error('aborted')), { once: true }));
        return slowBody ? { ok: true, json: pending } : pending();
      },
    });
    assert.equal((await adapter.getClarifyingQuestions(seed.blankTask())).length, 3);
    assert.equal(signal.aborted, true);
    assert.deepEqual(adapter.getDiagnostics(), { mode: 'offline', reason: 'timeout' });
    assert.equal((await adapter.getClarifyingQuestions(seed.blankTask()))[0].id, 'live-1');
    assert.equal(adapter.getDiagnostics().mode, 'live');
  }
});

test('manual decisions are independent, do not award points and can change before confirmation', () => {
  const first = Object.freeze({ ...seed.seedProposals[0] });
  const second = Object.freeze({ ...seed.seedProposals[1] });
  const accepted = proposals.changeProposalStatus(first, 'ACCEPTED');
  assert.equal(accepted.progress, undefined);
  assert.equal(first.status, 'PENDING');
  assert.equal(second.status, 'PENDING');
  assert.equal(proposals.changeProposalStatus(second, 'ACCEPTED').status, 'ACCEPTED');
  assert.equal(proposals.changeProposalStatus(accepted, 'REJECTED').status, 'REJECTED');
  assert.equal(proposals.canChangeProposalStatus(accepted), true);
  assert.throws(() => proposals.changeProposalStatus(first, 'UNKNOWN'), /status/);
});

test('progress requires acceptance, evidence and a valid timestamp', () => {
  const proposal = seed.seedProposals[0];
  for (const status of ['PENDING', 'REJECTED']) {
    assert.throws(() => proposals.confirmProposalProgress({ ...proposal, status }, 'Result verified'), /Accept/);
  }
  const accepted = proposals.changeProposalStatus(proposal, 'ACCEPTED');
  for (const evidence of ['', '  ', null, 10]) {
    assert.throws(() => proposals.confirmProposalProgress(accepted, evidence), /evidence/);
  }
  for (const date of ['', 'yesterday', '2026-02-30T10:00:00.000Z']) {
    assert.throws(() => proposals.confirmProposalProgress(accepted, 'Verified', date), /timestamp/);
  }
});

test('confirmed +10 is idempotent and final, including after persistence and reload', t => {
  installStorage(t);
  const accepted = proposals.changeProposalStatus(seed.seedProposals[0], 'ACCEPTED');
  const confirmed = proposals.confirmProposalProgress(accepted, '  Business verified prototype  ', '2026-09-23T10:00:00.000Z');
  assert.equal(accepted.progress, undefined);
  assert.equal(confirmed.progress.points, 10);
  assert.equal(confirmed.progress.evidence, 'Business verified prototype');
  assert.equal(proposals.canChangeProposalStatus(confirmed), false);
  assert.equal(storage.saveProposals([confirmed]), true);
  const [reloaded] = storage.loadProposals();
  for (const status of ['PENDING', 'REJECTED']) {
    assert.throws(() => proposals.changeProposalStatus(reloaded, status), /final/);
  }
  const repeated = proposals.confirmProposalProgress(reloaded, 'Replace evidence', '2026-09-24T10:00:00.000Z');
  assert.deepEqual(repeated, confirmed);
  assert.deepEqual(proposals.changeProposalStatus(reloaded, 'ACCEPTED'), confirmed);
  assert.equal(storage.saveProposals([repeated]), true);
  assert.equal(storage.loadProposals().reduce((sum, p) => sum + (p.progress?.points ?? 0), 0), 10);
});

test('storage refuses bypasses that reject, erase, reassign or rewrite confirmed progress', t => {
  const { values } = installStorage(t);
  const confirmed = proposals.confirmProposalProgress(proposals.changeProposalStatus(seed.seedProposals[0], 'ACCEPTED'), 'Verified stage');
  storage.saveProposals([confirmed]);
  const before = values.get('aisana.proposals.v1');
  for (const items of [
    [], [{ ...confirmed, status: 'REJECTED' }], [{ ...confirmed, progress: undefined }],
    [{ ...confirmed, teamId: 'team2' }], [{ ...confirmed, taskId: 't2' }],
    [{ ...confirmed, progress: { ...confirmed.progress, evidence: 'Rewritten' } }],
    [{ ...confirmed, progress: { ...confirmed.progress, points: 20 } }],
    [{ ...confirmed, progress: { ...confirmed.progress, confirmedAt: '2026-09-24T10:00:00.000Z' } }],
  ]) {
    assert.equal(storage.saveProposals(items), false);
    assert.match(storage.storageWarning, /not saved/);
    assert.equal(values.get('aisana.proposals.v1'), before);
    assert.deepEqual(storage.loadProposals(), [confirmed]);
  }
  const reset = storage.resetDemoData();
  assert.deepEqual(storage.loadProposals(), reset.proposals);
  assert.ok(reset.proposals.every(proposal => !proposal.progress));
});

test('storage rejects malformed lists, duplicate IDs, dates and impossible progress without overwriting raw data', t => {
  const { values } = installStorage(t);
  const task = seed.seedTasks[0];
  const proposal = seed.seedProposals[0];
  const progress = { evidence: 'Verified', confirmedAt: '2026-09-23T10:00:00.000Z', points: 10 };
  for (const [key, read, fallback, invalid] of [
    ['aisana.tasks.v1', storage.loadTasks, seed.seedTasks, [null, {}, [null], [task, task], [{ ...task, id: ' ' }], [{ ...task, createdAt: 'not a date' }], [{ ...task, context: 42 }]]],
    ['aisana.proposals.v1', storage.loadProposals, seed.seedProposals, [
      [proposal, proposal], [{ ...proposal, progress }], [{ ...proposal, status: 'REJECTED', progress }],
      ...[null, { ...progress, evidence: ' ' }, { ...progress, confirmedAt: 'invalid' }, { ...progress, points: 20 }]
        .map(progress => [{ ...proposal, status: 'ACCEPTED', progress }]),
      [{ ...proposal, prototypeUrl: 'javascript:alert(1)' }], [{ ...proposal, prototypeUrl: 'ftp://example.com' }],
      [{ ...proposal, plan: ' ' }], [{ ...proposal, teamId: '' }], [{ ...proposal, status: 'OTHER' }],
    ]],
  ]) {
    for (const value of invalid) {
      const raw = JSON.stringify(value);
      values.set(key, raw);
      assert.deepEqual(read(), fallback);
      assert.match(storage.storageWarning, /could not be read/);
      assert.equal(values.get(key), raw);
    }
  }
});

test('storage strips untrusted derived fields, accepts zero-score tasks and preserves empty lists', t => {
  const { values } = installStorage(t);
  const task = { ...seed.blankTask(), published: true };
  values.set('aisana.tasks.v1', JSON.stringify([{ ...task, score: 100, rating: 100, teams: ['injected'] }]));
  assert.deepEqual(storage.loadTasks(), [task]);
  assert.equal(scoring.scoreTask(storage.loadTasks()[0]).total, 0);
  assert.equal(storage.saveTasks([task]), true);
  assert.equal(storage.saveTasks([{ ...task, id: '' }]), false);
  assert.deepEqual(storage.loadTasks(), [task]);
  assert.equal(storage.saveTasks([]), true);
  assert.equal(storage.saveProposals([]), true);
  assert.deepEqual(storage.loadTasks(), []);
  assert.deepEqual(storage.loadProposals(), []);
});

test('storage warnings survive unrelated success and clear after recovery', t => {
  const { values } = installStorage(t);
  values.set('aisana.tasks.v1', '{broken');
  storage.loadTasks();
  storage.loadProposals();
  assert.match(storage.storageWarning, /could not be read/);
  assert.equal(storage.saveTasks(seed.seedTasks), true);
  assert.equal(storage.storageWarning, '');
});

test('unavailable storage retains session changes and finalized progress, then recovers', t => {
  const { browserStorage, values } = installStorage(t);
  browserStorage.getItem = () => { throw Error('SecurityError'); };
  browserStorage.setItem = () => { throw Error('QuotaExceededError'); };
  assert.deepEqual(storage.loadTasks(), seed.seedTasks);
  const task = { ...seed.blankTask(), title: 'Session-only task' };
  assert.equal(storage.saveTasks([task]), false);
  assert.match(storage.storageWarning, /session only/);
  task.title = 'Mutated caller';
  assert.equal(storage.loadTasks()[0].title, 'Session-only task');
  const confirmed = proposals.confirmProposalProgress(proposals.changeProposalStatus(seed.seedProposals[0], 'ACCEPTED'), 'Verified stage');
  assert.equal(storage.saveProposals([confirmed]), false);
  assert.deepEqual(storage.loadProposals(), [confirmed]);
  assert.equal(storage.saveProposals([{ ...confirmed, progress: undefined }]), false);
  assert.deepEqual(storage.loadProposals(), [confirmed]);
  browserStorage.setItem = (key, value) => values.set(key, value);
  browserStorage.getItem = key => values.get(key) ?? null;
  assert.equal(storage.saveTasks(storage.loadTasks()), true);
  assert.equal(storage.saveProposals(storage.loadProposals()), true);
  assert.equal(storage.storageWarning, '');
  assert.deepEqual(JSON.parse(values.get('aisana.proposals.v1')), [confirmed]);
});

test('reset returns independent snapshots and never mutates seeds', t => {
  installStorage(t);
  const before = structuredClone({ tasks: seed.seedTasks, proposals: seed.seedProposals });
  const first = storage.resetDemoData();
  first.tasks[0].title = 'Changed in caller';
  first.proposals[0].status = 'REJECTED';
  assert.deepEqual(storage.resetDemoData(), before);
  assert.deepEqual({ tasks: seed.seedTasks, proposals: seed.seedProposals }, before);
});

test('dependency versions are pinned to the lockfile used by npm ci', () => {
  const manifest = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url)));
  const lock = JSON.parse(fs.readFileSync(new URL('../package-lock.json', import.meta.url)));
  for (const section of ['dependencies', 'devDependencies']) {
    assert.deepEqual(manifest[section], lock.packages[''][section]);
    for (const [name, version] of Object.entries(manifest[section])) {
      assert.match(version, /^\d+\.\d+\.\d+$/);
      assert.equal(lock.packages[`node_modules/${name}`].version, version);
    }
  }
});

test('package dependencies are pinned to the lockfile versions', () => {
  const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(pkg.engines.node, '>=22.16.0');
  assert.deepEqual(pkg.dependencies, {
    '@anthropic-ai/sdk': '0.128.0', '@vitejs/plugin-react': '6.1.1', vite: '8.3.0', typescript: '7.0.2', react: '19.3.0', 'react-dom': '19.3.0',
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

test('storage recovers from corruption and validates persisted record shape', t => {
  const { values } = installStorage(t);
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

test('filler text, unmeasurable criteria and unreachable contacts earn no points', () => {
  const complete = seed.seedTasks[0];
  for (const [field, value] of [
    ['constraints', 'ааааааааааааааа'], ['users', 'абабабабабабаб'], ['data', '.................'],
    ['successCriteria', 'Заказчик будет доволен результатом'], ['contact', 'позвоните нам'],
  ]) {
    assert.equal(scoring.isFieldComplete(field, value), false, `${field}: ${value}`);
    assert.ok(scoring.scoreTask({ ...complete, [field]: value }).total < 100);
  }
  for (const contact of ['owner@example.com', '+7 701 123 45 67', '@support_team']) {
    assert.equal(scoring.isFieldComplete('contact', contact), true, contact);
  }
  for (const criteria of ['Не менее 80% верных категорий', 'Ответ быстрее 3 секунд', 'Запуск за 2 недели']) {
    assert.equal(scoring.isFieldComplete('successCriteria', criteria), true, criteria);
  }
});

test('local AI asks in the interface language and sends the language to a live model', async () => {
  const task = seed.feedbackAnalysisDemo();
  const [ru, kk, en] = await Promise.all(['ru', 'kk', 'en'].map(locale => ai.mockAiAdapter.getClarifyingQuestions(task, locale)));
  assert.deepEqual(ru.map(q => q.field), en.map(q => q.field));
  assert.deepEqual(kk.map(q => q.field), en.map(q => q.field));
  assert.match(ru[0].question, /[а-яё]/i);
  assert.match(kk[0].question, /[әғқңөұүһі]/i);
  assert.notEqual(ru[0].question, en[0].question);

  const request = ai.buildAiRequest(task, 'ru');
  assert.equal(request.prompt, ai.AI_PROMPT);
  assert.equal(request.language, 'ru');
  assert.deepEqual(Object.keys(request.task).sort(), Object.keys(ai.buildAiRequest(seed.blankTask()).task).sort());
  let sent;
  const adapter = ai.createAiAdapter({ endpoint: '/api/doctor', fetcher: async (_url, options) => { sent = JSON.parse(options.body); return { ok: false }; } });
  assert.deepEqual(await adapter.getClarifyingQuestions(task, 'kk'), kk);
  assert.equal(sent.language, 'kk');
  assert.deepEqual(ai.toAiResponse(ru), { questions: ru.map(({ field, question }) => ({ field, question })) });
});

test('recommendations follow team interests, skip tasks under 40 points and never assign teams', () => {
  const byId = Object.fromEntries(seed.seedTeams.map(team => [team.id, team]));
  assert.deepEqual(recommendations.recommendTasks(byId.team4, seed.seedTasks).map(task => task.id), ['t5']);
  assert.deepEqual(recommendations.recommendTasks(byId.team2, seed.seedTasks).map(task => task.id), ['t2']);
  // t3 (Education) is a 0-point draft: visible in the catalog, but not recommended.
  assert.deepEqual(recommendations.recommendTasks(byId.team5, seed.seedTasks).map(task => task.id), ['t4']);
  const hidden = { ...seed.seedTasks[4], published: false };
  assert.deepEqual(recommendations.recommendTasks(byId.team4, [hidden]), []);
  const before = structuredClone(seed.seedTasks);
  recommendations.recommendTasks(byId.team1, seed.seedTasks);
  assert.deepEqual(seed.seedTasks, before);
});

test('storage exposes translatable warning codes alongside the English text', t => {
  const { values } = installStorage(t);
  values.set('aisana.tasks.v1', '{broken');
  storage.loadTasks();
  assert.deepEqual(storage.storageWarningCodes, ['unreadable']);
  values.set('aisana.tasks.v1', JSON.stringify(seed.seedTasks));
  storage.loadTasks();
  assert.deepEqual(storage.storageWarningCodes, []);
});
