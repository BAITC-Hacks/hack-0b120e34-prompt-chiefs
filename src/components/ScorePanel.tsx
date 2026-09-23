import { createTranslator, type Locale } from '../lib/i18n';
import { scoreTask } from '../lib/scoring';
import type { ScoreBreakdown, TaskCard } from '../types/domain';

// Keyed by criterion so each missing item always shows its own advice.
const tips: Record<Locale, Record<keyof ScoreBreakdown, string>> = {
  en: { contextAndNeed: 'Add a clear context and need.', dataAndMaterials: 'Specify available data or materials.', expectedResult: 'Describe the expected result.', successCriteria: 'Add measurable success criteria: a number, percentage or deadline.', constraints: 'State constraints and risks.', users: 'Name the users or audience.', businessInteraction: 'Add a contact (email, phone or @handle) and an interaction format.' },
  ru: { contextAndNeed: 'Добавьте понятный контекст и потребность.', dataAndMaterials: 'Укажите доступные данные или материалы.', expectedResult: 'Опишите ожидаемый результат.', successCriteria: 'Добавьте измеримые критерии успеха: число, процент или срок.', constraints: 'Укажите ограничения и риски.', users: 'Назовите пользователей или аудиторию.', businessInteraction: 'Добавьте контакт (email, телефон или @ник) и формат связи с бизнесом.' },
  kk: { contextAndNeed: 'Нақты контекст пен қажеттілікті қосыңыз.', dataAndMaterials: 'Қолжетімді деректер мен материалдарды көрсетіңіз.', expectedResult: 'Күтілетін нәтижені сипаттаңыз.', successCriteria: 'Өлшенетін жетістік критерийлерін қосыңыз: сан, пайыз не мерзім.', constraints: 'Шектеулер мен тәуекелдерді жазыңыз.', users: 'Пайдаланушыларды не аудиторияны атаңыз.', businessInteraction: 'Бизнес контактісін (email, телефон не @ник) және байланыс форматын қосыңыз.' },
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
  return <aside className="panel score-panel"><div className="eyebrow">{task.published ? t('scoreConfirmed') : t('scorePreview')}</div><div className="score-row"><strong>{score.total}</strong><span>/ 100</span><b className={`pill ${score.level.toLowerCase()}`}>{level}</b></div><div className="progress" aria-label={`${t('currentScore')}: ${score.total} / 100`}><span style={{ width: `${score.total}%` }} /></div><div className="potential"><b>{score.total} / 100</b><span>{t('currentScore')} · {100 - score.total} {t('potential')}</span></div><section className="score-breakdown"><h3>{t('scoreBreakdown')}</h3>{criteria.map((item) => <div className="breakdown-row" key={item.key}><span>{item.label}</span><b>{score.breakdown[item.key]}/{item.weight}</b></div>)}</section>{score.missing.length > 0 ? <section className="score-breakdown"><h3>{t('fastestImprove')}</h3>{score.missing.map((item) => <div className="tip" key={item.key}><b>+{item.points}</b><span>{tips[locale][item.key] ?? item.tip}</span></div>)}</section> : <p className="perfect">{t('taskReady')}</p>}</aside>;
}
