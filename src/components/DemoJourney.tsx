const steps = [
  { number: '01', role: 'Бизнес', title: 'Описывает задачу', text: 'Короткий бриф становится черновиком карточки.' },
  { number: '02', role: 'Task Doctor', title: 'Задаёт вопросы', text: 'Три уточнения помогают добавить только подтверждённые факты.' },
  { number: '03', role: 'Бизнес', title: 'Подтверждает карточку', text: 'Рейтинг прозрачен: он влияет на позицию, а не на доступ.' },
  { number: '04', role: 'Каталог', title: 'Публикует задачу', text: 'Все подтверждённые задачи видны и отсортированы по готовности.' },
  { number: '05', role: 'Команда', title: 'Подаёт предложение', text: 'Идея, план, срок и ссылка на прототип остаются за командой.' },
  { number: '06', role: 'Бизнес', title: 'Принимает решение', text: 'Только представитель бизнеса вручную выбирает или отклоняет отклик.' },
];

export function DemoJourney() {
  return <section className="demo-journey" aria-labelledby="demo-journey-title">
    <div className="demo-journey__intro">
      <div className="eyebrow">ПУТЬ ДЕМО</div>
      <h2 id="demo-journey-title">От черновика до подтверждённого результата</h2>
      <p>Шесть шагов за пять минут. Искусственный интеллект уточняет факты, а решения принимают люди.</p>
    </div>
    <ol className="demo-journey__steps">
      {steps.map((step) => <li className="demo-journey__step" key={step.number}>
        <span className="demo-journey__number" aria-hidden="true">{step.number}</span>
        <div><span className="demo-journey__role">{step.role}</span><h3>{step.title}</h3><p>{step.text}</p></div>
      </li>)}
    </ol>
  </section>;
}
