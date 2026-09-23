import type { TaskCard } from '../types/domain';
import { scoreTask } from '../lib/scoring';

export function ScorePanel({ task }: { task: TaskCard }) {
  const score = scoreTask(task);
  const rows = [
    ['contextAndNeed', 'Context & need', 20],
    ['dataAndMaterials', 'Data & materials', 20],
    ['expectedResult', 'Expected result', 15],
    ['successCriteria', 'Success criteria', 15],
    ['constraints', 'Constraints', 10],
    ['users', 'Users', 10],
    ['businessInteraction', 'Business interaction', 10],
  ] as const;
  const potential = score.total + score.missing.reduce((total, item) => total + item.points, 0);
  return <aside className="panel score-panel">
    <div className="eyebrow">{task.published ? 'CONFIRMED READINESS' : 'READINESS PREVIEW · CONFIRM TO AWARD'}</div>
    <div className="score-row"><strong>{score.total}</strong><span>/100</span><b className={`pill ${score.level.toLowerCase()}`}>{score.level}</b></div>
    <div className="progress"><span style={{ width: `${score.total}%` }} /></div>
    <div className="potential"><span>Current score</span><b>{score.total} → potential {potential}</b></div>
    <div className="score-breakdown"><h3>Score breakdown</h3>{rows.map(([key, label, possible]) => <div className="breakdown-row" key={key}><span>{label}</span><b>{score.breakdown[key]}/{possible}</b></div>)}</div>
    {score.missing.length > 0 ? <>
      <h3>Fastest ways to improve</h3>
      {score.missing.map(item => <div className="tip" key={item.key}>
        <b>+{item.points} · {item.label}</b><span>{item.tip}</span>
      </div>)}
    </> : <div className="perfect">Ready for student teams.</div>}
  </aside>
}
