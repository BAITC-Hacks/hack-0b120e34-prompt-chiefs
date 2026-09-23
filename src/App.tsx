import { FormEvent, useEffect, useMemo, useState } from 'react';
import { blankTask, feedbackAnalysisDemo, seedDrafts, seedTeams } from './data/seed';
import { createAiAdapter, toAiResponse, type AiDiagnostics, type AiResponse, type ClarifyingQuestion } from './lib/ai';
import { canChangeProposalStatus } from './lib/proposals';
import { recommendTasks } from './lib/recommendations';
import { scoreTask } from './lib/scoring';
import { confirmProposalProgress, loadProposals, loadTasks, resetDemoData, saveProposals, saveTasks, setProposalStatus, storageWarningCodes } from './lib/storage';
import type { Proposal, TaskCard } from './types/domain';
import { AiContract } from './components/AiContract';
import { ScorePanel } from './components/ScorePanel';
import { TaskEditor, getTaskFields } from './components/TaskEditor';
import { DemoJourney } from './components/DemoJourney';
import { Preferences } from './components/Preferences';
import { createTranslator, displayIndustry, loadPreference, savePreference, type Locale, type Theme } from './lib/i18n';
import './styles.css';

type View = 'catalog' | 'builder' | 'proposals';
type DoctorState = 'idle' | 'loading' | 'error';

const taskDoctor = createAiAdapter();

function displayTitle(task: TaskCard, fallback: string) {
  return task.title.trim() || fallback;
}

