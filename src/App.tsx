import { FormEvent, useMemo, useState } from 'react';
import { blankTask, feedbackAnalysisDemo, seedTeams } from './data/seed';
import { createAiAdapter, type ClarifyingQuestion } from './lib/ai';
import { scoreTask } from './lib/scoring';
import { loadProposals, loadTasks, resetDemoData, saveProposals, saveTasks, storageWarning } from './lib/storage';
import type { Proposal, TaskCard } from './types/domain';
import { ScorePanel } from './components/ScorePanel';
import { TaskEditor, fields } from './components/TaskEditor';
import './styles.css';

type View = 'catalog' | 'builder' | 'proposals';
type DoctorState = 'idle' | 'loading' | 'error';

const taskDoctor = createAiAdapter();

function displayTitle(task: TaskCard) {
  return task.title.trim() || 'Untitled business challenge';
}

export default function App() {
  const [view, setView] = useState<View>('catalog');
  const [tasks, setTasks] = useState<TaskCard[]>(loadTasks);
  const [proposals, setProposals] = useState<Proposal[]>(loadProposals);
  const [draft, setDraft] = useState<TaskCard>(blankTask);
  const [brief, setBrief] = useState('');
  const [questions, setQuestions] = useState<ClarifyingQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [doctorState, setDoctorState] = useState<DoctorState>('idle');
  const [builderError, setBuilderError] = useState('');
  const [publicationOpen, setPublicationOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [proposalTeamId, setProposalTeamId] = useState('');
  const [proposalDraft, setProposalDraft] = useState({ solutionIdea: '', plan: '', timeline: '', prototypeUrl: '' });
  const [proposalError, setProposalError] = useState('');
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [industryFilter, setIndustryFilter] = useState('ALL');
  const [progressEvidence, setProgressEvidence] = useState<Record<string, string>>({});
  const [decisionTask, setDecisionTask] = useState('ALL');

  const catalog = useMemo(
    () => [...tasks].filter((task) => task.published).sort((a, b) => scoreTask(b).total - scoreTask(a).total),
    [tasks],
  );
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null;
  const allAnswersProvided = questions.length >= 3 && questions.every((question) => answers[question.id]?.trim());
  const industries = useMemo(() => [...new Set(catalog.map((task) => task.industry.trim()).filter(Boolean))].sort(), [catalog]);
  const filteredCatalog = catalog.filter((task) => (levelFilter === 'ALL' || scoreTask(task).level === levelFilter) && (industryFilter === 'ALL' || task.industry === industryFilter));

  function openBuilder() {
    setView('builder');
    setBuilderError('');
  }

  function startFromBrief() {
    if (!brief.trim()) {
      setBuilderError('Add a short description first. The wording is kept as business-provided context.');
      return;
    }
    setDraft({ ...blankTask(), context: brief.trim() });
    setQuestions([]);
    setAnswers({});
    setBuilderError('');
  }

  function useDemoBrief() {
    const demo = feedbackAnalysisDemo();
    setDraft(demo);
    setBrief(demo.context);
    setQuestions([]);
    setAnswers({});
    setBuilderError('Demo brief loaded. Run Task Doctor, then replace or expand any details with your own facts.');
  }

  async function askAi() {
    setDoctorState('loading');
    setBuilderError('');
    try {
      const nextQuestions = await taskDoctor.getClarifyingQuestions(draft);
      if (nextQuestions.length < 3) throw new Error('The Task Doctor needs three questions.');
      setQuestions(nextQuestions);
      setAnswers({});
      setDoctorState('idle');
    } catch {
      setDoctorState('error');
      setBuilderError('Task Doctor is unavailable. Check the optional AI endpoint or continue editing the card directly.');
    }
  }

  async function applyAnswers() {
    if (!allAnswersProvided) {
      setBuilderError('Answer all three questions before applying them to the card.');
      return;
    }
    const updated = await taskDoctor.applyAnswers(draft, questions, answers);
    setDraft(updated);
    setQuestions([]);
    setAnswers({});
    setBuilderError('Answers applied. You can edit every field before publishing.');
  }

  function confirmPublish() {
    if (!draft.title.trim() || !draft.context.trim()) {
      setBuilderError('Provide a title and business description. Other missing details lower readiness but do not prevent publication.');
      setPublicationOpen(false);
      return;
    }
    const next = { ...draft, published: true };
    const updated = [...tasks.filter((task) => task.id !== next.id), next];
    setTasks(updated);
    saveTasks(updated);
    setPublicationOpen(false);
    setDraft(blankTask());
    setBrief('');
    setQuestions([]);
    setAnswers({});
    setView('catalog');
    setLevelFilter('ALL');
    setIndustryFilter('ALL');
  }

  function openProposal(taskId: string) {
    setSelectedTaskId(taskId);
    setProposalTeamId('');
    setProposalDraft({ solutionIdea: '', plan: '', timeline: '', prototypeUrl: '' });
    setProposalError('');
  }

  function submitProposal(event: FormEvent) {
    event.preventDefault();
    if (!selectedTaskId || !proposalTeamId || !Object.values(proposalDraft).every((value) => value.trim())) {
      setProposalError('Choose a team and complete every proposal field.');
      return;
    }
    try {
      const url = new URL(proposalDraft.prototypeUrl);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Unsupported protocol');
    } catch {
      setProposalError('Prototype URL must include http:// or https://.');
      return;
    }
    const proposal: Proposal = {
      id: crypto.randomUUID(), taskId: selectedTaskId, teamId: proposalTeamId,
      solutionIdea: proposalDraft.solutionIdea.trim(), plan: proposalDraft.plan.trim(),
      timeline: proposalDraft.timeline.trim(), prototypeUrl: proposalDraft.prototypeUrl.trim(),
      status: 'PENDING', createdAt: new Date().toISOString(),
    };
    const next = [proposal, ...proposals];
    setProposals(next);
    saveProposals(next);
    setSelectedTaskId(null);
  }

  function setStatus(id: string, status: Proposal['status']) {
    const next = proposals.map((proposal) => proposal.id === id ? { ...proposal, status } : proposal);
    setProposals(next);
    saveProposals(next);
  }

  function confirmProgress(id: string) {
    const evidence = progressEvidence[id]?.trim();
    if (!evidence) return;
    const next = proposals.map(proposal => proposal.id === id && proposal.status === 'ACCEPTED' && !proposal.progress
      ? { ...proposal, progress: { evidence, confirmedAt: new Date().toISOString(), points: 10 } } : proposal);
    saveProposals(next);
    setProposals(next);
  }

  function editTask(task: TaskCard) {
    setDraft({ ...task, published: false });
    setBrief(task.context);
    setQuestions([]);
    setAnswers({});
    openBuilder();
  }

  function resetDemo() {
    const seeded = resetDemoData();
    setTasks(seeded.tasks);
    setProposals(seeded.proposals);
    setDraft(blankTask());
    setBrief('');
    setQuestions([]);
    setAnswers({});
    setSelectedTaskId(null);
    setView('catalog');
  }

  return <div className="shell">
    {storageWarning && <p role="alert" className="inline-message">{storageWarning}</p>}
    <header>
      <button className="brand-button" onClick={() => setView('catalog')}><span className="brand">TASKREADY</span><span>AI Sana business challenge marketplace</span></button>
      <nav aria-label="Primary navigation">
        <button onClick={() => setView('catalog')} className={view === 'catalog' ? 'active' : ''}>Catalog</button>
        <button onClick={openBuilder} className={view === 'builder' ? 'active' : ''}>Create task</button>
        <button onClick={() => setView('proposals')} className={view === 'proposals' ? 'active' : ''}>Proposals</button>
        <button className="quiet" onClick={resetDemo}>Reset demo data</button>
      </nav>
    </header>

    {view === 'builder' && <main className="builder-layout">
      <section className="panel workspace-panel">
        <div className="eyebrow">BUSINESS WORKSPACE</div>
        <h1>Turn a vague need into a task teams can actually start.</h1>
        <p className="lede">Start with your own words. Task Doctor only asks about missing facts; it never makes business decisions or assigns a score.</p>
        <section className="brief-box" aria-label="Start from a business description">
          <label><span>Rough business description</span><textarea value={brief} onChange={(event) => setBrief(event.target.value)} placeholder="For example: We receive customer feedback from many channels and cannot see recurring problems quickly." /></label>
          <div className="brief-actions"><button className="secondary" onClick={startFromBrief}>Use this description</button><button className="text-button" onClick={useDemoBrief}>Load feedback-analysis demo</button></div>
        </section>
        <TaskEditor task={draft} onChange={setDraft} />
        <p>Readiness here is a preview. Only your confirmed version earns points and changes catalog ranking.</p>
        {builderError && <div className="inline-message" role="status">{builderError}</div>}
        <div className="actions">
          <button className="secondary" onClick={askAi} disabled={doctorState === 'loading'}>{doctorState === 'loading' ? 'Task Doctor is reviewing…' : 'AI Task Doctor'}</button>
          <button className="primary" onClick={() => setPublicationOpen(true)}>Confirm & publish</button>
        </div>
        {doctorState === 'error' && <div className="error-state">The offline fallback remains available after reloading this page.</div>}
        {questions.length > 0 && <section className="ai-box" aria-live="polite">
          <div><div className="eyebrow">AI TASK DOCTOR</div><h3>Three questions to make this brief actionable</h3><p>Answers are copied into the editable card exactly as you provide them.</p></div>
          {questions.map((question) => <label key={question.id}><span>{question.question}</span><textarea value={answers[question.id] || ''} onChange={(event) => setAnswers({ ...answers, [question.id]: event.target.value })} /></label>)}
          <button className="primary" onClick={applyAnswers} disabled={!allAnswersProvided}>Apply answers to task card</button>
        </section>}
      </section>
      <ScorePanel task={draft} />
    </main>}

    {view === 'catalog' && <main>
      <div className="hero"><div><div className="eyebrow">OPEN CATALOG</div><h1>Better briefs rise. Every team can still apply.</h1><p className="lede">Readiness changes ordering only. Every business-confirmed challenge remains open to student teams.</p></div><button className="primary" onClick={openBuilder}>Post a challenge</button></div>
      {catalog.length === 0 ? <div className="empty-state"><h2>No published tasks yet</h2><p>Create a task, review it, and use Confirm & publish to add the first challenge.</p><button className="primary" onClick={openBuilder}>Create task</button></div> : <>
        <section className="catalog-filters" aria-label="Catalog filters"><label><span>Readiness</span><select value={levelFilter} onChange={(event) => setLevelFilter(event.target.value)}><option value="ALL">All readiness levels</option><option value="DRAFT">Draft</option><option value="WORKING">Working</option><option value="READY">Ready</option><option value="PRIORITY">Priority</option></select></label><label><span>Industry / topic</span><select value={industryFilter} onChange={(event) => setIndustryFilter(event.target.value)}><option value="ALL">All industries</option>{industries.map((industry) => <option key={industry} value={industry}>{industry}</option>)}</select></label><span className="filter-note">Showing {filteredCatalog.length} of {catalog.length} published tasks</span></section>
        {filteredCatalog.length === 0 ? <div className="empty-state"><h2>No tasks match these filters</h2><p>Every confirmed task remains in the catalog. Change a filter to view it.</p><button className="secondary" onClick={() => { setLevelFilter('ALL'); setIndustryFilter('ALL'); }}>Clear filters</button></div> : <div className="cards">{filteredCatalog.map((task, index) => { const score = scoreTask(task); const rank = catalog.findIndex((item) => item.id === task.id) + 1; return <article className="task-card" key={task.id}><div className="card-top"><span>#{rank} · {task.industry || 'Open topic'}</span><b className={`pill ${score.level.toLowerCase()}`}>{score.total} · {score.level}</b></div><h2>{displayTitle(task)}</h2><p>{task.need || task.context || 'Business details will be shared after the team opens this challenge.'}</p><div className="meta">For: {task.users || 'Not specified yet'}</div><button className="secondary" onClick={() => openProposal(task.id)}>Open task & submit proposal</button><button onClick={() => editTask(task)}>Edit as business</button></article>; })}</div>}
      </>}
    </main>}

    {view === 'proposals' && <main>
      <div className="hero"><div><div className="eyebrow">BUSINESS DECISION</div><h1>Humans choose the team.</h1><p className="lede">Review each proposal in full, then manually accept or reject it.</p></div></div>
      <label>Compare proposals for task<select value={decisionTask} onChange={e => setDecisionTask(e.target.value)}><option value="ALL">All tasks</option>{catalog.map(task => <option key={task.id} value={task.id}>{displayTitle(task)}</option>)}</select></label>
<section className="panel team-points"><h2>Confirmed team progress</h2>{seedTeams.map(team => <p key={team.id}>{team.name}: {proposals.filter(p => p.teamId === team.id).reduce((sum, p) => sum + (p.progress?.points ?? 0), 0)} points</p>)}</section>
{proposals.filter(p => decisionTask === 'ALL' || p.taskId === decisionTask).length === 0 ? <div className="empty-state"><h2>No proposals yet</h2><p>Published tasks are visible in the catalog for student teams to explore and propose on.</p></div> : <div className="proposal-list">{proposals.filter(p => decisionTask === 'ALL' || p.taskId === decisionTask).map((proposal) => {
        const task = tasks.find((item) => item.id === proposal.taskId);
        const team = seedTeams.find((item) => item.id === proposal.teamId);
        return <article className="proposal-card" key={proposal.id}><div className="card-top"><span>{team?.name || proposal.teamId}</span><b className={`pill ${proposal.status.toLowerCase()}`}>{proposal.status}</b></div><h2>{task ? displayTitle(task) : 'Published task'}</h2><p>Skills: {team?.skills.join(', ')} · Technologies: {team?.technologies.join(', ')} · Interests: {team?.interests.join(', ')}</p><dl><div><dt>Solution idea</dt><dd>{proposal.solutionIdea}</dd></div><div><dt>Plan</dt><dd>{proposal.plan}</dd></div><div><dt>Timeline</dt><dd>{proposal.timeline}</dd></div><div><dt>Prototype</dt><dd><a href={proposal.prototypeUrl} target="_blank" rel="noreferrer">{proposal.prototypeUrl}</a></dd></div></dl><div className="actions"><button onClick={() => setStatus(proposal.id, 'REJECTED')}>Reject</button><button className="primary" onClick={() => setStatus(proposal.id, 'ACCEPTED')}>Accept</button></div>{proposal.progress ? <p>Confirmed stage: {proposal.progress.evidence} · +{proposal.progress.points} points · {new Date(proposal.progress.confirmedAt).toLocaleString()}</p> : proposal.status === 'ACCEPTED' && <section><label>Completed stage and evidence<textarea value={progressEvidence[proposal.id] || ''} onChange={e => setProgressEvidence({ ...progressEvidence, [proposal.id]: e.target.value })} /></label><button disabled={!progressEvidence[proposal.id]?.trim()} onClick={() => confirmProgress(proposal.id)}>Business: confirm completed stage (+10 points)</button></section>}</article>;
      })}</div>}
    </main>}

    {publicationOpen && <div className="modal-backdrop" role="presentation"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="publish-title"><div className="eyebrow">HUMAN CONFIRMATION</div><h2 id="publish-title">Publish this task to the catalog?</h2><p><b>{displayTitle(draft)}</b> will become visible to every student team. Its readiness score changes ranking, never access.</p><div className="actions"><button onClick={() => setPublicationOpen(false)}>Keep editing</button><button className="primary" onClick={confirmPublish}>Publish task</button></div></section></div>}

    {selectedTask && <div className="modal-backdrop" role="presentation"><section className="modal proposal-modal" role="dialog" aria-modal="true" aria-labelledby="proposal-title"><div className="eyebrow">STUDENT PROPOSAL</div><h2 id="proposal-title">{displayTitle(selectedTask)}</h2><dl className="task-details">{fields.map(field => <div key={field.key}><dt>{field.label}</dt><dd>{String(selectedTask[field.key]) || 'Not specified — requires clarification'}</dd></div>)}</dl><ScorePanel task={selectedTask} /><p>Choose your own team and provide the complete proposal for business review.</p><form onSubmit={submitProposal}><label><span>Student team</span><select value={proposalTeamId} onChange={(event) => setProposalTeamId(event.target.value)}><option value="">Choose a team</option>{seedTeams.map((team) => <option key={team.id} value={team.id}>{team.name} — {team.skills.join(', ')}</option>)}</select></label><label><span>Solution idea</span><textarea value={proposalDraft.solutionIdea} onChange={(event) => setProposalDraft({ ...proposalDraft, solutionIdea: event.target.value })} /></label><label><span>Plan</span><textarea value={proposalDraft.plan} onChange={(event) => setProposalDraft({ ...proposalDraft, plan: event.target.value })} /></label><label><span>Timeline</span><input value={proposalDraft.timeline} onChange={(event) => setProposalDraft({ ...proposalDraft, timeline: event.target.value })} placeholder="For example: 3 days" /></label><label><span>Prototype URL</span><input type="url" value={proposalDraft.prototypeUrl} onChange={(event) => setProposalDraft({ ...proposalDraft, prototypeUrl: event.target.value })} placeholder="https://…" /></label>{proposalError && <div className="inline-message">{proposalError}</div>}<div className="actions"><button type="button" onClick={() => setSelectedTaskId(null)}>Cancel</button><button className="primary" type="submit">Submit for business review</button></div></form></section></div>}
  </div>;
}
