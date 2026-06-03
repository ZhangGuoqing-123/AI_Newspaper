import { Channel, Article, DailySummary, DailyBroadcast, User, Source } from '@/types';

export const mockUser: User = {
  uid: 'u_9527',
  nickname: 'Tyler',
  isVip: false,
  pushTime: '08:00',
  subscriptions: [
    { channelId: 'c1', pushEnabled: true },
    { channelId: 'c2', pushEnabled: true },
    { channelId: 'c3', pushEnabled: false },
  ],
};

// 信息源数据
const openAISources: Source[] = [
  {
    id: 's1',
    name: 'Sam Altman',
    handle: '@sama',
    avatar: '👤',
    platform: 'twitter',
    description: 'OpenAI CEO',
    followerCount: 3200000,
    isFollowed: true,
  },
  {
    id: 's2',
    name: 'OpenAI',
    handle: '@OpenAI',
    avatar: '🤖',
    platform: 'twitter',
    description: 'OpenAI 官方账号',
    followerCount: 5800000,
    isFollowed: false,
  },
  {
    id: 's3',
    name: 'OpenAI Blog',
    handle: 'openai.com/blog',
    avatar: '📝',
    platform: 'blog',
    description: 'OpenAI 官方博客',
    followerCount: 0,
    isFollowed: true,
  },
  {
    id: 's4',
    name: 'Greg Brockman',
    handle: '@gaborbrockman',
    avatar: '👨‍💻',
    platform: 'twitter',
    description: 'OpenAI 联合创始人',
    followerCount: 890000,
    isFollowed: false,
  },
];

const elonSources: Source[] = [
  {
    id: 's5',
    name: 'Elon Musk',
    handle: '@elonmusk',
    avatar: '🚀',
    platform: 'twitter',
    description: 'Tesla & SpaceX CEO',
    followerCount: 180000000,
    isFollowed: true,
  },
  {
    id: 's6',
    name: 'Tesla',
    handle: '@Tesla',
    avatar: '⚡',
    platform: 'twitter',
    description: 'Tesla 官方账号',
    followerCount: 22000000,
    isFollowed: false,
  },
  {
    id: 's7',
    name: 'SpaceX',
    handle: '@SpaceX',
    avatar: '🛸',
    platform: 'twitter',
    description: 'SpaceX 官方账号',
    followerCount: 35000000,
    isFollowed: false,
  },
];

const vcSources: Source[] = [
  {
    id: 's8',
    name: 'a16z',
    handle: '@a16z',
    avatar: '💼',
    platform: 'twitter',
    description: 'Andreessen Horowitz',
    followerCount: 1200000,
    isFollowed: false,
  },
  {
    id: 's9',
    name: 'Sequoia Capital',
    handle: '@sequoia',
    avatar: '🌲',
    platform: 'twitter',
    description: '红杉资本',
    followerCount: 890000,
    isFollowed: true,
  },
  {
    id: 's10',
    name: 'Marc Andreessen',
    handle: '@pmarca',
    avatar: '👔',
    platform: 'twitter',
    description: 'a16z 联合创始人',
    followerCount: 1500000,
    isFollowed: false,
  },
  {
    id: 's18',
    name: 'Elad Gil',
    handle: '@eladgil',
    avatar: '📊',
    platform: 'twitter',
    description: '高增长创业指南作者，硅谷天使投资人',
    followerCount: 320000,
    isFollowed: false,
  },
];

const researchSources: Source[] = [
  {
    id: 's19',
    name: 'Andrej Karpathy',
    handle: '@karpathy',
    avatar: '🧬',
    platform: 'twitter',
    description: '前 OpenAI / Tesla AI 负责人，AI 教育领域标杆',
    followerCount: 980000,
    isFollowed: true,
  },
  {
    id: 's20',
    name: 'Yann LeCun',
    handle: '@ylecun',
    avatar: '🔭',
    platform: 'twitter',
    description: 'Meta AI 首席科学家，深度学习先驱',
    followerCount: 760000,
    isFollowed: false,
  },
  {
    id: 's21',
    name: 'Ilya Sutskever',
    handle: '@ilyasut',
    avatar: '🌌',
    platform: 'twitter',
    description: 'SSI 创始人，OpenAI 联合创始人',
    followerCount: 540000,
    isFollowed: false,
  },
  {
    id: 's22',
    name: 'ArXiv AI',
    handle: 'arxiv.org/list/cs.AI',
    avatar: '📄',
    platform: 'blog',
    description: 'ArXiv AI 最新论文 RSS',
    followerCount: 0,
    isFollowed: false,
  },
];

