import type { ReadinessLevel, ScoreBreakdown, TaskCard, TaskScore } from '../types/domain';

type ScoreRule = Readonly<{ label: string; points: number; tip: string }>;

export const SCORE_RULES: Readonly<Record<keyof ScoreBreakdown, ScoreRule>> = Object.freeze({
  contextAndNeed: Object.freeze({ label: 'Context & need', points: 20, tip: 'Explain the current situation and what must change.' }),
  dataAndMaterials: Object.freeze({ label: 'Data & materials', points: 20, tip: 'List available datasets, examples, documents or data sources.' }),
  expectedResult: Object.freeze({ label: 'Expected result', points: 15, tip: 'Describe the concrete deliverable the team should produce.' }),
  successCriteria: Object.freeze({ label: 'Success criteria', points: 15, tip: 'Add measurable acceptance criteria: a number, percentage or deadline.' }),
  constraints: Object.freeze({ label: 'Constraints', points: 10, tip: 'Add deadlines, required technologies, access limits or other boundaries.' }),
  users: Object.freeze({ label: 'Users', points: 10, tip: 'State who will use or benefit from the solution.' }),
  businessInteraction: Object.freeze({ label: 'Business interaction', points: 10, tip: 'Add a contact (email, phone or @handle) and consultation/feedback format.' }),
});

// A deterministic completeness heuristic, not verification of business facts.
// Shared with the offline Doctor so its questions use exactly the same thresholds.
export const FIELD_MIN_LENGTH = Object.freeze({
  context: 20, need: 20, data: 15, expectedResult: 15, successCriteria: 15,
  constraints: 10, users: 10, contact: 5, interactionFormat: 8,
});

// Filler such as "aaaaaaaaaaaaaaa" has too few distinct letters or digits to count as a fact.
export const MIN_DISTINCT_SYMBOLS = 4;

// Field-specific signals: success criteria must be measurable, a contact must be reachable.
export const FIELD_PATTERN: Readonly<Partial<Record<keyof typeof FIELD_MIN_LENGTH, RegExp>>> = Object.freeze({
  successCriteria: /\d/,
  contact: /[^\s@]+@[^\s@]+\.[^\s@]+|\+?\d[\d\s()-]{5,}\d|(?:^|\s)@[\w.]{3,}/,
});

export function hasMeaningfulText(value: string): boolean {
  return new Set(value.toLowerCase().match(/[\p{L}\p{N}]/gu) ?? []).size >= MIN_DISTINCT_SYMBOLS;
}

export function isFieldComplete(field: keyof typeof FIELD_MIN_LENGTH, value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const text = value.trim();
  return text.length >= FIELD_MIN_LENGTH[field] && hasMeaningfulText(text) && (FIELD_PATTERN[field]?.test(text) ?? true);
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

/**
 * A pure completeness calculation. It only inspects card text and never calls AI,
 * reads storage, uses time, or changes the supplied task.
 */
export function scoreTask(task: TaskCard): TaskScore {
  const breakdown: ScoreBreakdown = {
    contextAndNeed: isFieldComplete('context', task?.context) && isFieldComplete('need', task?.need) ? SCORE_RULES.contextAndNeed.points : 0,
    dataAndMaterials: isFieldComplete('data', task?.data) ? SCORE_RULES.dataAndMaterials.points : 0,
    expectedResult: isFieldComplete('expectedResult', task?.expectedResult) ? SCORE_RULES.expectedResult.points : 0,
    successCriteria: isFieldComplete('successCriteria', task?.successCriteria) ? SCORE_RULES.successCriteria.points : 0,
    constraints: isFieldComplete('constraints', task?.constraints) ? SCORE_RULES.constraints.points : 0,
    users: isFieldComplete('users', task?.users) ? SCORE_RULES.users.points : 0,
    businessInteraction: isFieldComplete('contact', task?.contact) && isFieldComplete('interactionFormat', task?.interactionFormat) ? SCORE_RULES.businessInteraction.points : 0,
  };

  const total = Object.values(breakdown).reduce((sum, points) => sum + points, 0);
  const missing = (Object.keys(SCORE_RULES) as (keyof ScoreBreakdown)[])
    .filter((key) => breakdown[key] === 0)
    .map((key) => ({ key, ...SCORE_RULES[key] }));

  return { total, level: readinessLevel(total), breakdown, missing };
}
