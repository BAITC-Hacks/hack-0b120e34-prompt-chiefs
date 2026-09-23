import type { TaskCard, TaskScore, ReadinessLevel } from '../types/domain';

const present = (value: string, min = 12) => value.trim().length >= min;

export function readinessLevel(score: number): ReadinessLevel {
  if (score >= 90) return 'PRIORITY';
  if (score >= 70) return 'READY';
  if (score >= 40) return 'WORKING';
  return 'DRAFT';
}

export function scoreTask(task: TaskCard): TaskScore {
  const breakdown = {
    contextAndNeed: present(task.context, 20) && present(task.need, 20) ? 20 : 0,
    dataAndMaterials: present(task.data, 15) ? 20 : 0,
    expectedResult: present(task.expectedResult, 15) ? 15 : 0,
    successCriteria: present(task.successCriteria, 15) ? 15 : 0,
    constraints: present(task.constraints, 10) ? 10 : 0,
    users: present(task.users, 10) ? 10 : 0,
    businessInteraction: present(task.contact, 5) && present(task.interactionFormat, 8) ? 10 : 0,
  };

  const total = Object.values(breakdown).reduce((sum, value) => sum + value, 0);
  const checks = [
    ['contextAndNeed', 'Context & need', 20, 'Explain the current situation and what must change.'],
    ['dataAndMaterials', 'Data & materials', 20, 'List available datasets, examples, documents or data sources.'],
    ['expectedResult', 'Expected result', 15, 'Describe the concrete deliverable the team should produce.'],
    ['successCriteria', 'Success criteria', 15, 'Add measurable acceptance criteria or target metrics.'],
    ['constraints', 'Constraints', 10, 'Add deadlines, required technologies, access limits or other boundaries.'],
    ['users', 'Users', 10, 'State who will use or benefit from the solution.'],
    ['businessInteraction', 'Business interaction', 10, 'Add a contact and consultation/feedback format.'],
  ] as const;

  return {
    total,
    level: readinessLevel(total),
    breakdown,
    missing: checks
      .filter(([key]) => breakdown[key] === 0)
      .map(([key, label, points, tip]) => ({ key, label, points, tip })),
  };
}
