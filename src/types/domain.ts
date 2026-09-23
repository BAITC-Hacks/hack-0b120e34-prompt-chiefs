export type ReadinessLevel = 'DRAFT' | 'WORKING' | 'READY' | 'PRIORITY';

export type TaskCard = {
  id: string;
  title: string;
  industry: string;
  context: string;
  need: string;
  users: string;
  data: string;
  constraints: string;
  expectedResult: string;
  successCriteria: string;
  contact: string;
  interactionFormat: string;
  published: boolean;
  createdAt: string;
};

export type ScoreBreakdown = {
  contextAndNeed: number;
  dataAndMaterials: number;
  expectedResult: number;
  successCriteria: number;
  constraints: number;
  users: number;
  businessInteraction: number;
};

export type TaskScore = {
  total: number;
  level: ReadinessLevel;
  breakdown: ScoreBreakdown;
  missing: { key: keyof ScoreBreakdown; label: string; points: number; tip: string }[];
};

export type Team = {
  id: string;
  name: string;
  interests: string[];
  skills: string[];
  technologies: string[];
};

export type ProposalStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';
export type Proposal = {
  id: string;
  taskId: string;
  teamId: string;
  solutionIdea: string;
  plan: string;
  timeline: string;
  prototypeUrl: string;
  status: ProposalStatus;
  createdAt: string;
};