const hnSources: Source[] = [
  {
    id: 's23',
    name: 'Hacker News',
    handle: 'news.ycombinator.com',
    avatar: '🟠',
    platform: 'hackernews',
    description: 'YC 旗下技术社区，每日最高质量技术讨论',
    followerCount: 0,
    isFollowed: true,
  },
  {
    id: 's24',
    name: 'HN · Show HN',
    handle: 'news.ycombinator.com/show',
    avatar: '🛠️',
    platform: 'hackernews',
    description: '开发者展示自己作品的频道',
    followerCount: 0,
    isFollowed: false,
  },
  {
    id: 's25',
    name: 'The Batch · Andrew Ng',
    handle: 'deeplearning.ai/the-batch',
    avatar: '📬',
    platform: 'newsletter',
    description: 'Andrew Ng 主编的 AI 周报',
    followerCount: 0,
    isFollowed: false,
  },
];

export const mockChannels: Channel[] = [
  {
    id: 'c1',
    name: 'OpenAI 核心动向',
    icon: '🤖',
    description: '追踪 OpenAI 官方博客、Sam Altman 推特、GPT 系列最新发布',
    subscriberCount: 12580,
    isSubscribed: true,
    pushEnabled: true,
    sources: openAISources,
  },
  {
    id: 'c7',
    name: 'Anthropic & Claude',
    icon: '🧠',
    description: 'Claude 最新进展、安全 AI 研究与 Dario 的思考',
    subscriberCount: 8900,
    isSubscribed: true,
    pushEnabled: true,
    sources: [
      { id: 's14', name: 'Anthropic', handle: '@AnthropicAI', avatar: '🧠', platform: 'twitter', description: 'Anthropic 官方', followerCount: 320000, isFollowed: true },
      { id: 's15', name: 'Dario Amodei', handle: '@DarioAmodei', avatar: '🔬', platform: 'twitter', description: 'Anthropic CEO', followerCount: 180000, isFollowed: false },
      { id: 's26', name: 'Anthropic Blog', handle: 'anthropic.com/news', avatar: '📝', platform: 'blog', description: 'Anthropic 官方博客', followerCount: 0, isFollowed: true },
    ],
  },
  {
    id: 'c8',
    name: 'Google DeepMind',
    icon: '🔬',
    description: 'Gemini、Veo、AlphaFold 等前沿 AI 研究与产品',
    subscriberCount: 7100,
    isSubscribed: false,
    sources: [
      { id: 's16', name: 'Google DeepMind', handle: '@GoogleDeepMind', avatar: '🔬', platform: 'twitter', description: 'DeepMind 官方', followerCount: 890000, isFollowed: false },
      { id: 's17', name: 'Demis Hassabis', handle: '@DemisHassabis', avatar: '🎮', platform: 'twitter', description: 'DeepMind CEO', followerCount: 320000, isFollowed: false },
    ],
  },
  {
    id: 'c3',
    name: '硅谷顶级 VC',
    icon: '💰',
    description: 'a16z、Sequoia 等顶级机构的投资动态与行业判断',
    subscriberCount: 8200,
    isSubscribed: true,
    pushEnabled: false,
    sources: vcSources,
  },
  {
    id: 'c6',
    name: 'Y Combinator',
    icon: '🎯',
    description: 'YC 创业营动态、Demo Day 速报与创始人洞察',
    subscriberCount: 6800,
    isSubscribed: false,
    sources: [
      { id: 's12', name: 'Y Combinator', handle: '@ycombinator', avatar: '🎯', platform: 'twitter', description: 'YC 官方', followerCount: 1100000, isFollowed: false },
      { id: 's13', name: 'Garry Tan', handle: '@garrytan', avatar: '👨‍💼', platform: 'twitter', description: 'YC CEO', followerCount: 450000, isFollowed: false },
      { id: 's27', name: 'YC Blog', handle: 'ycombinator.com/blog', avatar: '📝', platform: 'blog', description: 'YC 官方博客', followerCount: 0, isFollowed: false },
    ],
  },
  {
    id: 'c9',
    name: 'AI 研究前沿',
    icon: '🧬',
    description: 'Karpathy、Yann LeCun 等顶级研究者 + ArXiv 最新论文',
    subscriberCount: 9300,
    isSubscribed: false,
    sources: researchSources,
  },
  {
    id: 'c10',
    name: 'Hacker News 精选',
    icon: '🟠',
    description: '每日 HN 热榜精华 + Show HN 值得关注的新项目',
    subscriberCount: 11200,
    isSubscribed: false,
    sources: hnSources,
  },
  {
    id: 'c4',
    name: 'AI 产品与工具',
    icon: '🚀',
    description: 'Product Hunt AI 榜单、独立开发者新品、每日 AI 工具速览',
    subscriberCount: 7650,
    isSubscribed: false,
    sources: [
      { id: 's11', name: 'Product Hunt', handle: '@ProductHunt', avatar: '🚀', platform: 'twitter', description: '产品发现平台', followerCount: 560000, isFollowed: false },
      { id: 's28', name: 'Lenny Rachitsky', handle: '@lennysan', avatar: '📊', platform: 'newsletter', description: '顶级产品 Newsletter', followerCount: 0, isFollowed: false },
    ],
  },
  {
    id: 'c5',
    name: 'Elon Musk & xAI',
    icon: '⚡',
    description: 'Elon Musk、xAI / Grok 最新动态与 Tesla/SpaceX 消息',
    subscriberCount: 15200,
    isSubscribed: false,
    sources: elonSources,
  },
];

