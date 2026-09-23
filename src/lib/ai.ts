import type { TaskCard } from '../types/domain';
import { scoreTask } from './scoring';

export type EditableTaskField = Exclude<keyof TaskCard, 'id' | 'published' | 'createdAt'>;
export type ClarifyingQuestion = {
  id: string;
  field: EditableTaskField;
  question: string;
  mode: 'replace' | 'append';
};

export interface AiAdapter {
  getClarifyingQuestions(task: TaskCard): Promise<ClarifyingQuestion[]>;
  applyAnswers(task: TaskCard, questions: ClarifyingQuestion[], answers: Record<string, string>): Promise<TaskCard>;
}

const missingQuestions: Record<string, Omit<ClarifyingQuestion, 'id'>> = {
  contextAndNeed: { field: 'need', question: 'What specific change or outcome do you need from a student team?', mode: 'replace' },
  dataAndMaterials: { field: 'data', question: 'What data, examples, documents, or materials can you provide to the team?', mode: 'replace' },
  expectedResult: { field: 'expectedResult', question: 'What concrete result or prototype should the team deliver by the end?', mode: 'replace' },
  successCriteria: { field: 'successCriteria', question: 'How will you judge whether the result is useful or successful?', mode: 'replace' },
  constraints: { field: 'constraints', question: 'Which deadlines, access limits, technologies, or other constraints should the team know?', mode: 'replace' },
  users: { field: 'users', question: 'Who will use or benefit from the solution, and in what situation?', mode: 'replace' },
  businessInteraction: { field: 'interactionFormat', question: 'How can the business work with the team: consultations, feedback, or access to experts?', mode: 'replace' },
};

const specificityQuestions: Omit<ClarifyingQuestion, 'id'>[] = [
  { field: 'context', question: 'What important detail about the current situation would help a team understand the problem better?', mode: 'append' },
  { field: 'users', question: 'What is one concrete user need or pain point the solution should address?', mode: 'append' },
  { field: 'successCriteria', question: 'What measurable sign would tell you the proposed solution is moving in the right direction?', mode: 'append' },
];

function withIds(items: Omit<ClarifyingQuestion, 'id'>[]) {
  return items.slice(0, 3).map((item, index) => ({ ...item, id: `doctor-${index + 1}` }));
}

function applyProvidedAnswers(task: TaskCard, questions: ClarifyingQuestion[], answers: Record<string, string>): TaskCard {
  const next = { ...task };
  for (const question of questions) {
    const answer = answers[question.id]?.trim();
    if (!answer) continue;
    const current = next[question.field];
    next[question.field] = question.mode === 'append' && current.trim() ? `${current.trim()}\n${answer}` : answer;
  }
  return next;
}

// This adapter never invents task data. It only asks for missing facts and copies answers supplied by a human.
export const mockAiAdapter: AiAdapter = {
  async getClarifyingQuestions(task) {
    const gaps = scoreTask(task).missing.map((item) => missingQuestions[item.key]);
    const questions = [...gaps];
    for (const followUp of specificityQuestions) {
      if (questions.length >= 3) break;
      if (!questions.some((question) => question.field === followUp.field)) questions.push(followUp);
    }
    return withIds(questions);
  },
  async applyAnswers(task, questions, answers) {
    return applyProvidedAnswers(task, questions, answers);
  },
};

const allowedFields = new Set<EditableTaskField>([
  'title', 'industry', 'context', 'need', 'users', 'data', 'constraints',
  'expectedResult', 'successCriteria', 'contact', 'interactionFormat',
]);

function parseLiveQuestions(payload: unknown): ClarifyingQuestion[] | null {
  if (!payload || typeof payload !== 'object' || !Array.isArray((payload as { questions?: unknown }).questions)) return null;
  const rawQuestions = (payload as { questions: unknown[] }).questions;
  const parsed = rawQuestions.map((item, index) => {
    if (!item || typeof item !== 'object') return null;
    const candidate = item as { field?: unknown; question?: unknown };
    if (typeof candidate.field !== 'string' || !allowedFields.has(candidate.field as EditableTaskField)) return null;
    if (typeof candidate.question !== 'string' || !candidate.question.trim()) return null;
    return { id: `live-${index + 1}`, field: candidate.field as EditableTaskField, question: candidate.question.trim(), mode: 'replace' as const };
  });
  if (parsed.some((question) => question === null)) return null;
  return parsed as ClarifyingQuestion[];
}

export function createAiAdapter(): AiAdapter {
  const endpoint = import.meta.env.VITE_TASK_DOCTOR_ENDPOINT?.trim();
  if (!endpoint) return mockAiAdapter;

  return {
    async getClarifyingQuestions(task) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ task }),
        });
        const questions = response.ok ? parseLiveQuestions(await response.json()) : null;
        return questions && questions.length >= 3 ? questions.slice(0, 3) : mockAiAdapter.getClarifyingQuestions(task);
      } catch {
        return mockAiAdapter.getClarifyingQuestions(task);
      }
    },
    async applyAnswers(task, questions, answers) {
      return applyProvidedAnswers(task, questions, answers);
    },
  };
}
