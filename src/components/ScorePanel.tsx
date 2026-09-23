import type { TaskCard } from '../types/domain';
import { scoreTask } from '../lib/scoring';

export function ScorePanel({ task }: { task: TaskCard }) {
  const score = scoreTask(task);
  const levelLabels = { DRAFT: 'ЧЕРНОВИК', WORKING: 'РАБОЧАЯ', READY: 'ГОТОВАЯ', PRIORITY: 'ПРИОРИТЕТНАЯ' } as const;
  const criterionLabels = {
    contextAndNeed: 'Контекст и потребность',
    dataAndMaterials: 'Данные и материалы',
    expectedResult: 'Ожидаемый результат',
    successCriteria: 'Критерии успеха',
    constraints: 'Ограничения',
    users: 'Пользователи',
    businessInteraction: 'Связь с бизнесом',
  } as const;
  const tips = {
    contextAndNeed: 'Опишите текущую ситуацию и то, что необходимо изменить.',
    dataAndMaterials: 'Укажите доступные данные, примеры, документы или источники.',
    expectedResult: 'Опишите конкретный результат, который должна передать команда.',
    successCriteria: 'Добавьте измеримые критерии приёмки или целевые показатели.',
    constraints: 'Укажите сроки, технологии, доступы и другие границы.',
    users: 'Скажите, кто будет использовать решение и кому оно поможет.',
    businessInteraction: 'Добавьте контакт и формат консультаций или обратной связи.',
  } as const;
  const rows = [
    ['contextAndNeed', criterionLabels.contextAndNeed, 20],
    ['dataAndMaterials', criterionLabels.dataAndMaterials, 20],
    ['expectedResult', criterionLabels.expectedResult, 15],
    ['successCriteria', criterionLabels.successCriteria, 15],
    ['constraints', criterionLabels.constraints, 10],
    ['users', criterionLabels.users, 10],
    ['businessInteraction', criterionLabels.businessInteraction, 10],
  ] as const;
  const potential = score.total + score.missing.reduce((total, item) => total + item.points, 0);

  return <aside className="panel score-panel">
    <div className="eyebrow">{task.published ? 'ПОДТВЕРЖДЁННАЯ ГОТОВНОСТЬ' : 'ПРЕДВАРИТЕЛЬНАЯ ОЦЕНКА · ПОДТВЕРДИТЕ ПЕРЕД ПУБЛИКАЦИЕЙ'}</div>
    <div className="score-row"><strong>{score.total}</strong><span>/100</span><b className={`pill ${score.level.toLowerCase()}`}>{levelLabels[score.level]}</b></div>
    <div className="progress"><span style={{ width: `${score.total}%` }} /></div>
    <div className="potential"><span>Текущий рейтинг</span><b>{score.total} → потенциально {potential}</b></div>
    <div className="score-breakdown"><h3>Расшифровка рейтинга</h3>{rows.map(([key, label, possible]) => <div className="breakdown-row" key={key}><span>{label}</span><b>{score.breakdown[key]}/{possible}</b></div>)}</div>
    {score.missing.length > 0 ? <>
      <h3>Что быстрее повысит рейтинг</h3>
      {score.missing.map((item) => <div className="tip" key={item.key}>
        <b>+{item.points} · {criterionLabels[item.key]}</b><span>{tips[item.key]}</span>
      </div>)}
    </> : <div className="perfect">Задача готова к работе со студенческими командами.</div>}
  </aside>;
}
