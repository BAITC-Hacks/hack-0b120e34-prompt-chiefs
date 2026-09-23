import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';

// Compile the actual application modules in memory; no alternate business logic.
const cache = new Map();
function moduleUrl(path) {
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
test('AI falls back on malformed, short, unsafe, HTTP and network responses', async () => {
  globalThis.__testEnv = { VITE_TASK_DOCTOR_ENDPOINT: 'https://example.com/ai' };
  const original = globalThis.fetch;
  const fallback = await ai.mockAiAdapter.getClarifyingQuestions(seed.blankTask());
  try {
    for (const payload of [null, {}, {questions:[]}, {questions:[{field:'id',question:'Overwrite ID'}]}, {questions:[{field:'need',question:''}]}]) {
      globalThis.fetch = async () => ({ok:true, json:async()=>payload});
      assert.deepEqual(await ai.createAiAdapter().getClarifyingQuestions(seed.blankTask()), fallback);
    }
    for (const fetch of [async()=>{throw Error('offline')}, async()=>({ok:false}), async()=>({ok:true,json:async()=>{throw Error('invalid json')}})]) {
      globalThis.fetch = fetch;
      assert.deepEqual(await ai.createAiAdapter().getClarifyingQuestions(seed.blankTask()), fallback);
    }
    globalThis.fetch = async (_url, options) => {
      assert.equal(JSON.parse(options.body).prompt, ai.AI_PROMPT);
      return {ok:true,json:async()=>({questions:['need','data','users'].map(field=>({field,question:`Describe ${field}`}))})};
    };
    assert.equal((await ai.createAiAdapter().getClarifyingQuestions(seed.blankTask()))[0].id, 'live-1');
  } finally { globalThis.fetch = original; globalThis.__testEnv = {}; }
});
test('storage tolerates corruption and preserves confirmed progress', () => {
  const values = new Map();
  globalThis.localStorage = {getItem:key=>values.get(key) ?? null,setItem:(key,value)=>values.set(key,value)};
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
