import type { TaskCard, Team, Proposal } from '../types/domain';

export const blankTask = (): TaskCard => ({
  id: crypto.randomUUID(), title: '', industry: '', context: '', need: '', users: '', data: '',
  constraints: '', expectedResult: '', successCriteria: '', contact: '', interactionFormat: '',
  published: false, createdAt: new Date().toISOString(),
});

export const feedbackAnalysisDemo = (): TaskCard => ({
  ...blankTask(),
  title: 'Automate customer feedback analysis',
  industry: 'Customer experience',
  context: 'Customer feedback arrives through surveys, app reviews, and support emails, but repeated issues are hard to spot quickly.',
});

export const seedTasks: TaskCard[] = [
  {
    id: 't1', title: 'Reduce support ticket triage time', industry: 'SaaS',
    context: 'Support agents manually read and route several hundred incoming tickets each week.',
    need: 'We need a prototype that helps classify and prioritize new tickets before an agent reviews them.',
    users: 'Customer support agents and team leads.',
    data: 'An anonymized CSV export with ticket text, category and priority labels can be provided.',
    constraints: 'Prototype only; no production integration. Demo must run locally.',
    expectedResult: 'A working web prototype that predicts a category and priority for a new ticket.',
    successCriteria: 'At least 80% category accuracy on the supplied validation set and a demo response under 3 seconds.',
    contact: 'product@demo.company', interactionFormat: 'Two 20-minute consultations during the project.',
    published: true, createdAt: '2026-09-20T10:00:00.000Z'
  },
  {
    id: 't2', title: 'Warehouse delay dashboard', industry: 'Logistics',
    context: 'Managers see shipment delays only after customers complain.',
    need: 'Create something that makes risky delayed shipments visible earlier.',
    users: 'Warehouse managers.', data: '', constraints: '',
    expectedResult: 'Interactive dashboard prototype.', successCriteria: '',
    contact: 'manager@demo.company', interactionFormat: 'Weekly feedback call.',
    published: true, createdAt: '2026-09-21T11:00:00.000Z'
  }
];

export const seedTeams: Team[] = [
  { id: 'team1', name: 'Vector Lab', interests: ['AI', 'SaaS'], skills: ['ML', 'UX'], technologies: ['Python', 'React'] },
  { id: 'team2', name: 'ByteForge', interests: ['Logistics', 'Analytics'], skills: ['Data', 'Frontend'], technologies: ['TypeScript', 'Python'] },
  { id: 'team3', name: 'Nova Stack', interests: ['Automation'], skills: ['Backend', 'AI'], technologies: ['Node.js', 'PostgreSQL'] }
];

export const seedProposals: Proposal[] = [
  { id: 'p1', taskId: 't1', teamId: 'team1', solutionIdea: 'Lightweight text classifier with a confidence view for agents.', plan: 'Baseline → evaluation → UI integration.', timeline: '3 days', prototypeUrl: 'https://example.com/demo', status: 'PENDING', createdAt: '2026-09-22T12:00:00.000Z' }
];
