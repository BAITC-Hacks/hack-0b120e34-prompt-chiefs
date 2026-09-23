import type { TaskCard, Team } from '../types/domain';
import { scoreTask } from './scoring';

// The brief allows recommending WORKING tasks and above (40+ points).
export const MIN_RECOMMENDED_SCORE = 40;

/**
 * Suggests published tasks whose topic matches a team's interests, best readiness first.
 * Advisory only: it never hides catalog tasks, limits proposals or assigns a team.
 */
export function recommendTasks(team: Team, tasks: TaskCard[]): TaskCard[] {
  const interests = new Set(team.interests.map(interest => interest.trim().toLowerCase()));
  return tasks
    .filter(task => task.published && interests.has(task.industry.trim().toLowerCase()))
    .map(task => ({ task, score: scoreTask(task).total }))
    .filter(({ score }) => score >= MIN_RECOMMENDED_SCORE)
    .sort((a, b) => b.score - a.score)
    .map(({ task }) => task);
}
