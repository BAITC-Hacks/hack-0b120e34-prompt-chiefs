import type { TaskCard, Team, Proposal } from '../types/domain';

export const seedDrafts = [
  { text: 'We need help with support tickets.', industry: 'SaaS' },
  { text: 'Warehouse managers need to see delays. We have shipment CSV exports.', industry: 'Logistics' },
  { text: 'Students cannot find available tutoring slots. A searchable timetable would help.', industry: 'Education' },
  { text: 'Our shop wastes fresh products. We have sales history and want a weekly forecast with less than 20% error.', industry: 'Retail' },
  { text: 'Volunteers manually count trees. We need a map for coordinators using public locations, without personal data, in two weeks.', industry: 'Environment' },
];

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

seedTasks.push(
  { ...blankTask(), id: 't3', title: 'Find tutoring slots', industry: 'Education', context: seedDrafts[2].text, published: true },
  { ...blankTask(), id: 't4', title: 'Forecast fresh product demand', industry: 'Retail', context: 'Our shop discards unsold fresh products every week.', need: 'Forecast weekly demand to reduce food waste.', users: 'Shop buyers and store managers.', data: 'Two years of anonymized daily sales in CSV.', expectedResult: 'A weekly forecast dashboard with CSV import.', successCriteria: '', constraints: 'A local prototype within two weeks.', published: true },
  { ...blankTask(), id: 't5', title: 'Map urban trees', industry: 'Environment', context: seedDrafts[4].text, need: 'Replace manual counting with a searchable public map.', users: 'Volunteer coordinators.', data: 'Public tree coordinates and species in CSV.', expectedResult: 'Interactive map with species filters.', successCriteria: 'All 100 sample trees appear at correct coordinates.', contact: 'trees@example.com', interactionFormat: 'Weekly consultation and written feedback within two days.', published: true },
);

export const seedTeams: Team[] = [
  { id: 'team4', name: 'Green Code', interests: ['Environment'], skills: ['Maps', 'UX'], technologies: ['React', 'Leaflet'] },
  { id: 'team5', name: 'Study Makers', interests: ['Education'], skills: ['Frontend', 'Research'], technologies: ['TypeScript', 'React'] },
  { id: 'team1', name: 'Vector Lab', interests: ['AI', 'SaaS'], skills: ['ML', 'UX'], technologies: ['Python', 'React'] },
  { id: 'team2', name: 'ByteForge', interests: ['Logistics', 'Analytics'], skills: ['Data', 'Frontend'], technologies: ['TypeScript', 'Python'] },
  { id: 'team3', name: 'Nova Stack', interests: ['Automation'], skills: ['Backend', 'AI'], technologies: ['Node.js', 'PostgreSQL'] }
];

export const seedProposals: Proposal[] = [
  { id: 'p2', taskId: 't1', teamId: 'team3', solutionIdea: 'Explainable routing rules with a review queue.', plan: 'Inspect labels, implement rules, evaluate and demo.', timeline: '4 days', prototypeUrl: 'https://example.com/routing', status: 'PENDING', createdAt: '2026-09-22T12:00:00.000Z' },
  { id: 'p3', taskId: 't2', teamId: 'team2', solutionIdea: 'Shipment delay dashboard.', plan: 'Import CSV, chart delays, validate with managers.', timeline: '5 days', prototypeUrl: 'https://example.com/logistics', status: 'PENDING', createdAt: '2026-09-22T12:00:00.000Z' },
  { id: 'p4', taskId: 't3', teamId: 'team5', solutionIdea: 'Searchable tutoring timetable.', plan: 'Interview coordinator, mock timetable, usability test.', timeline: '3 days', prototypeUrl: 'https://example.com/study', status: 'PENDING', createdAt: '2026-09-22T12:00:00.000Z' },
  { id: 'p5', taskId: 't5', teamId: 'team4', solutionIdea: 'Public tree map.', plan: 'Import coordinates, map locations, verify sample.', timeline: '7 days', prototypeUrl: 'https://example.com/trees', status: 'PENDING', createdAt: '2026-09-22T12:00:00.000Z' },
  { id: 'p1', taskId: 't1', teamId: 'team1', solutionIdea: 'Lightweight text classifier with a confidence view for agents.', plan: 'Baseline → evaluation → UI integration.', timeline: '3 days', prototypeUrl: 'https://example.com/demo', status: 'PENDING', createdAt: '2026-09-22T12:00:00.000Z' }
];
