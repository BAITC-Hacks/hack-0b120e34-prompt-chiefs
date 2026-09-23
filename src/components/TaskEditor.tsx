import type { TaskCard } from '../types/domain';

export const fields: { key: keyof TaskCard; label: string; large?: boolean }[] = [
  { key: 'title', label: 'Название' },
  { key: 'industry', label: 'Отрасль / тема' },
  { key: 'context', label: 'Контекст', large: true },
  { key: 'need', label: 'Задача / потребность', large: true },
  { key: 'users', label: 'Пользователи', large: true },
  { key: 'data', label: 'Данные и материалы', large: true },
  { key: 'constraints', label: 'Ограничения', large: true },
  { key: 'expectedResult', label: 'Ожидаемый результат', large: true },
  { key: 'successCriteria', label: 'Критерии успеха', large: true },
  { key: 'contact', label: 'Контакт' },
  { key: 'interactionFormat', label: 'Формат взаимодействия', large: true },
];

export function TaskEditor({ task, onChange }: { task: TaskCard; onChange: (task: TaskCard) => void }) {
  return <div className="editor-grid">{fields.map((field) => <label key={field.key} className={field.large ? 'wide' : ''}>
    <span>{field.label}</span>
    {field.large
      ? <textarea value={String(task[field.key])} onChange={(event) => onChange({ ...task, [field.key]: event.target.value })} />
      : <input value={String(task[field.key])} onChange={(event) => onChange({ ...task, [field.key]: event.target.value })} />}
  </label>)}</div>;
}
