import { createTranslator, type Locale } from '../lib/i18n';
import { scoreTask } from '../lib/scoring';
import type { TaskCard } from '../types/domain';

const tips: Record<Locale, string[]> = {
  en: ['Add a clear context and need.', 'Specify available data or materials.', 'Describe the expected result.', 'Add measurable success criteria.', 'State constraints and risks.', 'Name the users or audience.', 'Add a business contact and interaction format.'],
  ru: ['Добавьте понятный контекст и потребность.', 'Укажите доступные данные или материалы.', 'Опишите ожидаемый результат.', 'Добавьте измеримые критерии успеха.', 'Укажите ограничения и риски.', 'Назовите пользователей или аудиторию.', 'Добавьте контакт и формат связи с бизнесом.'],
  kk: ['Нақты контекст пен қажеттілікті қосыңыз.', 'Қолжетімді деректер мен материалдарды көрсетіңіз.', 'Күтілетін нәтижені сипаттаңыз.', 'Өлшенетін жетістік критерийлерін қосыңыз.', 'Шектеулер мен тәуекелдерді жазыңыз.', 'Пайдаланушыларды не аудиторияны атаңыз.', 'Бизнес контактісі мен байланыс форматын қосыңыз.'],
};

export function ScorePanel({ task, locale }: { task: TaskCard; locale: Locale }) {
  const score = scoreTask(task);
  const t = createTranslator(locale);
  const criteria = [
    { key: 'contextAndNeed', label: t('contextNeed'), weight: 20 },
    { key: 'dataAndMaterials', label: t('dataMaterials'), weight: 20 },
    { key: 'expectedResult', label: t('expectedResult'), weight: 15 },
    { key: 'successCriteria', label: t('successCriteria'), weight: 15 },
    { key: 'constraints', label: t('constraints'), weight: 10 },
    { key: 'users', label: t('users'), weight: 10 },
    { key: 'businessInteraction', label: t('businessInteraction'), weight: 10 },
  ] as const;
  const level = score.level === 'DRAFT' ? t('draft') : score.level === 'WORKING' ? t('working') : score.level === 'READY' ? t('ready') : t('priority');
  return <aside className="panel score-panel"><div className="eyebrow">{task.published ? t('scoreConfirmed') : t('scorePreview')}</div><div className="score-row"><strong>{score.total}</strong><span>/ 100</span><b className={`pill ${score.level.toLowerCase()}`}>{level}</b></div><div className="progress" aria-label={`${t('currentScore')}: ${score.total} / 100`}><span style={{ width: `${score.total}%` }} /></div><div className="potential"><b>{score.total} / 100</b><span>{t('currentScore')} · {100 - score.total} {t('potential')}</span></div><section className="score-breakdown"><h3>{t('scoreBreakdown')}</h3>{criteria.map((item) => <div className="breakdown-row" key={item.key}><span>{item.label}</span><b>{score.breakdown[item.key]}/{item.weight}</b></div>)}</section>{score.missing.length > 0 ? <section className="score-breakdown"><h3>{t('fastestImprove')}</h3>{score.missing.map((item, index) => <div className="tip" key={item.key}><b>+{item.points}</b><span>{tips[locale][index] ?? item.label}</span></div>)}</section> : <p className="perfect">{t('taskReady')}</p>}</aside>;
}
