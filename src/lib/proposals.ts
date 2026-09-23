import type { Proposal, ProposalStatus } from '../types/domain';

export const CONFIRMED_PROGRESS_POINTS = 10;

export function isIsoTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value;
}

export function isProposalStatus(value: unknown): value is ProposalStatus {
  return value === 'PENDING' || value === 'ACCEPTED' || value === 'REJECTED';
}

export function isConfirmedProgress(value: unknown): value is NonNullable<Proposal['progress']> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const progress = value as Record<string, unknown>;
  return typeof progress.evidence === 'string' && !!progress.evidence.trim()
    && isIsoTimestamp(progress.confirmedAt) && progress.points === CONFIRMED_PROGRESS_POINTS;
}

function assertProgressInvariant(proposal: Proposal) {
  if (proposal.progress !== undefined
    && (proposal.status !== 'ACCEPTED' || !isConfirmedProgress(proposal.progress))) {
    throw new Error('Confirmed progress requires an accepted proposal, evidence, timestamp and exactly 10 points.');
  }
}

// UI can use this to hide/disable decision controls after confirmation.
export function canChangeProposalStatus(proposal: Proposal): boolean {
  return proposal.progress === undefined;
}

// Call only after an explicit business decision; no automatic team selection.
export function changeProposalStatus(proposal: Proposal, status: ProposalStatus): Proposal {
  if (!isProposalStatus(proposal.status) || !isProposalStatus(status)) {
    throw new Error('Invalid proposal status.');
  }
  assertProgressInvariant(proposal);
  if (!canChangeProposalStatus(proposal) && status !== proposal.status) {
    throw new Error('A proposal with confirmed progress is final.');
  }
  return { ...proposal, status };
}

// One confirmed stage per proposal in this MVP. Repeated confirmation is idempotent.
export function confirmProposalProgress(
  proposal: Proposal, evidence: string, confirmedAt = new Date().toISOString(),
): Proposal {
  assertProgressInvariant(proposal);
  if (proposal.status !== 'ACCEPTED') throw new Error('Accept the proposal before confirming progress.');
  if (proposal.progress) return proposal;
  const progress = {
    evidence: typeof evidence === 'string' ? evidence.trim() : '',
    confirmedAt, points: CONFIRMED_PROGRESS_POINTS,
  };
  if (!isConfirmedProgress(progress)) throw new Error('Provide evidence and a valid confirmation timestamp.');
  return { ...proposal, progress };
}

// Also used at the persistence boundary, including for callers not using the helpers yet.
export function assertFinalizedProposalsPreserved(previous: Proposal[], next: Proposal[]): void {
  const byId = new Map(next.map(proposal => [proposal.id, proposal]));
  for (const proposal of previous) {
    if (!proposal.progress) continue;
    const updated = byId.get(proposal.id);
    if (!updated || updated.status !== 'ACCEPTED'
      || updated.taskId !== proposal.taskId || updated.teamId !== proposal.teamId
      || updated.progress?.evidence !== proposal.progress.evidence
      || updated.progress?.confirmedAt !== proposal.progress.confirmedAt
      || updated.progress?.points !== CONFIRMED_PROGRESS_POINTS) {
      throw new Error('Confirmed progress cannot be removed, reassigned or changed. Use explicit demo reset to start over.');
    }
  }
}