export const mockArticles: Article[] = [
  // 长内容示例：a16z 深度分析文章（使用章节结构）
  {
    id: 'a1',
    title: 'a16z 深度解析：为什么它不只是一家基金',
    summary: '深入剖析 a16z 的战略逻辑、三个时代的投资方法论演变，以及 Databricks 案例如何完美诠释其投资哲学...',
    channelId: 'c3',
    channelName: 'a16z & Sequoia',
    channelIcon: '💰',
    sourceUrl: 'https://mp.weixin.qq.com/s/a16z-deep-dive',
    publishedAt: '2026-01-21T08:30:00Z',
    readTime: 15,
    sourceType: 'blog',
    authorName: '硅谷早知道',
    authorHandle: '@svinsider',
    aiSummary: {
      introduction: '这篇深度长文全面解析了 a16z 从 2009 年至今的演变历程，揭示了其从普通 VC 基金成长为"科技公司型投资机构"的核心逻辑。文章通过三个时代的框架，系统性地分析了 a16z 如何在每个阶段做出反共识的正确判断。',
      chapters: [
        {
          title: 'a16z 不是基金，是一家 Firm——这是理解它的起点',
          points: [
            {
              title: '规模焦虑？不存在的',
              details: '2025年，a16z 单家募集的 150 亿美元，超过了 Lightspeed（90亿）和 Founders Fund（56亿）的总和，占全美风投总募资额的 18% 以上。行业平均需要 16 个月关闭一支基金，a16z 只用了 3 个多月。',
            },
            {
              title: '一个被严重低估的事实',
              details: '从 2009 到 2025 年，a16z 主导了 31 家最终估值突破 50 亿美元公司的早期轮次融资——比第二名和第三名加起来还要高出 50%。全球估值前 15 的私营科技公司，a16z 投中了 10 家：OpenAI、SpaceX、xAI、Databricks、Stripe、Revolut、Waymo、Wiz、SSI 和 Anduril。',
            },
            {
              title: 'Fund vs Firm 的本质区别',
              details: 'Fund 的目标：以最少的人、最短的时间，赚取最多的 carry。Firm 的目标：创造卓越回报，并构建可复利的竞争优势——让规模成为助力，而非负担。a16z 选择了后者，把自己当成一家科技公司来运营。',
            },
          ],
        },
        {
          title: '三个时代，三次押注——每次都被嘲笑，每次都对了',
          points: [
            {
              title: '第一时代（2009-2017）：敢付溢价，因为市场系统性低估',
              details: '2009 年，所有人都说 a16z 的估值太高了。从 eBay 手中以 27 亿美元收购 Skype，被认为"根本不可能完成"。不到两年，微软 85 亿美元接盘。AH Fund III 的净 TVPI 达到 11.3 倍，被认为是有史以来表现最好的大型风投基金之一。',
            },
            {
              title: '第二时代（2018-2024）：公司越来越大，越来越久不上市',
              details: '关键洞察：赢家比任何人预期的都要大得多，而且保持私有的时间更长。这个时代，a16z 通过 19 支基金募集了 329 亿美元。它做了三件事：募集更大规模的基金、去中心化（推出专门的加密、后期、种子基金）、更长时间持有。',
            },
            {
              title: '第三时代（2024-现在）：是时候引领时代了',
              details: 'Ben Horowitz 的宣言："作为美国风险投资领域的领导者，美国新兴技术的命运部分地落在我们的肩上。我们的使命是确保美国赢得未来 100 年的技术。"',
            },
          ],
        },
        {
          title: 'Databricks——a16z 投资方法论最完美的体现',
          points: [
            {
              title: '持续加注的勇气',
              details: 'a16z 从 A 轮开始投资 Databricks，此后每一轮都追加投资。当估值从 10 亿涨到 100 亿时，大多数 VC 会选择"落袋为安"，但 a16z 选择继续加码。',
            },
            {
              title: '平台服务的价值',
              details: 'a16z 不只是给钱。他们帮助 Databricks 招募了 CFO、CMO，引荐了 50+ 家企业客户，在 IPO 准备阶段提供了全方位支持。这就是 Firm vs Fund 的具体体现。',
            },
            {
              title: '今天的成果',
              details: 'Databricks 最新估值 620 亿美元，a16z 的持仓价值超过 150 亿美元，占其全部基金净资产的 23%。这一笔投资的回报，可能超过很多 VC 整个基金的总回报。',
            },
          ],
        },
      ],
      exclusiveComment: '这篇文章让我们看到了 a16z 成功的真正秘诀：不是更聪明的判断，而是更系统化的能力建设。当其他 VC 还在比拼"谁更懂行业"时，a16z 已经在比拼"谁能为创业者创造更多价值"。这种思维方式的转变，值得每一个投资人和创业者深思。从某种意义上说，a16z 的故事也是一个创业故事——如何用工程师思维重新定义一个传统行业。',
    },
    originalContent: `原文来源：硅谷早知道 公众号
发布时间：2026年1月21日

一、a16z不是基金,是一家Firm——这是理解它的起点

1. 规模焦虑?不存在的

2025年,a16z单家募集的150亿美元,超过了Lightspeed(90亿)和Founders Fund(56亿)的总和。占了全美风投总募资额的18%以上。

行业平均需要16个月关闭一支基金,a16z只用了3个多月。

很多人的第一反应是:基金规模这么大,怎么可能有好回报?

a16z的回应简单粗暴:"Blah blah blah。我们是在猎象,专打大猎物。"

2. 一个被严重低估的事实

从2009到2025年,a16z主导了31家最终估值突破50亿美元公司的早期轮次融资——比第二名和第三名加起来还要高出50%。

全球估值前15的私营科技公司,a16z投中了10家:OpenAI、SpaceX、xAI、Databricks、Stripe、Revolut、Waymo、Wiz、SSI和Anduril。

这不是运气。这是系统性优势的结果。

3. Fund vs Firm的本质区别

Fund的目标:以最少的人、最短的时间,赚取最多的carry。

Firm的目标:创造卓越回报,并构建可复利的竞争优势——让规模成为助力,而非负担。

a16z选择了后者。它把自己当成一家科技公司来运营,而不是传统金融机构。工程师思维让它相信:可以通过构建和扩展更优系统,把整个蛋糕做大。

二、三个时代,三次押注——每次都被嘲笑,每次都对了

4. 第一时代(2009-2017):敢付溢价,因为市场系统性低估

2009年,所有人都说a16z的估值太高了。

从eBay手中以27亿美元收购Skype,被认为"根本不可能完成"。不到两年,微软85亿美元接盘。

2010年对Facebook投5000万(估值340亿)、Groupon投4000万(估值50亿)、Twitter投4800万(估值40亿)。竞争对手说这是"猪肚期货",不是风投该干的事。

2012年募集10亿美元三期基金时,凯夫曼基金会报告说"风投行业表现糟糕"。

结果?

AH Fund III的净TVPI达到11.3倍(算上平行基金是9.1倍),被认为是有史以来表现最好的大型风投基金之一。

光是Databricks一家,现在就占a16z全部基金净资产的23%。

5. 第二时代(2018-2024):公司越来越大,越来越久不上市

关键洞察:赢家比任何人预期的都要大得多,而且保持私有的时间更长。

这个时代,a16z通过19支基金募集了329亿美元(第一时代九支基金只募了62亿)。

它做了三件事:

募集更大规模的基金(最糟糕的事是错过赢家,或在赢家中所占份额不够多)

去中心化(推出专门的加密、后期、种子、游戏基金,每个垂直领域都有专属平台团队)

更长时间持有(成为注册投资顾问RIA,自由投资二级市场和后期轮次)

Late Stage Ventures基金的战绩说明一切:

LSV I净TVPI 3.3倍,LSV II净TVPI 1.2倍,LSV III净TVPI 1.4倍——全都排在同年份基金的前5%或前25%。

6. 第三时代(2024-现在):是时候引领时代了

Ben Horowitz的宣言:"作为美国风险投资领域的领导者,美国新兴技术的命运部分地落在我们的肩上。我们的使命是确保美国赢得未来100年的技术。"

对于一家风投公司来说,这话说得够狂的。

但如果你接受这些前提——技术是进步的引擎,美国领导地位取决于技术优势,a16z是美国新兴科技公司最大最有影响力的支持者——那这话也不算完全不合理。

三、Databricks——a16z投资方法论最完美的体现

[以下内容省略...]`,
  },
  // 短内容示例：Twitter（保持原有结构）
  {
    id: 'a1-short',
    title: 'OpenAI 发布 GPT-5 预览版，性能提升 50%',
    summary: 'Sam Altman 在推特宣布 GPT-5 即将发布，新模型在推理能力上有重大突破。据内部测试数据显示，GPT-5 在复杂数学推理任务上的准确率提升了 50%，同时支持更长的上下文窗口...',
    channelId: 'c1',
    channelName: 'OpenAI 核心动向',
    channelIcon: '🤖',
    sourceUrl: 'https://x.com/sama/status/123456789',
    publishedAt: '2026-01-21T07:30:00Z',
    readTime: 3,
    sourceType: 'twitter',
    authorName: 'Sam Altman',
    authorHandle: '@sama',
    aiSummary: {
      introduction: 'OpenAI 正式宣布 GPT-5 预览版即将发布，这是继 GPT-4 之后最重大的模型升级。新模型在推理、编程和多模态能力上都有显著提升。',
      corePoints: [
        '推理能力提升 50%：在复杂数学和逻辑推理任务上表现更优',
        '上下文窗口扩展至 256K tokens，可处理更长文档',
        '多模态能力增强：支持实时视频理解和生成',
        '安全性改进：内置更强的内容过滤和对齐机制',
      ],
      exclusiveComment: '这次发布时机非常微妙。一方面，Anthropic 的 Claude 3.5 刚刚在编程任务上超越 GPT-4；另一方面，Google 的 Gemini 2.0 也在紧锣密鼓筹备中。OpenAI 选择此时放出预览版，明显是想在竞争中保持领先地位。',
    },
    originalContent: `Sam Altman (@sama) · 2h

Big news: GPT-5 preview is coming soon. 

We've achieved a 50% improvement in complex reasoning tasks. The new model also features a 256K context window and enhanced multimodal capabilities.

This is our biggest leap since GPT-4. Can't wait for you all to try it.

🧵 More details in thread...`,
  },
  {
    id: 'a2',
    title: 'Sam Altman: "AGI 比我们想象的更近"',
    summary: 'OpenAI CEO Sam Altman 在最新采访中表示，通用人工智能（AGI）的实现时间可能比外界预期的更早。他强调 OpenAI 正在加大安全研究投入...',
    channelId: 'c2',
    channelName: 'Sam Altman',
    channelIcon: '👤',
    sourceUrl: 'https://youtube.com/watch?v=abc123',
    publishedAt: '2026-01-21T06:15:00Z',
    readTime: 2,
    sourceType: 'youtube',
    authorName: 'Lex Fridman',
    authorHandle: '@lexfridman',
    aiSummary: {
      introduction: '在 Lex Fridman 播客的最新一期中，Sam Altman 深入探讨了 AGI 的发展时间线，并分享了他对 AI 安全和人类未来的思考。',
      corePoints: [
        'AGI 时间线提前：Altman 暗示 AGI 可能在 2027 年前实现',
        '安全投入翻倍：OpenAI 将安全研究预算提升至总研发的 30%',
        '监管合作：正在与多国政府合作制定 AI 治理框架',
        '开源争议：解释了为何 OpenAI 选择了部分闭源策略',
      ],
      exclusiveComment: 'Altman 的"AGI 更近"发言引发了业界广泛讨论。值得注意的是，他说的是"实现"而非"部署"——这意味着即使技术上达到 AGI 水平，公开发布可能还需要更长时间来确保安全性。结合 OpenAI 最近的组织架构调整，可以看出他们正在为这个里程碑做全面准备。',
    },
    originalContent: `[Lex Fridman Podcast #412 - Sam Altman on AGI, Safety, and the Future]

Transcript excerpt (12:34 - 18:20):

Lex: Let's talk about AGI. Where do you think we are on the timeline?

Sam: You know, I've been thinking about this a lot. And I think... we're closer than most people realize. When I look at the capabilities we're developing internally, the rate of progress is genuinely surprising even to me.

Lex: Can you put a number on it? A year?

Sam: I don't want to make specific predictions because they always come back to haunt you. But I will say this - the gap between where we are now and what we'd call AGI is smaller than the gap we've already crossed.

Lex: That's a significant statement.

Sam: It is. And it's why we're doubling down on safety research. We're now allocating 30% of our compute to safety-related research. That's a massive investment.

Lex: Some critics say you're not doing enough on safety. How do you respond?

Sam: I think those criticisms are fair and important. We should be held to a high standard. But I also think if people saw what we're doing internally, they'd be more reassured. We're working with governments, with academics, with civil society. This is too important to get wrong.

[...]`,
  },
  {
    id: 'a3',
    title: 'a16z 领投 AI 编程助手，估值达 20 亿美元',
    summary: 'Andreessen Horowitz 宣布领投一家 AI 编程初创公司的 C 轮融资，投后估值达到 20 亿美元。这是 2026 年迄今为止最大的 AI 领域融资之一...',
    channelId: 'c3',
    channelName: 'a16z & Sequoia',
    channelIcon: '💰',
    sourceUrl: 'https://a16z.com/blog/ai-coding-investment',
    publishedAt: '2026-01-21T04:00:00Z',
    readTime: 4,
    sourceType: 'blog',
    authorName: 'Marc Andreessen',
    authorHandle: '@pmarca',
    aiSummary: {
      introduction: 'a16z 以 5 亿美元领投 Cursor 的 C 轮融资，将这家 AI 编程助手公司的估值推至 20 亿美元，创下 2026 年 AI 工具赛道融资纪录。',
      corePoints: [
        '融资规模：C 轮 5 亿美元，估值 20 亿',
        '投资方阵容：a16z 领投，Sequoia、Index Ventures 跟投',
        '用户增长：月活开发者突破 200 万，同比增长 400%',
        '商业化进展：企业版 ARR 已达 1 亿美元',
      ],
      exclusiveComment: '这笔投资反映了 VC 对 AI 编程工具赛道的极度看好。Cursor 的增长速度确实惊人，但 20 亿估值意味着需要至少 40 倍的 ARR 倍数才能合理。考虑到 GitHub Copilot、Amazon CodeWhisperer 等巨头的竞争，Cursor 需要在差异化和企业客户获取上持续发力。',
    },
    originalContent: `a16z Blog: Investing in the Future of Software Development

Today, we're thrilled to announce our investment in Cursor, the AI-powered code editor that's transforming how developers write software.

We're leading their $500M Series C at a $2B valuation, alongside our friends at Sequoia and Index Ventures.

Why Cursor?

1. Product-Market Fit: 2 million monthly active developers don't lie. The organic growth we've seen is remarkable.

2. Technical Moat: Their context-aware AI isn't just autocomplete—it understands your entire codebase.

3. Enterprise Traction: $100M ARR from enterprise customers who are seeing 40% productivity gains.

4. Team: The founders (MIT PhDs in ML) combine deep technical expertise with product intuition.

The AI coding market is just getting started. We believe Cursor will be one of the defining companies of this era.

— Marc Andreessen`,
  },
  {
    id: 'a4',
    title: 'Claude 3.5 发布: 在编程任务上超越 GPT-4',
    summary: 'Anthropic 今日发布 Claude 3.5，在多项基准测试中表现优异。特别是在代码生成和复杂推理任务上，Claude 3.5 展现出了超越竞品的能力...',
    channelId: 'c7',
    channelName: 'Anthropic Claude',
    channelIcon: '🧠',
    sourceUrl: 'https://anthropic.com/news/claude-3-5',
    publishedAt: '2026-01-20T22:00:00Z',
    readTime: 5,
    sourceType: 'blog',
    authorName: 'Dario Amodei',
    authorHandle: '@DarioAmodei',
    aiSummary: {
      introduction: 'Anthropic 发布 Claude 3.5，在 HumanEval 编程基准测试中首次超越 GPT-4，标志着 AI 编程能力的新突破。',
      corePoints: [
        '编程能力领先：HumanEval 得分 92.1%，超越 GPT-4 的 89.3%',
        '推理能力增强：MATH 基准测试提升 15 个百分点',
        '上下文理解：支持 200K tokens，完整阅读中等规模代码库',
        '安全特性：新增 Constitutional AI 2.0 安全框架',
      ],
      exclusiveComment: 'Claude 3.5 的发布对 OpenAI 构成了实质性威胁。特别是在编程这个高价值场景，92.1% 的 HumanEval 得分意味着在大多数日常编程任务上，Claude 已经足够好用。但 GPT-5 的预览版消息可能是 OpenAI 的反击信号，AI 大模型的军备竞赛正在加速。',
    },
    originalContent: `Anthropic Research Blog: Introducing Claude 3.5

We're excited to announce Claude 3.5, our most capable model yet.

Key Highlights:

**Coding Excellence**
Claude 3.5 achieves 92.1% on HumanEval, our best result ever and a new state-of-the-art for publicly available models. Real-world testing shows developers complete tasks 35% faster when using Claude 3.5.

**Enhanced Reasoning** 
On the MATH benchmark, Claude 3.5 scores 78.2%, a 15 percentage point improvement over Claude 3. Complex multi-step problems that previously stumped AI assistants are now solvable.

**Constitutional AI 2.0**
We've significantly improved our safety framework. Claude 3.5 is better at recognizing and refusing harmful requests while remaining helpful for legitimate use cases.

**Availability**
Claude 3.5 is available today on claude.ai and through our API. Enterprise customers can access it immediately.

Read our full technical report for more details.

— The Anthropic Team`,
  },
  {
    id: 'a5',
    title: 'Product Hunt 今日热门: 10 款 AI 工具值得关注',
    summary: '今日 Product Hunt 上线了多款优秀的 AI 产品，包括一款能够自动生成 PPT 的工具、一个 AI 视频剪辑助手，以及一款革命性的 AI 写作工具...',
    channelId: 'c4',
    channelName: 'Product Hunt',
    channelIcon: '🚀',
    sourceUrl: 'https://producthunt.com/posts/ai-tools-roundup',
    publishedAt: '2026-01-20T18:30:00Z',
    readTime: 3,
    sourceType: 'website',
    authorName: 'Product Hunt',
    authorHandle: '@ProductHunt',
    aiSummary: {
      introduction: 'Product Hunt 今日上榜的 AI 产品汇总，涵盖办公效率、内容创作和开发者工具三大类别。',
      corePoints: [
        'Gamma 2.0: AI PPT 生成，一键创建专业演示文稿',
        'Descript 4.0: 视频剪辑革命，像编辑文档一样编辑视频',
        'Notion AI Q&A: 企业知识库问答，秒级响应',
        'Raycast AI: macOS 效率神器，本地 AI 助手',
      ],
      exclusiveComment: '今天的榜单质量很高，值得关注的是 Gamma 2.0——它可能真正解决了"做 PPT 太痛苦"这个普遍问题。从产品形态看，AI Native 应用正在从"功能增强"走向"流程重塑"，这是值得创业者学习的方向。',
    },
    originalContent: `Product Hunt Daily Digest - January 20, 2026

🏆 Today's Top Products

1. **Gamma 2.0** - AI-powered presentations
   "Just describe what you want, get a stunning deck in seconds"
   ⬆️ 1,247 upvotes

2. **Descript 4.0** - Edit video like a doc
   "The future of video editing is text-based"
   ⬆️ 892 upvotes

3. **Notion AI Q&A** - Ask anything about your workspace
   "Your company's knowledge, instantly accessible"
   ⬆️ 756 upvotes

4. **Raycast AI** - Local AI for macOS
   "Your personal AI that respects your privacy"
   ⬆️ 634 upvotes

5. **Lovable** - Build apps with AI
   "From idea to deployed app in minutes"
   ⬆️ 589 upvotes

[View all on ProductHunt.com]`,
  },
];

