import type { TaskCard } from '../types/domain';

const fields: { key: keyof TaskCard; label: string; large?: boolean }[] = [
  { key: 'title', label: 'Title' }, { key: 'industry', label: 'Industry / topic' },
  { key: 'context', label: 'Context', large: true }, { key: 'need', label: 'Need / problem', large: true },
  { key: 'users', label: 'Users', large: true }, { key: 'data', label: 'Data & materials', large: true },
  { key: 'constraints', label: 'Constraints', large: true }, { key: 'expectedResult', label: 'Expected result', large: true },
  { key: 'successCriteria', label: 'Success criteria', large: true }, { key: 'contact', label: 'Contact' },
  { key: 'interactionFormat', label: 'Interaction format', large: true },
];

export function TaskEditor({ task, onChange }: { task: TaskCard; onChange: (task: TaskCard) => void }) {
  return <div className="editor-grid">{fields.map(f => <label key={f.key} className={f.large ? 'wide' : ''}>
    <span>{f.label}</span>
    {f.large ? <textarea value={String(task[f.key])} onChange={e => onChange({ ...task, [f.key]: e.target.value })} />
      : <input value={String(task[f.key])} onChange={e => onChange({ ...task, [f.key]: e.target.value })} />}
  </label>)}</div>
}
