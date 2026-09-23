export type Locale = 'en' | 'kk' | 'ru';
export type Theme = 'light' | 'dark';
export type FontScale = 'normal' | 'large';
export type MotionPreference = 'full' | 'reduced';

export const localeOptions: { value: Locale; label: string }[] = [
  { value: 'ru', label: 'Русский' },
  { value: 'kk', label: 'Қазақша' },
  { value: 'en', label: 'English' },
];

const messages = {
  en: {
    tagline: 'AI Sana business challenge marketplace', catalog: 'Catalog', createTask: 'Create task', proposals: 'Proposals', reset: 'Reset demo data',
    settings: 'Display settings', language: 'Language', theme: 'Theme', light: 'Light', dark: 'Dark', textSize: 'Text size', normal: 'Standard', large: 'Large', motion: 'Motion', reduced: 'Reduce motion', full: 'Full motion',
    businessWorkspace: 'Business workspace', builderTitle: 'Turn a vague need into a task teams can actually start.', builderLead: 'Start with your own words. Task Doctor asks only about missing facts; it never makes business decisions or assigns a score.', roughDescription: 'Rough business description', roughPlaceholder: 'For example: We receive customer feedback from many channels and cannot see recurring problems quickly.', useDescription: 'Use this description', loadDemo: 'Load feedback-analysis demo', readinessPreview: 'Readiness is a preview. Only a confirmed version changes the catalog ranking.', taskDoctor: 'AI Task Doctor', doctorWorking: 'Task Doctor is reviewing…', confirmPublish: 'Confirm & publish',
    doctorHeading: 'Three questions to make this brief actionable', doctorLead: 'Answers are copied into the editable card exactly as you provide them.', applyAnswers: 'Apply answers to task card',
    openCatalog: 'Open catalog', catalogTitle: 'Better briefs rise. Every team can still apply.', catalogLead: 'Readiness changes ordering only. Every business-confirmed challenge remains open to student teams.', postChallenge: 'Post a challenge',
    noTasks: 'No published tasks yet', noTasksLead: 'Create a task, review it, and use Confirm & publish to add the first challenge.', readiness: 'Readiness', industry: 'Industry / topic', allReadiness: 'All readiness levels', allIndustries: 'All industries', showing: 'Showing {{shown}} of {{total}} published tasks', noMatches: 'No tasks match these filters', noMatchesLead: 'Every confirmed task remains in the catalog. Change a filter to view it.', clearFilters: 'Clear filters', openTopic: 'Open topic', forUsers: 'For: {{users}}', notSpecified: 'Not specified yet', openTask: 'Open task & submit proposal', editBusiness: 'Edit as business',
    businessDecision: 'Business decision', proposalsTitle: 'Humans choose the team.', proposalsLead: 'Review each proposal in full, then manually accept or reject it.', compareTask: 'Compare proposals for task', allTasks: 'All tasks', confirmedProgress: 'Confirmed team progress', points: 'points', noProposals: 'No proposals yet', noProposalsLead: 'Published tasks are visible in the catalog for student teams to explore and propose on.', skills: 'Skills', technologies: 'Technologies', interests: 'Interests', solutionIdea: 'Solution idea', plan: 'Plan', timeline: 'Timeline', prototype: 'Prototype', accept: 'Accept', reject: 'Reject', completedStage: 'Completed stage and evidence', confirmStage: 'Business: confirm completed stage (+10 points)', confirmedStage: 'Confirmed stage',
    humanConfirmation: 'Human confirmation', publishQuestion: 'Publish this task to the catalog?', publishLead: '{{title}} will become visible to every student team. Its readiness score changes ranking, never access.', keepEditing: 'Keep editing', publishTask: 'Publish task', studentProposal: 'Student proposal', chooseTeamLead: 'Choose your own team and provide the complete proposal for business review.', chooseTeam: 'Choose a team', studentTeam: 'Student team', prototypePlaceholder: 'https://…', timelinePlaceholder: 'For example: 3 days', cancel: 'Cancel', submitReview: 'Submit for business review', notSpecifiedClarify: 'Not specified — requires clarification',
    draft: 'DRAFT', working: 'WORKING', ready: 'READY', priority: 'PRIORITY', scoreConfirmed: 'Confirmed readiness', scorePreview: 'Readiness preview · confirm before publication', currentScore: 'Current score', potential: 'potentially', scoreBreakdown: 'Score breakdown', fastestImprove: 'What raises the score fastest', taskReady: 'Task is ready for student teams.',
    contextNeed: 'Context & need', dataMaterials: 'Data & materials', expectedResult: 'Expected result', successCriteria: 'Success criteria', constraints: 'Constraints', users: 'Users', businessInteraction: 'Business interaction',
  },
  ru: {
    tagline: 'AI Sana — площадка бизнес-задач', catalog: 'Каталог', createTask: 'Создать задачу', proposals: 'Отклики', reset: 'Сбросить демо-данные',
    settings: 'Настройки отображения', language: 'Язык', theme: 'Тема', light: 'Светлая', dark: 'Тёмная', textSize: 'Размер текста', normal: 'Обычный', large: 'Крупный', motion: 'Анимация', reduced: 'Уменьшить', full: 'Полная',
    businessWorkspace: 'РАБОЧЕЕ ПРОСТРАНСТВО БИЗНЕСА', builderTitle: 'Превратите неясную потребность в задачу, с которой команды смогут начать работу.', builderLead: 'Начните своими словами. Task Doctor спрашивает только о недостающих фактах и не принимает решений за бизнес.', roughDescription: 'Краткое описание потребности', roughPlaceholder: 'Например: отзывы клиентов приходят из разных каналов, и мы не видим повторяющиеся проблемы.', useDescription: 'Использовать описание', loadDemo: 'Загрузить демо с анализом отзывов', readinessPreview: 'Рейтинг здесь предварительный. Только подтверждённая версия меняет место в каталоге.', taskDoctor: 'AI Task Doctor', doctorWorking: 'Task Doctor анализирует…', confirmPublish: 'Подтвердить и опубликовать',
    doctorHeading: 'Три вопроса, чтобы сделать задачу понятной команде', doctorLead: 'Ответы копируются в редактируемую карточку ровно в том виде, в котором вы их указали.', applyAnswers: 'Применить ответы к карточке',
    openCatalog: 'ОТКРЫТЫЙ КАТАЛОГ', catalogTitle: 'Лучшие брифы поднимаются выше. Откликнуться может каждая команда.', catalogLead: 'Рейтинг влияет только на порядок. Каждая подтверждённая бизнесом задача открыта студентам.', postChallenge: 'Опубликовать задачу',
    noTasks: 'Пока нет опубликованных задач', noTasksLead: 'Создайте, проверьте и подтвердите первую задачу для каталога.', readiness: 'Готовность', industry: 'Отрасль / тема', allReadiness: 'Все уровни готовности', allIndustries: 'Все отрасли', showing: 'Показано {{shown}} из {{total}} опубликованных задач', noMatches: 'Задач по этим фильтрам нет', noMatchesLead: 'Все подтверждённые задачи остаются в каталоге. Измените фильтр, чтобы увидеть их.', clearFilters: 'Сбросить фильтры', openTopic: 'Открытая тема', forUsers: 'Для: {{users}}', notSpecified: 'Пока не указано', openTask: 'Открыть задачу и подать отклик', editBusiness: 'Редактировать как бизнес',
    businessDecision: 'РЕШЕНИЕ БИЗНЕСА', proposalsTitle: 'Команду выбирает человек.', proposalsLead: 'Сравните полный текст каждого отклика и вручную примите или отклоните его.', compareTask: 'Сравнить отклики по задаче', allTasks: 'Все задачи', confirmedProgress: 'Подтверждённый прогресс команд', points: 'баллов', noProposals: 'Откликов пока нет', noProposalsLead: 'Опубликованные задачи доступны командам в каталоге.', skills: 'Навыки', technologies: 'Технологии', interests: 'Интересы', solutionIdea: 'Идея решения', plan: 'План', timeline: 'Срок', prototype: 'Прототип', accept: 'Принять', reject: 'Отклонить', completedStage: 'Выполненный этап и подтверждение', confirmStage: 'Бизнес: подтвердить этап (+10 баллов)', confirmedStage: 'Подтверждённый этап',
    humanConfirmation: 'ПОДТВЕРЖДЕНИЕ ЧЕЛОВЕКОМ', publishQuestion: 'Опубликовать задачу в каталоге?', publishLead: '{{title}} станет доступна всем студенческим командам. Рейтинг изменит позицию, но не доступ.', keepEditing: 'Продолжить редактирование', publishTask: 'Опубликовать задачу', studentProposal: 'ОТКЛИК КОМАНДЫ', chooseTeamLead: 'Самостоятельно выберите команду и заполните полный отклик для бизнеса.', chooseTeam: 'Выберите команду', studentTeam: 'Студенческая команда', prototypePlaceholder: 'https://…', timelinePlaceholder: 'Например: 3 дня', cancel: 'Отмена', submitReview: 'Отправить на рассмотрение бизнеса', notSpecifiedClarify: 'Не указано — нужно уточнение',
    draft: 'ЧЕРНОВИК', working: 'РАБОЧАЯ', ready: 'ГОТОВАЯ', priority: 'ПРИОРИТЕТНАЯ', scoreConfirmed: 'ПОДТВЕРЖДЁННАЯ ГОТОВНОСТЬ', scorePreview: 'ПРЕДВАРИТЕЛЬНАЯ ОЦЕНКА · ПОДТВЕРДИТЕ ПЕРЕД ПУБЛИКАЦИЕЙ', currentScore: 'Текущий рейтинг', potential: 'потенциально', scoreBreakdown: 'Расшифровка рейтинга', fastestImprove: 'Что быстрее повысит рейтинг', taskReady: 'Задача готова к работе со студенческими командами.',
    contextNeed: 'Контекст и потребность', dataMaterials: 'Данные и материалы', expectedResult: 'Ожидаемый результат', successCriteria: 'Критерии успеха', constraints: 'Ограничения', users: 'Пользователи', businessInteraction: 'Связь с бизнесом',
  },
  kk: {
    tagline: 'AI Sana — бизнес тапсырмалар алаңы', catalog: 'Каталог', createTask: 'Тапсырма құру', proposals: 'Өтінімдер', reset: 'Демо деректерін қалпына келтіру',
    settings: 'Көрсету баптаулары', language: 'Тіл', theme: 'Тақырып', light: 'Ашық', dark: 'Қараңғы', textSize: 'Мәтін өлшемі', normal: 'Қалыпты', large: 'Үлкен', motion: 'Қозғалыс', reduced: 'Азайту', full: 'Толық',
    businessWorkspace: 'БИЗНЕС ЖҰМЫС КЕҢІСТІГІ', builderTitle: 'Жалпы қажеттілікті команда бастай алатын нақты тапсырмаға айналдырыңыз.', builderLead: 'Өз сөзіңізбен бастаңыз. Task Doctor тек жетіспейтін деректерді сұрайды және бизнес үшін шешім қабылдамайды.', roughDescription: 'Қысқаша бизнес сипаттамасы', roughPlaceholder: 'Мысалы: клиент пікірлері әр арнадан келеді, ал қайталанатын мәселелерді жылдам көре алмаймыз.', useDescription: 'Осы сипаттаманы қолдану', loadDemo: 'Пікірлерді талдау демосын жүктеу', readinessPreview: 'Дайындық рейтингі алдын ала есептеледі. Тек расталған нұсқа каталогтағы орынды өзгертеді.', taskDoctor: 'AI Task Doctor', doctorWorking: 'Task Doctor талдап жатыр…', confirmPublish: 'Растау және жариялау',
    doctorHeading: 'Тапсырманы командаға түсінікті етуге арналған үш сұрақ', doctorLead: 'Жауаптар сіз берген түрде өңделетін карточкаға көшіріледі.', applyAnswers: 'Жауаптарды карточкаға қолдану',
    openCatalog: 'АШЫҚ КАТАЛОГ', catalogTitle: 'Жақсы брифтер жоғары көтеріледі. Әр команда өтінім бере алады.', catalogLead: 'Рейтинг тек реттілікке әсер етеді. Бизнес растаған әр тапсырма студенттерге ашық.', postChallenge: 'Тапсырманы жариялау',
    noTasks: 'Жарияланған тапсырмалар әзірге жоқ', noTasksLead: 'Каталогқа бірінші тапсырманы құрып, тексеріп, растаңыз.', readiness: 'Дайындық', industry: 'Сала / тақырып', allReadiness: 'Барлық дайындық деңгейі', allIndustries: 'Барлық салалар', showing: '{{total}} жарияланған тапсырманың {{shown}} көрсетілді', noMatches: 'Осы сүзгілерге сай тапсырма жоқ', noMatchesLead: 'Барлық расталған тапсырмалар каталогта қалады. Оларды көру үшін сүзгіні өзгертіңіз.', clearFilters: 'Сүзгілерді тазарту', openTopic: 'Ашық тақырып', forUsers: 'Кім үшін: {{users}}', notSpecified: 'Әзірге көрсетілмеген', openTask: 'Тапсырманы ашып, өтінім беру', editBusiness: 'Бизнес ретінде өңдеу',
    businessDecision: 'БИЗНЕС ШЕШІМІ', proposalsTitle: 'Команданы адам таңдайды.', proposalsLead: 'Әр өтінімді толық салыстырып, оны қолмен қабылдаңыз не қабылдамаңыз.', compareTask: 'Тапсырма бойынша өтінімдерді салыстыру', allTasks: 'Барлық тапсырмалар', confirmedProgress: 'Команданың расталған ілгерілеуі', points: 'ұпай', noProposals: 'Өтінімдер әзірге жоқ', noProposalsLead: 'Жарияланған тапсырмалар каталогта командаларға қолжетімді.', skills: 'Дағдылар', technologies: 'Технологиялар', interests: 'Қызығушылықтар', solutionIdea: 'Шешім идеясы', plan: 'Жоспар', timeline: 'Мерзім', prototype: 'Прототип', accept: 'Қабылдау', reject: 'Қабылдамау', completedStage: 'Орындалған кезең және дәлел', confirmStage: 'Бизнес: кезеңді растау (+10 ұпай)', confirmedStage: 'Расталған кезең',
    humanConfirmation: 'АДАМНЫҢ РАСТАУЫ', publishQuestion: 'Тапсырманы каталогқа жариялау керек пе?', publishLead: '{{title}} барлық студенттік командаларға қолжетімді болады. Рейтинг тек орнын өзгертеді.', keepEditing: 'Өңдеуді жалғастыру', publishTask: 'Тапсырманы жариялау', studentProposal: 'КОМАНДА ӨТІНІМІ', chooseTeamLead: 'Команданы өзіңіз таңдап, бизнеске арналған толық өтінімді толтырыңыз.', chooseTeam: 'Команданы таңдаңыз', studentTeam: 'Студенттік команда', prototypePlaceholder: 'https://…', timelinePlaceholder: 'Мысалы: 3 күн', cancel: 'Бас тарту', submitReview: 'Бизнес қарауына жіберу', notSpecifiedClarify: 'Көрсетілмеген — нақтылау қажет',
    draft: 'ЖОБА', working: 'ЖҰМЫСТАҒЫ', ready: 'ДАЙЫН', priority: 'БАСЫМ', scoreConfirmed: 'РАСТАЛҒАН ДАЙЫНДЫҚ', scorePreview: 'АЛДЫН АЛА БАҒА · ЖАРИЯЛАУ АЛДЫНДА РАСТАҢЫЗ', currentScore: 'Ағымдағы рейтинг', potential: 'ықтимал', scoreBreakdown: 'РЕЙТИНГ ТҮСІНДІРМЕСІ', fastestImprove: 'Рейтингті не тез көтереді', taskReady: 'Тапсырма студенттік командалармен жұмысқа дайын.',
    contextNeed: 'Мәтінмән және қажеттілік', dataMaterials: 'Деректер мен материалдар', expectedResult: 'Күтілетін нәтиже', successCriteria: 'Жетістік критерийлері', constraints: 'Шектеулер', users: 'Пайдаланушылар', businessInteraction: 'Бизнестің байланысы',
  },
} as const;

export type TranslationKey = keyof typeof messages.en;

export function createTranslator(locale: Locale) {
  return (key: TranslationKey, values: Record<string, string | number> = {}) => messages[locale][key].replace(/{{(\w+)}}/g, (_, name) => String(values[name] ?? ''));
}

export function loadPreference<T extends string>(key: string, fallback: T): T {
  try {
    return (localStorage.getItem(key) as T | null) ?? fallback;
  } catch {
    return fallback;
  }
}

export function savePreference(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Presentation preferences are optional when local storage is unavailable.
  }
}
