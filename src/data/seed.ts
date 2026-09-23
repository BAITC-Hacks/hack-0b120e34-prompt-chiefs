import type { TaskCard, Team, Proposal } from '../types/domain';

// Synthetic demo data. Industry and interest values are keys translated by displayIndustry().
export const seedDrafts = [
  { text: 'Нам нужна помощь с обращениями в поддержку.', industry: 'SaaS' },
  { text: 'Руководители склада должны видеть задержки отгрузок. У нас есть выгрузки отгрузок в CSV.', industry: 'Logistics' },
  { text: 'Студенты не могут найти свободные слоты у репетиторов. Помогло бы расписание с поиском.', industry: 'Education' },
  { text: 'Наш магазин списывает свежие продукты. Есть история продаж, нужен недельный прогноз с ошибкой менее 20%.', industry: 'Retail' },
  { text: 'Волонтёры вручную пересчитывают деревья. Координаторам нужна карта на открытых данных, без персональных данных, за две недели.', industry: 'Environment' },
];

export const blankTask = (): TaskCard => ({
  id: crypto.randomUUID(), title: '', industry: '', context: '', need: '', users: '', data: '',
  constraints: '', expectedResult: '', successCriteria: '', contact: '', interactionFormat: '',
  published: false, createdAt: new Date().toISOString(),
});

export const feedbackAnalysisDemo = (): TaskCard => ({
  ...blankTask(),
  title: 'Автоматизировать анализ отзывов клиентов',
  industry: 'Customer experience',
  context: 'Отзывы клиентов приходят из опросов, магазинов приложений и писем в поддержку, но повторяющиеся проблемы сложно быстро заметить.',
});

export const seedTasks: TaskCard[] = [
  {
    id: 't1', title: 'Сократить время разбора обращений в поддержку', industry: 'SaaS',
    context: 'Операторы поддержки вручную читают и распределяют несколько сотен новых обращений в неделю.',
    need: 'Нужен прототип, который классифицирует и приоритизирует новые обращения до того, как их увидит оператор.',
    users: 'Операторы поддержки и руководители смен.',
    data: 'Обезличенная выгрузка CSV с текстом обращений, категорией и приоритетом.',
    constraints: 'Только прототип, без интеграции в продакшн. Демо должно запускаться локально.',
    expectedResult: 'Работающий веб-прототип, который предсказывает категорию и приоритет нового обращения.',
    successCriteria: 'Не менее 80% верных категорий на контрольной выборке и ответ демо быстрее 3 секунд.',
    contact: 'product@demo.company', interactionFormat: 'Две консультации по 20 минут за время проекта.',
    published: true, createdAt: '2026-09-20T10:00:00.000Z',
  },
  {
    id: 't2', title: 'Дашборд задержек на складе', industry: 'Logistics',
    context: 'Руководители узнают о задержках отгрузок только после жалоб клиентов.',
    need: 'Сделать так, чтобы рискованные задержанные отгрузки были видны раньше.',
    users: 'Руководители склада.', data: '', constraints: '',
    expectedResult: 'Прототип интерактивного дашборда.', successCriteria: '',
    contact: 'manager@demo.company', interactionFormat: 'Еженедельный созвон для обратной связи.',
    published: true, createdAt: '2026-09-21T11:00:00.000Z',
  },
  {
    ...blankTask(), id: 't3', title: 'Поиск свободных слотов у репетиторов', industry: 'Education',
    context: seedDrafts[2].text, published: true, createdAt: '2026-09-21T12:00:00.000Z',
  },
  {
    ...blankTask(), id: 't4', title: 'Прогноз спроса на свежие продукты', industry: 'Retail',
    context: 'Магазин каждую неделю списывает непроданные свежие продукты.',
    need: 'Прогнозировать недельный спрос, чтобы сократить списания.',
    users: 'Закупщики и директора магазинов.', data: 'Обезличенные ежедневные продажи за два года в CSV.',
    expectedResult: 'Дашборд недельного прогноза с загрузкой CSV.', successCriteria: '',
    constraints: 'Локальный прототип за две недели.', published: true, createdAt: '2026-09-21T13:00:00.000Z',
  },
  {
    ...blankTask(), id: 't5', title: 'Карта городских деревьев', industry: 'Environment',
    context: seedDrafts[4].text, need: 'Заменить ручной пересчёт открытой картой с поиском.',
    users: 'Координаторы волонтёров.', data: 'Открытые координаты и виды деревьев в CSV.',
    expectedResult: 'Интерактивная карта с фильтром по видам.', successCriteria: 'Все 100 тестовых деревьев отображаются по верным координатам.',
    contact: 'trees@example.com', interactionFormat: 'Еженедельная консультация и письменная обратная связь в течение двух дней.',
    published: true, createdAt: '2026-09-21T14:00:00.000Z',
  },
];

export const seedTeams: Team[] = [
  { id: 'team4', name: 'Green Code', interests: ['Environment'], skills: ['Карты', 'UX'], technologies: ['React', 'Leaflet'] },
  { id: 'team5', name: 'Study Makers', interests: ['Education', 'Retail'], skills: ['Фронтенд', 'Исследования'], technologies: ['TypeScript', 'React'] },
  { id: 'team1', name: 'Vector Lab', interests: ['AI', 'SaaS'], skills: ['ML', 'UX'], technologies: ['Python', 'React'] },
  { id: 'team2', name: 'ByteForge', interests: ['Logistics', 'Analytics'], skills: ['Данные', 'Фронтенд'], technologies: ['TypeScript', 'Python'] },
  { id: 'team3', name: 'Nova Stack', interests: ['Automation', 'Customer experience'], skills: ['Бэкенд', 'AI'], technologies: ['Node.js', 'PostgreSQL'] },
];

export const seedProposals: Proposal[] = [
  { id: 'p2', taskId: 't1', teamId: 'team3', solutionIdea: 'Объяснимые правила маршрутизации с очередью на проверку.', plan: 'Изучить разметку, реализовать правила, оценить и показать демо.', timeline: '4 дня', prototypeUrl: 'https://example.com/routing', status: 'PENDING', createdAt: '2026-09-22T12:00:00.000Z' },
  { id: 'p3', taskId: 't2', teamId: 'team2', solutionIdea: 'Дашборд задержек отгрузок.', plan: 'Импорт CSV, графики задержек, проверка с руководителями.', timeline: '5 дней', prototypeUrl: 'https://example.com/logistics', status: 'PENDING', createdAt: '2026-09-22T12:00:00.000Z' },
  { id: 'p4', taskId: 't3', teamId: 'team5', solutionIdea: 'Расписание репетиторов с поиском.', plan: 'Интервью с координатором, макет расписания, юзабилити-тест.', timeline: '3 дня', prototypeUrl: 'https://example.com/study', status: 'PENDING', createdAt: '2026-09-22T12:00:00.000Z' },
  { id: 'p5', taskId: 't5', teamId: 'team4', solutionIdea: 'Открытая карта деревьев.', plan: 'Импорт координат, отображение на карте, сверка выборки.', timeline: '7 дней', prototypeUrl: 'https://example.com/trees', status: 'PENDING', createdAt: '2026-09-22T12:00:00.000Z' },
  { id: 'p1', taskId: 't1', teamId: 'team1', solutionIdea: 'Лёгкий классификатор текста с отображением уверенности для операторов.', plan: 'Базовая модель → оценка → интеграция в интерфейс.', timeline: '3 дня', prototypeUrl: 'https://example.com/demo', status: 'PENDING', createdAt: '2026-09-22T12:00:00.000Z' },
];
