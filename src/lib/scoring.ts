import type { TaskCard, TaskScore, ReadinessLevel } from '../types/domain';

const present = (value: string, min = 12) => value.trim().length >= min;

const checks = [
  ['contextAndNeed', 'Context & need', 'Explain the current situation and what must change.', (task: TaskCard) => present(task.context, 20) && present(task.need, 20)],
  ['dataAndMaterials', 'Data & materials', 'List available datasets, examples, documents or data sources.', (task: TaskCard) => present(task.data, 15)],
  ['expectedResult', 'Expected result', 'Describe the concrete deliverable the team should produce.', (task: TaskCard) => present(task.expectedResult, 15)],
  ['successCriteria', 'Success criteria', 'Add measurable acceptance criteria or target metrics.', (task: TaskCard) => present(task.successCriteria, 15)],
  ['constraints', 'Constraints', 'Add deadlines, required technologies, access limits or other boundaries.', (task: TaskCard) => present(task.constraints, 10)],
  ['users', 'Users', 'State who will use or benefit from the solution.', (task: TaskCard) => present(task.users, 10)],
  ['businessInteraction', 'Business interaction', 'Add a contact and consultation/feedback format.', (task: TaskCard) => present(task.contact, 5) && present(task.interactionFormat, 8)],
] as const;

export type TaskGap = { key: keyof TaskScore['breakdown']; label: string; tip: string };

// This identifies absent business facts only. It intentionally exposes no numeric score.
export function findTaskGaps(task: TaskCard): TaskGap[] {
  return checks.filter(([, , , isComplete]) => !isComplete(task)).map(([key, label, tip]) => ({ key, label, tip }));
}

export function readinessLevel(score: number): ReadinessLevel {
  if (score >= 90) return 'PRIORITY';
  if (score >= 70) return 'READY';
  if (score >= 40) return 'WORKING';
  return 'DRAFT';
}

export function scoreTask(task: TaskCard): TaskScore {
  const gaps = new Set(findTaskGaps(task).map((gap) => gap.key));
  const breakdown = {
    contextAndNeed: gaps.has('contextAndNeed') ? 0 : 20,
    dataAndMaterials: gaps.has('dataAndMaterials') ? 0 : 20,
    expectedResult: gaps.has('expectedResult') ? 0 : 15,
    successCriteria: gaps.has('successCriteria') ? 0 : 15,
    constraints: gaps.has('constraints') ? 0 : 10,
    users: gaps.has('users') ? 0 : 10,
    businessInteraction: gaps.has('businessInteraction') ? 0 : 10,
  };

  const total = Object.values(breakdown).reduce((sum, value) => sum + value, 0);
  return {
    total,
    level: readinessLevel(total),
    breakdown,
    missing: findTaskGaps(task).map((gap) => ({ ...gap, points: { contextAndNeed: 20, dataAndMaterials: 20, expectedResult: 15, successCriteria: 15, constraints: 10, users: 10, businessInteraction: 10 }[gap.key] })),
  };
}
