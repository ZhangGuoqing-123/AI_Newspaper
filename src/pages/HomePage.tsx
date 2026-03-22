import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Bell, CheckCircle2, ChevronDown } from 'lucide-react';
import MobileLayout from '@/components/layout/MobileLayout';
import OnboardingModal from '@/components/onboarding/OnboardingModal';
import { mockUser } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';

const hasPushConfigured = false;
const isSubscribed = mockUser.isVip;

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] },
});

// 飞书日报样例
const DigestPreview = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-200">
      {/* 飞书顶栏 */}
      <div className="bg-[#1456F0] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-white text-sm font-semibold">📅 AI 日报 · 今日</span>
        </div>
        <span className="text-white/70 text-xs">08:00 送达</span>
      </div>

      <div className="bg-white px-4 py-4 space-y-3">
        {/* 概览 */}
        <div className="p-3 bg-slate-50 rounded-xl">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">今日概览</p>
          <p className="text-[13px] text-slate-700 leading-relaxed">
            GPT-5 预览版静默上线；Anthropic 代码生成首次超越 GPT-4o；a16z 押注 AI 编程赛道创历史最大单笔。
          </p>
        </div>

        {/* 第一条，默认显示 */}
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-[#1456F0]">🔬 模型动态</span>
          <p className="text-[13px] font-semibold text-slate-800">OpenAI GPT-5 预览版开始内测</p>
          <p className="text-[12px] text-slate-500 leading-relaxed">
            没有发布会、没有博客，直接内测邀请。API 近期悄然限流，通常是大版本发布前的惯例动作。
          </p>
        </div>

        {/* 展开的内容 */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 overflow-hidden"
            >
              <div className="border-t border-slate-100 pt-3 space-y-1">
                <span className="text-[11px] font-bold text-amber-500">💰 投融资</span>
                <p className="text-[13px] font-semibold text-slate-800">a16z 领投 Cursor，估值 $4B</p>
                <p className="text-[12px] text-slate-500 leading-relaxed">
                  Thrive 和 DST 同时跟投——这两家通常只在 Pre-IPO 出手，上市预期信号明显。
                </p>
              </div>
              <div className="border-t border-slate-100 pt-3 space-y-1">
                <span className="text-[11px] font-bold text-emerald-500">🛠 工具与产品</span>
                <p className="text-[13px] font-semibold text-slate-800">Perplexity 上线 Deep Research</p>
                <p className="text-[12px] text-slate-500 leading-relaxed">
                  直接对标 OpenAI 同名产品。信源质量更好，但报告结构比 OpenAI 版本混乱，适合研究用。
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 展开/收起 */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-1 pt-1 text-[12px] text-slate-400 hover:text-slate-600 transition-colors"
        >
          {expanded ? '收起' : '查看更多条目'}
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-3.5 h-3.5" />
          </motion.div>
        </button>

        <div className="border-t border-slate-100 pt-2">
          <p className="text-[11px] text-slate-400 text-center">共处理 23 条动态 · 来自你关注的 8 个信息源</p>
        </div>
      </div>
    </div>
  );
};

const HomePage = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSticky, setShowSticky] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

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
                <p className="text-sm font-medium text-emerald-800">今日日报已发送</p>
                <p className="text-xs text-emerald-600 mt-0.5">08:00 · 已推送至你的邮箱</p>
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

          {/* ── 产品样例 ── */}
          <motion.div {...fadeUp(0.18)} className="px-4 mt-10">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-foreground">这是你每天会收到的</p>
              <span className="text-[11px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">样例</span>
            </div>
            <DigestPreview />
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
