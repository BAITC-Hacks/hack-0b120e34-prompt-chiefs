import type { Proposal, ProposalStatus, TaskCard } from '../types/domain';
import { seedProposals, seedTasks } from '../data/seed';

const TASKS = 'aisana.tasks.v1';
const PROPOSALS = 'aisana.proposals.v1';
export const PROGRESS_POINTS = 10;

export let storageWarning = '';

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord => !!value && typeof value === 'object' && !Array.isArray(value);
const hasStrings = (item: UnknownRecord, keys: string[]) => keys.every((key) => typeof item[key] === 'string');
const validDate = (value: unknown) => typeof value === 'string' && Number.isFinite(Date.parse(value));
const validId = (value: unknown) => typeof value === 'string' && value.trim().length > 0;
const clone = <T>(value: T): T => structuredClone(value);

function setWarning(message: string) {
  storageWarning = message;
}

function readArray<T extends { id: string }>(key: string, fallback: T[], isValid: (item: unknown) => item is T): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return clone(fallback);
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value) || !value.every(isValid) || new Set(value.map((item) => item.id)).size !== value.length) throw new Error('Invalid stored data');
    return value;
  } catch {
    setWarning('Saved data could not be read. Demo data is shown; use Reset demo data to replace damaged storage.');
    return clone(fallback);
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    storageWarning = '';
  } catch {
    setWarning('Browser storage is unavailable or full. Changes remain in this session only.');
  }
}

function isTask(value: unknown): value is TaskCard {
  if (!isRecord(value)) return false;
  return validId(value.id)
    && hasStrings(value, ['title', 'industry', 'context', 'need', 'users', 'data', 'constraints', 'expectedResult', 'successCriteria', 'contact', 'interactionFormat'])
    && typeof value.published === 'boolean'
    && validDate(value.createdAt);
}

function isProgress(value: unknown): boolean {
  return isRecord(value)
    && hasStrings(value, ['evidence'])
    && validDate(value.confirmedAt)
    && value.points === PROGRESS_POINTS;
}

function isProposal(value: unknown): value is Proposal {
  if (!isRecord(value)) return false;
  if (!validId(value.id) || !hasStrings(value, ['taskId', 'teamId', 'solutionIdea', 'plan', 'timeline', 'prototypeUrl']) || !validDate(value.createdAt)) return false;
  if (value.status !== 'PENDING' && value.status !== 'ACCEPTED' && value.status !== 'REJECTED') return false;
  try {
    const protocol = new URL(value.prototypeUrl as string).protocol;
    if (protocol !== 'http:' && protocol !== 'https:') return false;
  } catch {
    return false;
  }
  return value.progress === undefined || (value.status === 'ACCEPTED' && isProgress(value.progress));
}

export const loadTasks = (): TaskCard[] => readArray(TASKS, seedTasks, isTask);
export const saveTasks = (tasks: TaskCard[]) => save(TASKS, tasks);
export const loadProposals = (): Proposal[] => readArray(PROPOSALS, seedProposals, isProposal);
export const saveProposals = (items: Proposal[]) => save(PROPOSALS, items);

/** A proposal that earned progress points is a final business decision. */
export function setProposalStatus(items: Proposal[], proposalId: string, status: ProposalStatus): Proposal[] {
  return items.map((proposal) => proposal.id === proposalId && !proposal.progress ? { ...proposal, status } : proposal);
}

/** Adds progress only once, and only after the business accepted the proposal. */
export function confirmProposalProgress(items: Proposal[], proposalId: string, evidence: string, confirmedAt = new Date().toISOString()): Proposal[] {
  const trimmedEvidence = evidence.trim();
  if (!trimmedEvidence) return items;
  return items.map((proposal) => proposal.id === proposalId && proposal.status === 'ACCEPTED' && !proposal.progress
    ? { ...proposal, progress: { evidence: trimmedEvidence, confirmedAt, points: PROGRESS_POINTS } }
    : proposal);
}

export function resetDemoData() {
  const tasks = clone(seedTasks);
  const proposals = clone(seedProposals);
  saveTasks(tasks);
  saveProposals(proposals);
  return { tasks, proposals };
}
