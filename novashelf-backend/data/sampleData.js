const sampleResources = [
  {
    id: 1,
    title: '三幕式互动剧情模板',
    cover: '/covers/renpy-sdk.svg',
    category: '互动剧本',
    tags: '剧情结构,分支选择,原型',
    description: '面向互动叙事原型的三幕式结构模板，包含开场钩子、关键选择、冲突升级和结局回收说明，适合快速整理剧情方案。',
    download_url: 'https://www.notion.so/templates',
    view_count: 246,
    created_at: '2026-06-10T10:30:00.000Z'
  },
  {
    id: 2,
    title: '短篇故事节拍卡',
    cover: '/covers/fairy-tales.svg',
    category: '叙事文本',
    tags: '故事节拍,人物动机,改写',
    description: '用于拆解短篇文本的节拍卡资料，记录人物目标、阻碍、转折和情绪落点，便于将文字素材迁移到课程项目中。',
    download_url: 'https://www.gutenberg.org/',
    view_count: 182,
    created_at: '2026-06-09T12:20:00.000Z'
  },
  {
    id: 3,
    title: '角色关系视觉板',
    cover: '/covers/characters-pack.svg',
    category: '视觉设定',
    tags: '角色关系,设定图,视觉板',
    description: '用于整理角色身份、关系强弱、外观关键词和参考图的视觉设定板，适合在项目前期统一人物方向。',
    download_url: 'https://opengameart.org/',
    view_count: 219,
    created_at: '2026-06-08T08:10:00.000Z'
  },
  {
    id: 4,
    title: '场景氛围色卡集',
    cover: '/covers/anime-assets.svg',
    category: '视觉设定',
    tags: '场景,配色,氛围',
    description: '按照清晨、雨夜、室内工作台、城市街角等情境整理的色卡集，可辅助页面封面、卡片和插图风格统一。',
    download_url: 'https://coolors.co/',
    view_count: 305,
    created_at: '2026-06-07T16:45:00.000Z'
  },
  {
    id: 5,
    title: '城市夜行环境声清单',
    cover: '/covers/emptycity-music.svg',
    category: '声音素材',
    tags: '环境声,BGM,情绪',
    description: '围绕城市夜行、安静书房和紧张追逐等场景整理的声音素材清单，记录授权来源、情绪标签和适用场景。',
    download_url: 'https://freesound.org/',
    view_count: 157,
    created_at: '2026-06-06T11:00:00.000Z'
  },
  {
    id: 6,
    title: '素材采集流程看板',
    cover: '/covers/rhythm-template.svg',
    category: '创作工具',
    tags: '工作流,看板,资料整理',
    description: '用于管理素材采集、审核、归档和引用状态的流程看板，适合小组协作时记录每条资料的来源和处理进度。',
    download_url: 'https://trello.com/templates',
    view_count: 129,
    created_at: '2026-06-05T14:15:00.000Z'
  },
  {
    id: 7,
    title: '镜头分镜备注模板',
    cover: '/covers/dvn-engine.svg',
    category: '创作工具',
    tags: '分镜,镜头,备注',
    description: '面向页面演示和互动叙事的分镜备注模板，记录镜头目标、画面重点、交互触发和所需素材。',
    download_url: 'https://docs.google.com/',
    view_count: 94,
    created_at: '2026-06-04T09:35:00.000Z'
  },
  {
    id: 8,
    title: '灵感碎片收纳规则',
    cover: '/covers/rpg-sprites.svg',
    category: '灵感备忘',
    tags: '灵感,归档,命名规范',
    description: '用于约定灵感碎片命名、标签、来源记录和重复合并规则的备忘资料，帮助资料库保持可检索和可维护。',
    download_url: 'https://www.markdownguide.org/',
    view_count: 111,
    created_at: '2026-06-03T15:40:00.000Z'
  }
];

const sampleComments = [
  { id: 1, user_id: 2, resource_id: 1, content: '三幕式模板适合放在首页第一条，能说明这个工作台是为创作流程服务的。', created_at: '2026-06-11T09:12:00.000Z' },
  { id: 2, user_id: 1, resource_id: 1, content: '建议保留分支选择字段，后续可扩展成剧情节点管理。', created_at: '2026-06-11T10:18:00.000Z' },
  { id: 3, user_id: 2, resource_id: 2, content: '节拍卡很适合作为叙事文本分类的示例，检索关键词也清楚。', created_at: '2026-06-10T13:40:00.000Z' },
  { id: 4, user_id: 2, resource_id: 4, content: '色卡集可以直接服务前端主题统一，课程答辩时比较好解释。', created_at: '2026-06-09T15:33:00.000Z' },
  { id: 5, user_id: 1, resource_id: 5, content: '声音素材要在描述中继续强调授权来源，避免提交材料时说不清。', created_at: '2026-06-08T19:50:00.000Z' },
  { id: 6, user_id: 2, resource_id: 6, content: '流程看板可以和后台素材编排功能对应起来。', created_at: '2026-06-07T08:30:00.000Z' }
];

const sampleRatings = [
  { id: 1, user_id: 2, resource_id: 1, score: 5, created_at: '2026-06-11T09:10:00.000Z' },
  { id: 2, user_id: 1, resource_id: 1, score: 4, created_at: '2026-06-11T10:12:00.000Z' },
  { id: 3, user_id: 2, resource_id: 2, score: 4, created_at: '2026-06-10T13:35:00.000Z' },
  { id: 4, user_id: 2, resource_id: 4, score: 5, created_at: '2026-06-09T15:30:00.000Z' },
  { id: 5, user_id: 1, resource_id: 5, score: 4, created_at: '2026-06-08T19:40:00.000Z' },
  { id: 6, user_id: 1, resource_id: 6, score: 4, created_at: '2026-06-07T08:30:00.000Z' }
];

module.exports = {
  sampleResources,
  sampleComments,
  sampleRatings
};
