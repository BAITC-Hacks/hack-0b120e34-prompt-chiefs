import type { Proposal, TaskCard } from '../types/domain';
import { seedProposals, seedTasks } from '../data/seed';

const TASKS = 'aisana.tasks.v1';
const PROPOSALS = 'aisana.proposals.v1';

export let storageWarning = '';
const strings = (item: Record<string, unknown>, keys: string[]) => keys.every(key => typeof item[key] === 'string');
function load<T>(key: string, fallback: T[], valid: (item: Record<string, unknown>) => boolean): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return structuredClone(fallback);
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value) || !value.every(item => item && typeof item === 'object' && valid(item))) throw new Error('Invalid stored data');
    return value as T[];
  } catch {
    storageWarning = 'Saved data could not be read. Demo data is shown; use Reset demo data to replace damaged storage.';
    return structuredClone(fallback);
  }
}
function save(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch { storageWarning = 'Browser storage is unavailable or full. Changes remain in this session only.'; }
}
export const loadTasks = (): TaskCard[] => load(TASKS, seedTasks, item => strings(item, ['id', 'title', 'industry', 'context', 'need', 'users', 'data', 'constraints', 'expectedResult', 'successCriteria', 'contact', 'interactionFormat', 'createdAt']) && typeof item.published === 'boolean');
export const saveTasks = (tasks: TaskCard[]) => save(TASKS, tasks);
export const loadProposals = (): Proposal[] => load(PROPOSALS, seedProposals, item => {
  if (!strings(item, ['id', 'taskId', 'teamId', 'solutionIdea', 'plan', 'timeline', 'prototypeUrl', 'createdAt']) || !['PENDING', 'ACCEPTED', 'REJECTED'].includes(String(item.status))) return false;
  try { if (!['http:', 'https:'].includes(new URL(String(item.prototypeUrl)).protocol)) return false; } catch { return false; }
  const progress = item.progress as Record<string, unknown> | undefined;
  return progress === undefined || !!progress && strings(progress, ['evidence', 'confirmedAt']) && progress.points === 10;
});
export const saveProposals = (items: Proposal[]) => save(PROPOSALS, items);

export function resetDemoData() {
  saveTasks(seedTasks);
  saveProposals(seedProposals);
  return { tasks: seedTasks, proposals: seedProposals };
}
