import type { ReadinessLevel, ScoreBreakdown, TaskCard, TaskScore } from '../types/domain';

type ScoreRule = Readonly<{ label: string; points: number; tip: string }>;

export const SCORE_RULES: Readonly<Record<keyof ScoreBreakdown, ScoreRule>> = Object.freeze({
  contextAndNeed: Object.freeze({ label: 'Context & need', points: 20, tip: 'Explain the current situation and what must change.' }),
  dataAndMaterials: Object.freeze({ label: 'Data & materials', points: 20, tip: 'List available datasets, examples, documents or data sources.' }),
  expectedResult: Object.freeze({ label: 'Expected result', points: 15, tip: 'Describe the concrete deliverable the team should produce.' }),
  successCriteria: Object.freeze({ label: 'Success criteria', points: 15, tip: 'Add measurable acceptance criteria or target metrics.' }),
  constraints: Object.freeze({ label: 'Constraints', points: 10, tip: 'Add deadlines, required technologies, access limits or other boundaries.' }),
  users: Object.freeze({ label: 'Users', points: 10, tip: 'State who will use or benefit from the solution.' }),
  businessInteraction: Object.freeze({ label: 'Business interaction', points: 10, tip: 'Add a contact and consultation/feedback format.' }),
});

const hasText = (value: unknown, minimumLength: number) => typeof value === 'string' && value.trim().length >= minimumLength;

export function readinessLevel(score: number): ReadinessLevel {
  if (score >= 90) return 'PRIORITY';
  if (score >= 70) return 'READY';
  if (score >= 40) return 'WORKING';
  return 'DRAFT';
}

/**
 * A pure completeness calculation. It only inspects card text and never calls AI,
 * reads storage, uses time, or changes the supplied task.
 */
export function scoreTask(task: TaskCard): TaskScore {
  const breakdown: ScoreBreakdown = {
    contextAndNeed: hasText(task?.context, 20) && hasText(task?.need, 20) ? SCORE_RULES.contextAndNeed.points : 0,
    dataAndMaterials: hasText(task?.data, 15) ? SCORE_RULES.dataAndMaterials.points : 0,
    expectedResult: hasText(task?.expectedResult, 15) ? SCORE_RULES.expectedResult.points : 0,
    successCriteria: hasText(task?.successCriteria, 15) ? SCORE_RULES.successCriteria.points : 0,
    constraints: hasText(task?.constraints, 10) ? SCORE_RULES.constraints.points : 0,
    users: hasText(task?.users, 10) ? SCORE_RULES.users.points : 0,
    businessInteraction: hasText(task?.contact, 5) && hasText(task?.interactionFormat, 8) ? SCORE_RULES.businessInteraction.points : 0,
  };

  const total = Object.values(breakdown).reduce((sum, points) => sum + points, 0);
  const missing = (Object.keys(SCORE_RULES) as (keyof ScoreBreakdown)[])
    .filter((key) => breakdown[key] === 0)
    .map((key) => ({ key, ...SCORE_RULES[key] }));

  return { total, level: readinessLevel(total), breakdown, missing };
}
