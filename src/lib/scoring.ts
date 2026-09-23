import type { TaskCard, TaskScore, ReadinessLevel } from '../types/domain';

// A deterministic completeness heuristic, not verification of business facts.
// Shared with the offline Doctor so its questions use exactly the same thresholds.
export const FIELD_MIN_LENGTH = Object.freeze({
  context: 20, need: 20, data: 15, expectedResult: 15, successCriteria: 15,
  constraints: 10, users: 10, contact: 5, interactionFormat: 8,
});

export function isFieldComplete(field: keyof typeof FIELD_MIN_LENGTH, value: unknown): boolean {
  return typeof value === 'string' && value.trim().length >= FIELD_MIN_LENGTH[field];
}

export function readinessLevel(score: number): ReadinessLevel {
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    throw new RangeError('Readiness score must be a finite number from 0 to 100.');
  }
  if (score >= 90) return 'PRIORITY';
  if (score >= 70) return 'READY';
  if (score >= 40) return 'WORKING';
  return 'DRAFT';
}

export function scoreTask(task: TaskCard): TaskScore {
  const breakdown = {
    contextAndNeed: isFieldComplete('context', task.context) && isFieldComplete('need', task.need) ? 20 : 0,
    dataAndMaterials: isFieldComplete('data', task.data) ? 20 : 0,
    expectedResult: isFieldComplete('expectedResult', task.expectedResult) ? 15 : 0,
    successCriteria: isFieldComplete('successCriteria', task.successCriteria) ? 15 : 0,
    constraints: isFieldComplete('constraints', task.constraints) ? 10 : 0,
    users: isFieldComplete('users', task.users) ? 10 : 0,
    businessInteraction: isFieldComplete('contact', task.contact) && isFieldComplete('interactionFormat', task.interactionFormat) ? 10 : 0,
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
