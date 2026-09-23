import type { Proposal, TaskCard } from '../types/domain';
import { seedProposals, seedTasks } from '../data/seed';
import { assertFinalizedProposalsPreserved, isConfirmedProgress, isIsoTimestamp, isProposalStatus } from './proposals';

const TASKS = 'aisana.tasks.v1';
const PROPOSALS = 'aisana.proposals.v1';

export let storageWarning = '';
const warnings = new Map<string, string>();
// Preserve failed writes for the current page session, including a subsequent load.
const sessionFallback = new Map<string, unknown[]>();
function warn(key: string, message = '') {
  if (message) warnings.set(key, message);
  else warnings.delete(key);
  storageWarning = [...new Set(warnings.values())].join(' ');
}

const taskFields = [
  'id', 'title', 'industry', 'context', 'need', 'users', 'data', 'constraints',
  'expectedResult', 'successCriteria', 'contact', 'interactionFormat', 'createdAt',
] as const;
const proposalFields = [
  'id', 'taskId', 'teamId', 'solutionIdea', 'plan', 'timeline', 'prototypeUrl', 'createdAt',
] as const;
const record = (item: unknown): item is Record<string, unknown> =>
  !!item && typeof item === 'object' && !Array.isArray(item);
const strings = (item: Record<string, unknown>, keys: readonly string[]) =>
  keys.every(key => typeof item[key] === 'string');
const nonempty = (value: unknown): value is string => typeof value === 'string' && !!value.trim();
const identifier = (value: unknown) => nonempty(value) && value === value.trim();
const pick = (item: Record<string, unknown>, keys: readonly string[]) =>
  Object.fromEntries(keys.map(key => [key, item[key]]));

function parseTask(value: unknown): TaskCard {
  if (!record(value) || !strings(value, taskFields) || !identifier(value.id)
    || !isIsoTimestamp(value.createdAt) || typeof value.published !== 'boolean') {
    throw new Error('Invalid stored task.');
  }
  // Never trust a persisted score or other derived/unknown fields.
  return { ...pick(value, taskFields), published: value.published } as TaskCard;
}

function parseProposal(value: unknown): Proposal {
  if (!record(value) || !strings(value, proposalFields)
    || !['id', 'taskId', 'teamId'].every(key => identifier(value[key]))
    || !['solutionIdea', 'plan', 'timeline'].every(key => nonempty(value[key]))
    || !isIsoTimestamp(value.createdAt) || !isProposalStatus(value.status)) {
    throw new Error('Invalid stored proposal.');
  }
  if (!['http:', 'https:'].includes(new URL(value.prototypeUrl as string).protocol)) {
    throw new Error('Prototype must use HTTP(S).');
  }
  if (value.progress !== undefined
    && (value.status !== 'ACCEPTED' || !isConfirmedProgress(value.progress))) {
    throw new Error('Invalid confirmed progress.');
  }
  const proposal = { ...pick(value, proposalFields), status: value.status } as Proposal;
  if (isConfirmedProgress(value.progress)) {
    proposal.progress = {
      evidence: value.progress.evidence, confirmedAt: value.progress.confirmedAt, points: 10,
    };
  }
  return proposal;
}

function parseList<T extends { id: string }>(value: unknown, parse: (item: unknown) => T): T[] {
  if (!Array.isArray(value)) throw new Error('Expected a list.');
  const items = value.map(parse);
  if (new Set(items.map(item => item.id)).size !== items.length) throw new Error('Duplicate IDs.');
  return items;
}

function load<T extends { id: string }>(key: string, fallback: T[], parse: (item: unknown) => T): T[] {
  const memory = sessionFallback.get(key);
  if (memory) return parseList(structuredClone(memory), parse);
  try {
    const raw = localStorage.getItem(key);
    const items = raw === null ? structuredClone(fallback) : parseList(JSON.parse(raw), parse);
    warn(key);
    return items;
  } catch {
    warn(key, 'Saved data could not be read. Demo data is shown; use Reset demo data to replace damaged storage.');
    // Leave the original raw value untouched so data can still be recovered.
    return structuredClone(fallback);
  }
}

function save<T extends { id: string }>(
  key: string, value: T[], parse: (item: unknown) => T, check?: (items: T[]) => void,
): boolean {
  let items: T[];
  try {
    items = parseList(value, parse);
    check?.(items);
  } catch {
    warn(key, 'Invalid changes were not saved. Confirmed progress is final; restore the last valid state or reset demo data.');
    return false;
  }
  try {
    localStorage.setItem(key, JSON.stringify(items));
    sessionFallback.delete(key);
    warn(key);
    return true;
  } catch {
    sessionFallback.set(key, structuredClone(items));
    warn(key, 'Browser storage is unavailable or full. Changes remain in this session only.');
    return false;
  }
}

export const loadTasks = (): TaskCard[] => load(TASKS, seedTasks, parseTask);
export const saveTasks = (tasks: TaskCard[]): boolean => save(TASKS, tasks, parseTask);
export const loadProposals = (): Proposal[] => load(PROPOSALS, seedProposals, parseProposal);
export const saveProposals = (items: Proposal[]): boolean => save(PROPOSALS, items, parseProposal, next => {
  assertFinalizedProposalsPreserved(loadProposals(), next);
});

// The only intentional override of finalized progress, initiated by Reset demo data.
export function resetDemoData() {
  const tasks = structuredClone(seedTasks);
  const proposals = structuredClone(seedProposals);
  save(TASKS, tasks, parseTask);
  save(PROPOSALS, proposals, parseProposal);
  return { tasks, proposals };
}
