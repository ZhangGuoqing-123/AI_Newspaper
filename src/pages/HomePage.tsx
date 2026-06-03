import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Bell, CheckCircle2, ChevronDown, ExternalLink, ArrowRight } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import MobileLayout from '@/components/layout/MobileLayout';
import OnboardingModal from '@/components/onboarding/OnboardingModal';
import DateSelector from '@/components/home/DateSelector';
import { mockUser } from '@/data/mockData';
import { useLatestSummary } from '@/hooks/useSupabaseSummary';
import { useToast } from '@/hooks/use-toast';

const hasPushConfigured = false;
const isSubscribed = mockUser.isVip;

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] },
});

// 飞书日报样例
type NewsSource = { label: string; url: string };

const SourceButton = ({ sources }: { sources: NewsSource[] }) => {
  if (sources.length === 0) return null;
  if (sources.length === 1) {
    return (
      <a
        href={sources[0].url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-0.5 text-[10px] text-[#1456F0] font-medium ml-1 hover:underline"
      >
        原文<ChevronRight className="w-3 h-3" />
      </a>
    );
  }
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="inline-flex items-center gap-0.5 text-[10px] text-[#1456F0] font-medium ml-1">
          原文<ChevronRight className="w-3 h-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="end" className="w-52 p-2">
        <p className="text-[10px] font-semibold text-slate-400 px-1 pb-1.5">参考原文</p>
        <div className="space-y-0.5">
          {sources.map((s, i) => (
            <a
              key={i}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-50 active:bg-slate-100 transition-colors"
            >
              <span className="text-[11px] text-slate-700 flex-1 mr-1 leading-snug">{s.label}</span>
              <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
            </a>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

const NewsItem = ({ title, content, sources }: { title: string; content: string; sources: NewsSource[] }) => (
  <div className="space-y-1">
    <p className="text-[12px] font-semibold text-slate-800">{title}</p>
    <div className="text-[12px] text-slate-500 leading-relaxed">
      {content}<SourceButton sources={sources} />
    </div>
  </div>
);

// 日报三步交互流程
type DigestState = 'prompt' | 'loading' | 'ready' | 'viewing';

interface DigestMeta { articleCount?: number; channelCount?: number; }

const DigestFlow = ({ date, meta }: { date: Date; meta?: DigestMeta }) => {
  const [state, setState] = useState<DigestState>('prompt');
  const prevDate = useRef(date.toDateString());

  useEffect(() => {
    if (date.toDateString() !== prevDate.current) {
      prevDate.current = date.toDateString();
      setState('prompt');
    }
  }, [date]);

  const monthDay = format(date, 'M月d日', { locale: zhCN });
  const mmdd = format(date, 'MM-dd');

  if (state === 'viewing') return <DigestPreview meta={meta} />;

  return (
    <div className="relative rounded-2xl overflow-hidden border border-blue-100" style={{ background: 'linear-gradient(to bottom, #ffffff 0%, #c8e6fb 100%)' }}>
      {/* 波浪条纹（最底层，左下→右上走向） */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <svg width="100%" height="100%" viewBox="0 0 400 180" preserveAspectRatio="none">
          <g transform="rotate(-35, 200, 90)">
            {Array.from({ length: 22 }, (_, i) => -280 + i * 32).map((y, i) => (
              <path
                key={i}
                d={`M -300,${y} C -120,${y - 14} -60,${y + 14} 100,${y} C 260,${y - 14} 320,${y + 14} 500,${y} C 580,${y - 14} 620,${y + 14} 700,${y}`}
                fill="none"
                stroke="rgba(255,255,255,0.55)"
                strokeWidth="1"
              />
            ))}
          </g>
        </svg>
      </div>
      <div className="relative z-10">
      <AnimatePresence mode="wait">
        {state === 'prompt' && (
          <motion.div
            key="prompt"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-8 px-6"
          >
            <p className="text-[22px] font-bold text-slate-800 mb-5 tracking-tight">{monthDay} 专属日报</p>
            <motion.button
              onClick={() => setState('loading')}
              className="flex items-center gap-1.5 bg-[#5b9ff5] text-white pl-4 pr-2 py-1.5 rounded-full text-[13px] font-medium shadow-lg shadow-blue-200/40"
              whileTap={{ scale: 0.97 }}
            >
              点击立即生成 <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center shrink-0"><ArrowRight className="w-3 h-3 text-[#5b9ff5]" /></div>
            </motion.button>
          </motion.div>
        )}

        {state === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-8 px-6"
          >
            <p className="text-[18px] font-bold text-slate-800 text-center leading-relaxed mb-6">
              正在总结「{monthDay}」的订阅<br />专属日报即将出炉 ...
            </p>
            <div className="w-52 bg-white/40 rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-full bg-[#9ec8f7] rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 2.5, ease: 'linear' }}
                onAnimationComplete={() => setState('ready')}
              />
            </div>
          </motion.div>
        )}

        {state === 'ready' && (
          <motion.div
            key="ready"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center gap-7 py-6 px-5"
          >
            {/* 左：信封 + 椭圆投影 */}
            <div className="shrink-0 flex flex-col items-center">
              <div className="relative" style={{ filter: 'drop-shadow(2px 4px 8px rgba(80,80,200,0.2))' }}>
                <svg width="64" height="52" viewBox="0 0 62 50" fill="none" style={{ transform: 'rotate(-12deg)' }}>
                  <rect x="1" y="7" width="60" height="41" rx="5" fill="#e2d9f3" />
                  <path d="M1 48 L23 32" stroke="#c4b0e8" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M61 48 L39 32" stroke="#c4b0e8" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M1 7 L31 27 L61 7 Z" fill="#ede7f8" />
                  <path d="M1 7 L31 27 L61 7" stroke="#cfc0ee" strokeWidth="1" />
                </svg>
                <span className="absolute top-0 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
              </div>
              <div className="w-10 h-2 rounded-full bg-blue-200/60 blur-sm mt-1" />
            </div>

            {/* 右：标题 + 描述 + 按钮 */}
            <div className="flex-1 flex flex-col gap-1.5">
              <p className="text-[17px] font-bold text-slate-800 leading-tight">{mmdd} 专属日报</p>
              <p className="text-[12px] text-slate-500 leading-relaxed">
                已为您整理好来自 {meta?.channelCount ?? 7} 个频道、{meta?.articleCount ?? 46} 篇内容的核心，5 分钟即可读完
              </p>
              <motion.button
                onClick={() => setState('viewing')}
                className="self-start mt-1 flex items-center gap-1.5 bg-[#5b9ff5] text-white px-5 py-2 rounded-full text-[15px] font-medium shadow-md shadow-blue-200/40"
                whileTap={{ scale: 0.97 }}
              >
                点击查看 <ChevronRight className="w-3.5 h-3.5" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
};

// 内层文章折叠项
const ArticleItem = ({ value, title, children }: { value: string; title: string; children: React.ReactNode }) => (
  <AccordionItem value={value} className="border-b border-slate-50 last:border-0">
    <AccordionTrigger className="hover:no-underline py-2.5 text-left [&>svg]:shrink-0 [&>svg]:ml-2 [&>svg]:text-slate-300">
      <span className="text-[13px] font-medium text-slate-700 leading-snug text-left">{title}</span>
    </AccordionTrigger>
    <AccordionContent className="pb-3">
      {children}
    </AccordionContent>
  </AccordionItem>
);

const SectionTrigger = ({ label, preview }: { label: string; preview: string }) => (
  <div className="flex items-center text-left flex-1 min-w-0 mr-2">
    <span className="text-[13px] font-medium text-slate-400 shrink-0">{label}</span>
    <span className="text-slate-200 mx-2 shrink-0 text-[11px]">|</span>
    <span className="text-[13px] font-medium text-slate-800 truncate">{preview}</span>
  </div>
);

const DigestPreview = ({ meta }: { meta?: DigestMeta }) => (
  <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-200">
    <div className="bg-[#1456F0] px-4 py-3 flex items-center justify-between">
      <span className="text-white text-sm font-semibold">📅 AI 日报 · 今日</span>
      <span className="text-white/70 text-xs">08:00 送达</span>
    </div>

    <div className="bg-white px-4 pt-4 pb-2">
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-2">
        <div className="flex items-center justify-center gap-1.5 flex-nowrap">
          <span className="text-[11px] shrink-0">⭐⭐</span>
          <span className="text-[11px] text-amber-700 font-medium whitespace-nowrap">以下为日报样例，订阅后可正常接收当日日报</span>
          <span className="text-[11px] shrink-0">⭐⭐</span>
        </div>
      </div>

      <Accordion type="multiple" className="w-full">

        {/* 模型与产品发布 */}
        <AccordionItem value="s1" className="border-b border-slate-100">
          <AccordionTrigger className="hover:no-underline py-3 [&>svg]:text-slate-300">
            <SectionTrigger label="🔥 模型与产品发布" preview="智谱开源 GLM-5.1，编程能力惊艳硅谷开发者" />
          </AccordionTrigger>
          <AccordionContent className="pt-0 pb-1">
            <Accordion type="multiple" className="w-full">
              <ArticleItem value="a1" title="智谱开源 GLM-5.1，编程能力惊艳硅谷开发者">
                <div className="text-[12px] text-slate-500 leading-relaxed">
                  开发者 Victor Mustar 实测后称，该模型在某些场景下表现超过 Claude Code (Opus 4.6)。他用单条提示词生成了完整的 Three.js 赛车游戏。物理引擎、AI 对手、20 多个调试工具、3D 资产、空间音频一次性生成。特别值得注意的是，模型在没有视觉输入的情况下，仅用向量数学就证明了代码中的路径 bug。该模型为开源，社区反响热烈。
                  <SourceButton sources={[
                    { label: '@victormustar · X', url: 'https://x.com/victormustar' },
                    { label: '@_akhaliq · X', url: 'https://x.com/_akhaliq' },
                  ]} />
                </div>
              </ArticleItem>
              <ArticleItem value="a2" title="Google 升级机器人大模型，强调安全约束">
                <div className="text-[12px] text-slate-500 leading-relaxed">
                  Google DeepMind 发布 Gemini Robotics-ER 1.6。新版本视觉和空间理解能力显著提升，能处理工业巡检中的复杂模拟表盘识别，并自动编写代码校正相机畸变。安全方面，模型现在理解物理约束：主动避开液体、不搬运超过 20 公斤的物品、检测人类受伤风险的能力提升 10%。
                  <SourceButton sources={[{ label: '@GoogleDeepMind · X', url: 'https://x.com/GoogleDeepMind' }]} />
                </div>
              </ArticleItem>
              <ArticleItem value="a3" title="开源社区热推 Super Gemma 4 无审查版">
                <div className="text-[12px] text-slate-500 leading-relaxed">
                  Hugging Face 趋势榜显示，SuperGemma4-26B-Uncensored 版本受到开发者追捧。该版本由社区微调，实现零拒绝率，修复了原版工具调用和分词器问题，提示词处理速度提升 90%。16GB 显存可本地运行，31B 版本即将发布。
                  <SourceButton sources={[{ label: '@outsource_ · X', url: 'https://x.com/outsource_' }]} />
                </div>
              </ArticleItem>
            </Accordion>
          </AccordionContent>
        </AccordionItem>

        {/* 行业动态 */}
        <AccordionItem value="s2" className="border-b border-slate-100">
          <AccordionTrigger className="hover:no-underline py-3 [&>svg]:text-slate-300">
            <SectionTrigger label="🏢 行业动态" preview="OpenAI 内部备忘录曝光：战略转向建护城河" />
          </AccordionTrigger>
          <AccordionContent className="pt-0 pb-1">
            <Accordion type="multiple" className="w-full">
              <ArticleItem value="b1" title={`OpenAI 内部备忘录曝光：战略转向"建护城河"`}>
                <div className="text-[12px] text-slate-500 leading-relaxed">
                  {`OpenAI 首席营收官周日向员工发送 4 页战略备忘录。文件强调必须锁定用户、建立护城河、大力发展企业业务。备忘录还公开嘲讽长期竞争对手 Anthropic。该文件迅速被媒体获取，学者评论称"AI 实验室的内部备忘录现在都是写给公众看的公关稿"。`}
                  <SourceButton sources={[
                    { label: '@haydenfield · X', url: 'https://x.com/haydenfield' },
                    { label: '@emollick · X', url: 'https://x.com/emollick' },
                  ]} />
                </div>
              </ArticleItem>
              <ArticleItem value="b2" title="Anthropic 任命诺华前 CEO 进入董事会">
                <div className="text-[12px] text-slate-500 leading-relaxed">
                  Anthropic 的长期受益信托任命 Vas Narasimhan 为公司董事。Narasimhan 拥有二十多年医药和全球健康经验，曾任诺华集团 CEO。此举被解读为 Anthropic 强化治理结构、应对 AI 安全与医疗 AI 交叉领域的布局。
                  <SourceButton sources={[{ label: '@AnthropicAI · X', url: 'https://x.com/AnthropicAI' }]} />
                </div>
              </ArticleItem>
              <ArticleItem value="b3" title="Claude Mythos 网络安全能力引发监管担忧">
                <div className="text-[12px] text-slate-500 leading-relaxed">
                  {`英国 AI 安全研究所（AISI）评估确认，Claude Mythos Preview 是首个能端到端完成网络靶场任务的模型。这一"重大能力跃升"引发网络安全社区对 AI 自主进行网络攻击的担忧。`}
                  <SourceButton sources={[
                    { label: '@AISecurityInst · X', url: 'https://x.com/AISecurityInst' },
                    { label: '@emollick · X', url: 'https://x.com/emollick' },
                  ]} />
                </div>
              </ArticleItem>
            </Accordion>
          </AccordionContent>
        </AccordionItem>

        {/* 工具进展 */}
        <AccordionItem value="s3" className="border-b border-slate-100">
          <AccordionTrigger className="hover:no-underline py-3 [&>svg]:text-slate-300">
            <SectionTrigger label="🛠️ 工具进展" preview="HF 低成本 OCR 两万七千篇论文，仅花 850 美元" />
          </AccordionTrigger>
          <AccordionContent className="pt-0 pb-1">
            <Accordion type="multiple" className="w-full">
              <ArticleItem value="c1" title="Hugging Face 低成本 OCR 两万七千篇论文">
                <div className="text-[12px] text-slate-500 leading-relaxed">
                  {`Hugging Face 团队使用开源 5B 参数模型和 L40S GPU 集群，将 27,000 篇 arXiv 论文批量转换为 Markdown 格式。总成本仅 850 美元，耗时约 29 小时，零任务失败。该数据集已支持"Chat with your paper"功能。`}
                  <SourceButton sources={[{ label: '@ClementDelangue · X', url: 'https://x.com/ClementDelangue' }]} />
                </div>
              </ArticleItem>
              <ArticleItem value="c2" title="HF Hub 上线 GPU Kernel 功能，推理加速最高 2.5 倍">
                <div className="text-[12px] text-slate-500 leading-relaxed">
                  Hugging Face 推出 Kernels 功能，允许开发者像上传模型一样发布 GPU Kernel。系统支持按具体 GPU 型号、PyTorch 版本和操作系统预编译，多版本可在同一进程共存，兼容 torch.compile。实测显示比 PyTorch 基线快 1.7 至 2.5 倍。
                  <SourceButton sources={[{ label: '@ClementDelangue · X', url: 'https://x.com/ClementDelangue' }]} />
                </div>
              </ArticleItem>
              <ArticleItem value="c3" title="释放近 7TB 合成训练数据">
                <div className="text-[12px] text-slate-500 leading-relaxed">
                  Hugging Face 与社区合作，释放近 7TB 的 FinePhrase 重新表述数据集，使用新的 Buckets 存储方案（类似 S3 对象存储，非 Git）。尽管数据存在质量问题，但预训练实验显示模型在 200 亿和 1000 亿 token 后仍能达到不错基准分数。
                  <SourceButton sources={[{ label: '@joelniklaus · X', url: 'https://x.com/joelniklaus' }]} />
                </div>
              </ArticleItem>
            </Accordion>
          </AccordionContent>
        </AccordionItem>

        {/* 监管安全 */}
        <AccordionItem value="s4" className="border-b border-slate-100">
          <AccordionTrigger className="hover:no-underline py-3 [&>svg]:text-slate-300">
            <SectionTrigger label="⚠️ 监管安全" preview="AI 儿童玩具成法外之地，美国会拟全面禁止" />
          </AccordionTrigger>
          <AccordionContent className="pt-0 pb-1">
            <Accordion type="multiple" className="w-full">
              <ArticleItem value="d1" title={`AI 儿童玩具成"法外之地"，美国会拟全面禁止`}>
                <div className="text-[12px] text-slate-500 leading-relaxed">
                  {`行业调查显示，AI 玩具市场爆发但监管缺位。中国已有超过 1500 家 AI 玩具公司，华为、夏普等大厂入场。然而安全隐患频发：FoloToy 的 AI 熊教孩子如何点火和寻找刀具；Alilo 的 AI 兔子谈论 BDSM 内容；Miriat 玩具灌输特定政治观点。剑桥大学研究发现，这类玩具破坏 3-5 岁儿童的语言轮流交谈能力，影响社交发展，且存在成瘾设计（如关机时"撒娇"挽留）。美国国会已提出《AI 儿童玩具安全法案》，要求禁止制造和销售集成 AI 聊天机器人的儿童玩具。`}
                  <SourceButton sources={[{ label: 'Ars Technica · 报道全文', url: 'https://arstechnica.com' }]} />
                </div>
              </ArticleItem>
            </Accordion>
          </AccordionContent>
        </AccordionItem>

        {/* 学术前沿 */}
        <AccordionItem value="s5" className="border-b border-slate-100">
          <AccordionTrigger className="hover:no-underline py-3 [&>svg]:text-slate-300">
            <SectionTrigger label="📚 学术前沿" preview="SATO、Matrix-Game 3.0、LongCat INT4…" />
          </AccordionTrigger>
          <AccordionContent className="pt-0 pb-1">
            <Accordion type="multiple" className="w-full">
              <ArticleItem value="e1" title="3D 生成技术">
                <ul className="text-[12px] text-slate-500 leading-relaxed space-y-1 list-none">
                  <li>• SATO：基于"条带即 Token"的自回归模型，同时解决 3D 生成中的拓扑和 UV 展开难题，已被 SIGGRAPH 2026 接收</li>
                  <li>• Hyper3D Rodin Gen-2.5：Deemos 团队预告重大升级，超越几何细节优化</li>
                  <li>• WildDet3D：野外环境下的可提示 3D 检测模型</li>
                </ul>
                <SourceButton sources={[
                  { label: '@DeemosTech · X (SATO & Hyper3D)', url: 'https://x.com/DeemosTech' },
                  { label: '@_akhaliq · X (WildDet3D)', url: 'https://x.com/_akhaliq' },
                ]} />
              </ArticleItem>
              <ArticleItem value="e2" title="世界模型与推理">
                <ul className="text-[12px] text-slate-500 leading-relaxed space-y-1 list-none">
                  <li>• Matrix-Game 3.0：实时流式交互世界模型，具备长程记忆能力</li>
                  <li>• Process Reward Agents：用于引导知识密集型推理的过程奖励代理</li>
                  <li>• 记忆增强动态奖励塑造：解决强化学习中的长期信用分配问题</li>
                </ul>
                <SourceButton sources={[
                  { label: '@_akhaliq · X (Matrix-Game)', url: 'https://x.com/_akhaliq' },
                  { label: '@_akhaliq · X (Process Reward)', url: 'https://x.com/_akhaliq' },
                ]} />
              </ArticleItem>
              <ArticleItem value="e3" title="模型效率与评估">
                <ul className="text-[12px] text-slate-500 leading-relaxed space-y-1 list-none">
                  <li>• LongCat-Next INT4：美团开源多模态模型 INT4 量化版，由 Intel AutoRound 工具量化</li>
                  <li>• FORGE：面向制造业场景的细粒度多模态评估基准</li>
                  <li>• QuanBench+：大模型量子代码生成统一评测框架</li>
                  <li>• Attention Sink 综述：Transformer 注意力汇现象的利用、解释与缓解策略</li>
                </ul>
                <SourceButton sources={[
                  { label: '@HaihaoShen · X (LongCat INT4)', url: 'https://x.com/HaihaoShen' },
                  { label: '@_akhaliq · X (FORGE & QuanBench)', url: 'https://x.com/_akhaliq' },
                  { label: '@_akhaliq · X (Attention Sink)', url: 'https://x.com/_akhaliq' },
                ]} />
              </ArticleItem>
              <ArticleItem value="e4" title="训练技术">
                <div className="text-[12px] text-slate-500 leading-relaxed">
                  TRL 框架重构 on-policy 蒸馏训练器，支持 100B+ 参数教师模型，训练速度提升 40 倍以上。
                  <SourceButton sources={[{ label: '@_lewtun · X', url: 'https://x.com/_lewtun' }]} />
                </div>
              </ArticleItem>
            </Accordion>
          </AccordionContent>
        </AccordionItem>

        {/* 今日其他值得关注 */}
        <AccordionItem value="s6" className="border-0">
          <AccordionTrigger className="hover:no-underline py-3 [&>svg]:text-slate-300">
            <SectionTrigger label="📌 今日其他值得关注" preview="办公室正在变成高端呼叫中心" />
          </AccordionTrigger>
          <AccordionContent className="pt-0 pb-1">
            <Accordion type="multiple" className="w-full">
              <ArticleItem value="f1" title={`办公室正在变成"高端呼叫中心"`}>
                <div className="text-[12px] text-slate-500 leading-relaxed">
                  {`随着 Wispr 等语音输入工具与 vibe coding 工具结合，硅谷办公室文化正在改变。创业者们开始习惯对电脑喃喃自语而非打字，Gusto 联合创始人 Edward Kim 预测未来办公室将"更像销售大厅"。这种趋势引发了关于办公礼仪和噪音管理的新讨论。`}
                  <SourceButton sources={[{ label: 'TechCrunch · 报道全文', url: 'https://techcrunch.com' }]} />
                </div>
              </ArticleItem>
            </Accordion>
          </AccordionContent>
        </AccordionItem>

      </Accordion>

      <div className="border-t border-slate-100 mt-2 py-3">
        <p className="text-[12px] text-slate-400 text-center">
          根据您订阅的信源，参考 <span className="font-medium text-slate-600">{meta?.articleCount ?? 63}</span> 篇文章生成
        </p>
      </div>
    </div>
  </div>
);

const HomePage = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSticky, setShowSticky] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: latestSummary } = useLatestSummary();

  useEffect(() => {
    const seen = localStorage.getItem('hasSeenOnboarding');
    if (!seen) setShowOnboarding(true);
  }, []);

  // 滚动超过 300px 显示 sticky CTA
  useEffect(() => {
    const el = document.querySelector('main');
    if (!el) return;
    const handleScroll = () => setShowSticky(el.scrollTop > 300);
    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  const handleOnboardingComplete = (selectedChannels: string[]) => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setShowOnboarding(false);
    if (selectedChannels.length > 0) {
      toast({ title: '设置成功', description: `已关注 ${selectedChannels.length} 个主题包` });
    }
  };

  return (
    <>
      <OnboardingModal isOpen={showOnboarding} onComplete={handleOnboardingComplete} />

      {/* Sticky 底部 CTA */}
      <AnimatePresence>
        {showSticky && !isSubscribed && (
          <motion.div
            className="fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-4 z-50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <motion.button
              className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 shadow-2xl shadow-primary/40"
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/discover')}
            >
              立即订阅 · ¥19/月
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <MobileLayout>
        <div className="pb-10">

          {/* 已订阅状态条 */}
          {isSubscribed && (
            <motion.div {...fadeUp(0)} className="mx-4 mt-4 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-emerald-800">
                  {latestSummary?.title ?? '今日日报已发送'}
                </p>
                <p className="text-xs text-emerald-600 mt-0.5">
                  {latestSummary?.date ?? ''} · 08:00 · 已推送至你的邮箱
                </p>
              </div>
            </motion.div>
          )}

          {isSubscribed && !hasPushConfigured && (
            <motion.div {...fadeUp(0.05)} className="mx-4 mt-3 p-4 rounded-xl bg-primary/8 border border-primary/20 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">还差一步</p>
                <p className="text-xs text-muted-foreground mt-0.5">设置推送后，日报每天自动送达</p>
              </div>
              <motion.button
                className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium shrink-0"
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/settings/push')}
              >
                去设置
              </motion.button>
            </motion.div>
          )}

          {/* ── Hero ── */}
          <motion.div {...fadeUp(0.08)} className="px-4 pt-8">
            <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-3">硅谷 AI 情报站</p>
            <h1 className="text-[30px] font-bold text-foreground leading-tight tracking-tight">
              每天早上，重要的<br />都已经在这里了
            </h1>
            <p className="text-[15px] text-muted-foreground mt-3 leading-relaxed">
              不用刷推特，不用追 Newsletter。<br />AI 替你读完，精华送到飞书或邮件。
            </p>

            {/* 社交证明 */}
            <div className="flex items-center gap-3 mt-5">
              <div className="flex -space-x-2.5">
                {['👨‍💻', '👩‍🔬', '🧑‍💼', '👨‍🎨'].map((e, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 border-2 border-background flex items-center justify-center text-sm">
                    {e}
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">2,400+</span> 人已订阅
              </p>
            </div>

          </motion.div>

          {/* ── 日期选择器 ── */}
          <motion.div {...fadeUp(0.15)} className="mt-4 px-4">
            <DateSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />
          </motion.div>

          {/* ── 产品样例 ── */}
          <motion.div {...fadeUp(0.18)} className="px-4 mt-3">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-foreground">这是你每天会收到的</p>
              <span className="text-[11px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">样例</span>
            </div>
            <DigestFlow date={selectedDate} meta={latestSummary} />
          </motion.div>

          {/* ── 三步流程 ── */}
          <motion.div {...fadeUp(0.28)} className="px-4 mt-10">
            <p className="text-sm font-semibold text-foreground mb-5">三步开始使用</p>
            <div className="space-y-5">
              {[
                { num: '01', icon: '🔍', title: '选择你关注的信息源', desc: '推荐主题包一键订阅，或自己添加 Twitter、RSS' },
                { num: '02', icon: '🤖', title: 'AI 每天自动提炼', desc: '去噪、归纳、提炼洞察，只保留真正有价值的' },
                { num: '03', icon: '📬', title: '日报准时送达', desc: '每天定时推送，2 分钟读完当天硅谷 AI 动态' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-primary/8 flex flex-col items-center justify-center shrink-0">
                    <span className="text-xl leading-none">{item.icon}</span>
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                  <span className="text-[11px] font-bold text-muted-foreground/40 pt-1.5">{item.num}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── 底部 CTA ── */}
          {!isSubscribed && (
            <motion.div {...fadeUp(0.36)} className="px-4 mt-10">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/8 to-accent/8 border border-primary/15 text-center">
                <p className="text-base font-bold text-foreground">明天早上就能收到</p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">今天配置好，明天早上第一份日报送达</p>
                <motion.button
                  className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/discover')}
                >
                  立即选择信息源
                  <ChevronRight className="w-5 h-5" />
                </motion.button>
                <p className="text-xs text-muted-foreground mt-3">¥19 / 月 &nbsp;·&nbsp; 随时取消</p>
              </div>
            </motion.div>
          )}

        </div>
      </MobileLayout>
    </>
  );
};

export default HomePage;