export const mockDailySummary: DailySummary = {
  date: '2026-01-21',
  title: '今日 AI 圈大事',
  content: 'OpenAI GPT-5 预览版发布引发热议，Sam Altman 暗示 AGI 临近；a16z 大手笔投资 AI 编程赛道；Anthropic Claude 3.5 在多项测试中表现亮眼。',
  articleCount: 12,
  channelCount: 5,
};

// 每日播报（TTS 音频 + 数字人口播视频）
// ⚠️ 占位媒体：接入 DreamAPI LipSync 生成后，把 audioUrl / videoUrl 换成真实文件
//    （建议把生成的文件放进 public/，再用 '/broadcast/2026-06-02.mp4' 这种本地路径引用）
export const mockBroadcast: DailyBroadcast = {
  date: mockDailySummary.date,
  title: '硅谷速递 · 今日播报',
  description: mockDailySummary.content,
  audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  posterImage: '/placeholder.svg',
};

export const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 6) return '夜深了';
  if (hour < 9) return '早安';
  if (hour < 12) return '上午好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  if (hour < 22) return '晚上好';
  return '夜深了';
};

export const formatPublishTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins} 分钟前`;
  if (diffHours < 24) return `${diffHours} 小时前`;
  if (diffDays < 7) return `${diffDays} 天前`;
  
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
};

// 获取来源图标
export const getSourceIcon = (sourceType: string): string => {
  switch (sourceType) {
    case 'twitter': return '𝕏';
    case 'youtube': return '▶️';
    case 'blog': return '📝';
    case 'website': return '🌐';
    default: return '📄';
  }
};

// 获取来源名称
export const getSourceName = (sourceType: string): string => {
  switch (sourceType) {
    case 'twitter': return 'X (Twitter)';
    case 'youtube': return 'YouTube';
    case 'blog': return '博客';
    case 'website': return '网站';
    default: return '其他';
  }
};
