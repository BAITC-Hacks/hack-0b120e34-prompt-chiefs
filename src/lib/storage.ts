import type { Proposal, TaskCard } from '../types/domain';
import { seedProposals, seedTasks } from '../data/seed';

const TASKS = 'aisana.tasks.v1';
const PROPOSALS = 'aisana.proposals.v1';

export const loadTasks = (): TaskCard[] => JSON.parse(localStorage.getItem(TASKS) || 'null') ?? seedTasks;
export const saveTasks = (tasks: TaskCard[]) => localStorage.setItem(TASKS, JSON.stringify(tasks));
export const loadProposals = (): Proposal[] => JSON.parse(localStorage.getItem(PROPOSALS) || 'null') ?? seedProposals;
export const saveProposals = (items: Proposal[]) => localStorage.setItem(PROPOSALS, JSON.stringify(items));

export function resetDemoData() {
  saveTasks(seedTasks);
  saveProposals(seedProposals);
  return { tasks: seedTasks, proposals: seedProposals };
}