export default function App() {
  const [locale, setLocale] = useState<Locale>(() => loadPreference('taskready.locale', 'ru'));
  const [theme, setTheme] = useState<Theme>(() => loadPreference('taskready.theme', 'light'));
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
  const [aiReply, setAiReply] = useState<AiResponse | null>(null);
  const [aiDiagnostics, setAiDiagnostics] = useState<AiDiagnostics>(() => taskDoctor.getDiagnostics());
  const [recommendTeamId, setRecommendTeamId] = useState('');
  const t = createTranslator(locale);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.lang = locale;
    savePreference('taskready.locale', locale);
    savePreference('taskready.theme', theme);
  }, [locale, theme]);

  const catalog = useMemo(
    () => [...tasks].filter((task) => task.published).sort((a, b) => scoreTask(b).total - scoreTask(a).total),
    [tasks],
  );
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null;
  const allAnswersProvided = questions.length >= 3 && questions.every((question) => answers[question.id]?.trim());
  const industries = useMemo(() => [...new Set(catalog.map((task) => task.industry.trim()).filter(Boolean))].sort(), [catalog]);
  const filteredCatalog = catalog.filter((task) => (levelFilter === 'ALL' || scoreTask(task).level === levelFilter) && (industryFilter === 'ALL' || task.industry.trim() === industryFilter));
  const recommendTeam = seedTeams.find((team) => team.id === recommendTeamId);
  const recommended = recommendTeam ? recommendTasks(recommendTeam, catalog) : [];
  const storageMessage = storageWarningCodes.map((code) => t(code === 'unreadable' ? 'storageUnreadable' : code === 'invalid' ? 'storageInvalid' : 'storageSessionOnly')).join(' ');

  function openBuilder() {
    setView('builder');
    setBuilderError('');
  }

  function startFromBrief() {
    if (!brief.trim()) {
      setBuilderError(t('shortDescriptionRequired'));
      return;
    }
    setDraft({ ...blankTask(), context: brief.trim() });
    setQuestions([]);
    setAnswers({});
    setAiReply(null);
    setBuilderError('');
  }

  function useDemoBrief() {
    const demo = feedbackAnalysisDemo();
    setDraft(demo);
    setBrief(demo.context);
    setQuestions([]);
    setAnswers({});
    setAiReply(null);
    setBuilderError(t('demoLoaded'));
  }

  function loadDraftExample(index: number) {
    const example = seedDrafts[index];
    if (!example) return;
    setBrief(example.text);
    setDraft({ ...blankTask(), context: example.text, industry: example.industry });
    setQuestions([]);
    setAnswers({});
    setAiReply(null);
    setBuilderError('');
  }

  async function askAi() {
    setDoctorState('loading');
    setBuilderError('');
    try {
      const nextQuestions = await taskDoctor.getClarifyingQuestions(draft, locale);
      setAiDiagnostics(taskDoctor.getDiagnostics());
      if (nextQuestions.length < 3) throw new Error('Missing clarification questions');
      setQuestions(nextQuestions);
      setAiReply(toAiResponse(nextQuestions));
      setAnswers({});
      setDoctorState('idle');
    } catch {
      setDoctorState('error');
      setBuilderError(t('doctorUnavailable'));
    }
  }

  async function applyAnswers() {
    if (!allAnswersProvided) {
      setBuilderError(t('needThreeAnswers'));
      return;
    }
    const updated = await taskDoctor.applyAnswers(draft, questions, answers);
    setDraft(updated);
    setQuestions([]);
    setAnswers({});
    setBuilderError(t('answersApplied'));
  }

  function confirmPublish() {
    if (!draft.title.trim() || !draft.context.trim()) {
      setBuilderError(t('titleContextRequired'));
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

  function openProposal(taskId: string, teamId = '') {
    setSelectedTaskId(taskId);
    setProposalTeamId(teamId);
    setProposalDraft({ solutionIdea: '', plan: '', timeline: '', prototypeUrl: '' });
    setProposalError('');
  }

  function submitProposal(event: FormEvent) {
    event.preventDefault();
    if (!selectedTaskId || !proposalTeamId || !Object.values(proposalDraft).every((value) => value.trim())) {
      setProposalError(t('proposalRequired'));
      return;
    }
    try {
      const url = new URL(proposalDraft.prototypeUrl);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Unsupported protocol');
    } catch {
      setProposalError(t('urlRequired'));
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

  // Domain helpers refuse invalid transitions, e.g. changing a decision after confirmed progress.
  function setStatus(id: string, status: Proposal['status']) {
    const next = setProposalStatus(proposals, id, status);
    setProposals(next);
    saveProposals(next);
  }

  function confirmProgress(id: string) {
    const evidence = progressEvidence[id]?.trim();
    if (!evidence) return;
    const next = confirmProposalProgress(proposals, id, evidence);
    setProposals(next);
    saveProposals(next);
  }

  function editTask(task: TaskCard) {
    setDraft({ ...task, published: false });
    setBrief(task.context);
    setQuestions([]);
    setAnswers({});
    setAiReply(null);
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
    {storageMessage && <p role="alert" className="inline-message">{storageMessage}</p>}
    <header>
      <button className="brand-button" onClick={() => setView('catalog')}><span className="brand">TASKREADY</span><span>{t('tagline')}</span></button>
      <nav aria-label="Primary navigation">
        <button onClick={() => setView('catalog')} className={view === 'catalog' ? 'active' : ''}>{t('catalog')}</button>
        <button onClick={openBuilder} className={view === 'builder' ? 'active' : ''}>{t('createTask')}</button>
        <button onClick={() => setView('proposals')} className={view === 'proposals' ? 'active' : ''}>{t('proposals')}</button>
        <button className="quiet" onClick={resetDemo}>{t('reset')}</button>
      </nav>
      <Preferences locale={locale} theme={theme} onLocaleChange={setLocale} onThemeChange={setTheme} t={t} />
    </header>

    {view === 'builder' && <main className="builder-layout">
      <section className="panel workspace-panel">
        <div className="eyebrow">{t('businessWorkspace')}</div>
        <h1>{t('builderTitle')}</h1>
        <p className="lede">{t('builderLead')}</p>
        <section className="brief-box" aria-label={t('roughDescription')}>
          <label><span>{t('draftExample')}</span><select value="" onChange={(event) => loadDraftExample(Number(event.target.value))}><option value="">{t('chooseDraftExample')}</option>{seedDrafts.map((example, index) => <option key={index} value={index}>{displayIndustry(example.industry, locale)} — {example.text}</option>)}</select></label>
          <label><span>{t('roughDescription')}</span><textarea value={brief} onChange={(event) => setBrief(event.target.value)} placeholder={t('roughPlaceholder')} /></label>
          <div className="brief-actions"><button className="secondary" onClick={startFromBrief}>{t('useDescription')}</button><button className="text-button" onClick={useDemoBrief}>{t('loadDemo')}</button></div>
        </section>
        <TaskEditor task={draft} onChange={setDraft} locale={locale} />
        <p>{t('readinessPreview')}</p>
        {builderError && <div className="inline-message" role="status">{builderError}</div>}
        <div className="actions">
          <button className="secondary" onClick={askAi} disabled={doctorState === 'loading'}>{doctorState === 'loading' ? t('doctorWorking') : t('assistantName')}</button>
          <button className="primary" onClick={() => setPublicationOpen(true)}>{t('confirmPublish')}</button>
        </div>
        {doctorState === 'error' && <div className="error-state">{t('doctorUnavailable')}</div>}
        {questions.length > 0 && <section className="ai-box" aria-live="polite">
          <div><div className="eyebrow">{t('assistantName')}</div><h3>{t('doctorHeading')}</h3><p>{t('assistantHint')} · {t('doctorLead')}</p></div>
          {questions.map((question) => <label key={question.id}><span>{question.question}</span><textarea value={answers[question.id] || ''} onChange={(event) => setAnswers({ ...answers, [question.id]: event.target.value })} /></label>)}
          <button className="primary" onClick={applyAnswers} disabled={!allAnswersProvided}>{t('applyAnswers')}</button>
        </section>}
        <AiContract task={draft} locale={locale} reply={aiReply} diagnostics={aiDiagnostics} t={t} />
      </section>
      <ScorePanel task={draft} locale={locale} />
    </main>}

    {view === 'catalog' && <main>
      <div className="hero"><div><div className="eyebrow">{t('openCatalog')}</div><h1>{t('catalogTitle')}</h1><p className="lede">{t('catalogLead')}</p></div><button className="primary" onClick={openBuilder}>{t('postChallenge')}</button></div>
      <DemoJourney locale={locale} />
      {catalog.length === 0 ? <div className="empty-state"><h2>{t('noTasks')}</h2><p>{t('noTasksLead')}</p><button className="primary" onClick={openBuilder}>{t('createTask')}</button></div> : <>
        <section className="catalog-filters" aria-label={t('catalog')}><label><span>{t('readiness')}</span><select value={levelFilter} onChange={(event) => setLevelFilter(event.target.value)}><option value="ALL">{t('allReadiness')}</option><option value="DRAFT">{t('draft')}</option><option value="WORKING">{t('working')}</option><option value="READY">{t('ready')}</option><option value="PRIORITY">{t('priority')}</option></select></label><label><span>{t('industry')}</span><select value={industryFilter} onChange={(event) => setIndustryFilter(event.target.value)}><option value="ALL">{t('allIndustries')}</option>{industries.map((industry) => <option key={industry} value={industry}>{displayIndustry(industry, locale)}</option>)}</select></label><span className="filter-note">{t('showing', { shown: filteredCatalog.length, total: catalog.length })}</span></section>
        <section className="panel recommendations" aria-label={t('recommendTitle')}>
          <div><h2>{t('recommendTitle')}</h2><p>{t('recommendLead')}</p></div>
          <label><span>{t('studentTeam')}</span><select value={recommendTeamId} onChange={(event) => setRecommendTeamId(event.target.value)}><option value="">{t('chooseTeamRecommend')}</option>{seedTeams.map((team) => <option key={team.id} value={team.id}>{team.name} — {team.interests.map((interest) => displayIndustry(interest, locale)).join(', ')}</option>)}</select></label>
          {recommendTeam && (recommended.length > 0
            ? <ul className="recommend-list">{recommended.map((task) => <li key={task.id}><button className="secondary" onClick={() => openProposal(task.id, recommendTeam.id)}>{displayTitle(task, t('notSpecified'))} · {scoreTask(task).total}</button></li>)}</ul>
            : <p className="filter-note">{t('recommendNone')}</p>)}
        </section>
        {filteredCatalog.length === 0 ? <div className="empty-state"><h2>{t('noMatches')}</h2><p>{t('noMatchesLead')}</p><button className="secondary" onClick={() => { setLevelFilter('ALL'); setIndustryFilter('ALL'); }}>{t('clearFilters')}</button></div> : <div className="cards">{filteredCatalog.map((task) => { const score = scoreTask(task); const rank = catalog.findIndex((item) => item.id === task.id) + 1; const level = score.level === 'DRAFT' ? t('draft') : score.level === 'WORKING' ? t('working') : score.level === 'READY' ? t('ready') : t('priority'); const isRecommended = recommended.some((item) => item.id === task.id); return <article className={`task-card level-${score.level.toLowerCase()}${isRecommended ? ' is-recommended' : ''}`} key={task.id}><div className="card-top"><span>#{rank} · {task.industry ? displayIndustry(task.industry, locale) : t('openTopic')}</span><b className={`pill ${score.level.toLowerCase()}`}>{score.total} · {level}</b></div><h2>{displayTitle(task, t('notSpecified'))}</h2>{score.level === 'DRAFT' && <p className="clarify-note">{t('needsClarification', { count: score.missing.length })}</p>}<p>{task.need || task.context || t('notSpecifiedClarify')}</p><div className="meta">{t('forUsers', { users: task.users || t('notSpecified') })}</div><div className="card-actions"><button className="secondary" onClick={() => openProposal(task.id)}>{t('openTask')}</button><button onClick={() => editTask(task)}>{t('editBusiness')}</button></div></article>; })}</div>}
      </>}
    </main>}

    {view === 'proposals' && <main>
      <div className="hero"><div><div className="eyebrow">{t('businessDecision')}</div><h1>{t('proposalsTitle')}</h1><p className="lede">{t('proposalsLead')}</p></div></div>
      <label className="decision-filter">{t('compareTask')}<select value={decisionTask} onChange={e => setDecisionTask(e.target.value)}><option value="ALL">{t('allTasks')}</option>{catalog.map(task => <option key={task.id} value={task.id}>{displayTitle(task, t('notSpecified'))}</option>)}</select></label>
<section className="panel team-points"><h2>{t('confirmedProgress')}</h2>{seedTeams.map(team => <p key={team.id}>{team.name}: {proposals.filter(p => p.teamId === team.id).reduce((sum, p) => sum + (p.progress?.points ?? 0), 0)} {t('points')}</p>)}</section>
{proposals.filter(p => decisionTask === 'ALL' || p.taskId === decisionTask).length === 0 ? <div className="empty-state"><h2>{t('noProposals')}</h2><p>{t('noProposalsLead')}</p></div> : <div className="proposal-list">{proposals.filter(p => decisionTask === 'ALL' || p.taskId === decisionTask).map((proposal) => {
        const task = tasks.find((item) => item.id === proposal.taskId);
        const team = seedTeams.find((item) => item.id === proposal.teamId);
        const status = proposal.status === 'PENDING' ? t('pending') : proposal.status === 'ACCEPTED' ? t('accepted') : t('rejected');
        return <article className="proposal-card" key={proposal.id}><div className="card-top"><span>{team?.name || proposal.teamId}</span><b className={`pill ${proposal.status.toLowerCase()}`}>{status}</b></div><h2>{task ? displayTitle(task, t('notSpecified')) : t('notSpecified')}</h2><p>{t('skills')}: {team?.skills.join(', ')} · {t('technologies')}: {team?.technologies.join(', ')} · {t('interests')}: {team?.interests.join(', ')}</p><dl><div><dt>{t('solutionIdea')}</dt><dd>{proposal.solutionIdea}</dd></div><div><dt>{t('plan')}</dt><dd>{proposal.plan}</dd></div><div><dt>{t('timeline')}</dt><dd>{proposal.timeline}</dd></div><div><dt>{t('prototype')}</dt><dd><a href={proposal.prototypeUrl} target="_blank" rel="noreferrer">{proposal.prototypeUrl}</a></dd></div></dl>{canChangeProposalStatus(proposal) ? <div className="actions"><button onClick={() => setStatus(proposal.id, 'REJECTED')} disabled={proposal.status === 'REJECTED'}>{t('reject')}</button><button className="primary" onClick={() => setStatus(proposal.id, 'ACCEPTED')} disabled={proposal.status === 'ACCEPTED'}>{t('accept')}</button></div> : <p className="filter-note">{t('decisionFinal')}</p>}{proposal.progress ? <p>{t('confirmedStage')}: {proposal.progress.evidence} · +{proposal.progress.points} {t('points')} · {new Date(proposal.progress.confirmedAt).toLocaleString(locale)}</p> : proposal.status === 'ACCEPTED' && <section><label>{t('completedStage')}<textarea value={progressEvidence[proposal.id] || ''} onChange={e => setProgressEvidence({ ...progressEvidence, [proposal.id]: e.target.value })} /></label><button disabled={!progressEvidence[proposal.id]?.trim()} onClick={() => confirmProgress(proposal.id)}>{t('confirmStage')}</button></section>}</article>;
      })}</div>}
    </main>}

    {publicationOpen && <div className="modal-backdrop" role="presentation"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="publish-title"><div className="eyebrow">{t('humanConfirmation')}</div><h2 id="publish-title">{t('publishQuestion')}</h2><p>{t('publishLead', { title: displayTitle(draft, t('notSpecified')) })}</p><div className="actions"><button onClick={() => setPublicationOpen(false)}>{t('keepEditing')}</button><button className="primary" onClick={confirmPublish}>{t('publishTask')}</button></div></section></div>}

    {selectedTask && <div className="modal-backdrop" role="presentation"><section className="modal proposal-modal" role="dialog" aria-modal="true" aria-labelledby="proposal-title"><div className="eyebrow">{t('studentProposal')}</div><h2 id="proposal-title">{displayTitle(selectedTask, t('notSpecified'))}</h2><dl className="task-details">{getTaskFields(locale).map(field => <div key={field.key}><dt>{field.label}</dt><dd>{String(selectedTask[field.key]) || t('notSpecifiedClarify')}</dd></div>)}</dl><ScorePanel task={selectedTask} locale={locale} /><p>{t('chooseTeamLead')}</p><form onSubmit={submitProposal}><label><span>{t('studentTeam')}</span><select value={proposalTeamId} onChange={(event) => setProposalTeamId(event.target.value)}><option value="">{t('chooseTeam')}</option>{seedTeams.map((team) => <option key={team.id} value={team.id}>{team.name} — {team.skills.join(', ')}</option>)}</select></label><label><span>{t('solutionIdea')}</span><textarea value={proposalDraft.solutionIdea} onChange={(event) => setProposalDraft({ ...proposalDraft, solutionIdea: event.target.value })} /></label><label><span>{t('plan')}</span><textarea value={proposalDraft.plan} onChange={(event) => setProposalDraft({ ...proposalDraft, plan: event.target.value })} /></label><label><span>{t('timeline')}</span><input value={proposalDraft.timeline} onChange={(event) => setProposalDraft({ ...proposalDraft, timeline: event.target.value })} placeholder={t('timelinePlaceholder')} /></label><label><span>{t('prototype')}</span><input type="url" value={proposalDraft.prototypeUrl} onChange={(event) => setProposalDraft({ ...proposalDraft, prototypeUrl: event.target.value })} placeholder={t('prototypePlaceholder')} /></label>{proposalError && <div className="inline-message">{proposalError}</div>}<div className="actions"><button type="button" onClick={() => setSelectedTaskId(null)}>{t('cancel')}</button><button className="primary" type="submit">{t('submitReview')}</button></div></form></section></div>}
  </div>;
}
