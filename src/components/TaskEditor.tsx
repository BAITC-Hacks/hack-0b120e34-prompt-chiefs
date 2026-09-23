import type { Locale } from '../lib/i18n';
import type { TaskCard } from '../types/domain';

type Field = { key: keyof TaskCard; label: string; large?: boolean };

const labels: Record<Locale, string[]> = {
  en: ['Title', 'Industry / topic', 'Context', 'Need / problem', 'Users', 'Data and materials', 'Constraints', 'Expected result', 'Success criteria', 'Contact', 'Business interaction format'],
  ru: ['Название', 'Отрасль / тема', 'Контекст', 'Задача / потребность', 'Пользователи', 'Данные и материалы', 'Ограничения', 'Ожидаемый результат', 'Критерии успеха', 'Контакт', 'Формат взаимодействия с бизнесом'],
  kk: ['Атауы', 'Сала / тақырып', 'Контекст', 'Мәселе / қажеттілік', 'Пайдаланушылар', 'Деректер мен материалдар', 'Шектеулер', 'Күтілетін нәтиже', 'Сәттілік критерийлері', 'Байланыс', 'Бизнеспен өзара әрекет форматы'],
};

const keys: (keyof TaskCard)[] = ['title', 'industry', 'context', 'need', 'users', 'data', 'constraints', 'expectedResult', 'successCriteria', 'contact', 'interactionFormat'];

export function getTaskFields(locale: Locale): Field[] {
  return keys.map((key, index) => ({ key, label: labels[locale][index], large: index >= 2 }));
}

export function TaskEditor({ task, onChange, locale }: { task: TaskCard; onChange: (task: TaskCard) => void; locale: Locale }) {
  return <div className="editor-grid">{getTaskFields(locale).map((field) => <label key={field.key} className={field.large ? 'wide' : ''}><span>{field.label}</span>{field.large ? <textarea value={String(task[field.key])} onChange={(event) => onChange({ ...task, [field.key]: event.target.value })} /> : <input value={String(task[field.key])} onChange={(event) => onChange({ ...task, [field.key]: event.target.value })} />}</label>)}</div>;
}
