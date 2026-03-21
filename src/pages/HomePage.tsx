import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Bell, CheckCircle2 } from 'lucide-react';
import MobileLayout from '@/components/layout/MobileLayout';
import OnboardingModal from '@/components/onboarding/OnboardingModal';
import { mockUser } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';

const hasPushConfigured = false;
const isSubscribed = mockUser.isVip;

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
});

// 飞书日报样例
const DigestPreview = () => (
  <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10">
    {/* 飞书顶栏 */}
    <div className="bg-[#1456F0] px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 bg-white/20 rounded flex items-center justify-center text-xs">📅</div>
        <span className="text-white text-sm font-semibold">AI 日报 · 今日</span>
      </div>
      <span className="text-white/60 text-xs">08:00</span>
    </div>

    <div className="bg-white px-4 py-4 space-y-4">
      {/* 概览 */}
      <div className="p-3 bg-slate-50 rounded-xl">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">今日概览</p>
        <p className="text-[13px] text-slate-700 leading-relaxed">
          GPT-5 预览版静默上线，Anthropic 在代码生成维度首次超越 GPT-4o，a16z 押注 AI 编程赛道创历史最大单笔。
        </p>
      </div>

      {/* 条目 1 */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-[#1456F0]">🔬 模型动态</span>
        </div>
        <p className="text-[13px] font-semibold text-slate-800">OpenAI GPT-5 预览版开始内测</p>
        <p className="text-[12px] text-slate-500 leading-relaxed">
          没有发布会、没有博客，直接内测邀请。API 访问近期悄然限流，通常是大版本发布前的惯例动作。
        </p>
      </div>

      <div className="border-t border-slate-100" />

      {/* 条目 2 */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-amber-500">💰 投融资</span>
        </div>
        <p className="text-[13px] font-semibold text-slate-800">a16z 领投 Cursor，估值 $4B</p>
        <p className="text-[12px] text-slate-500 leading-relaxed">
          Thrive 和 DST 同时跟投——这两家通常只在 Pre-IPO 出手，上市预期信号明显。
        </p>
      </div>

      <div className="border-t border-slate-100" />
      <p className="text-[11px] text-slate-400 text-center">共处理 23 条动态 · 来自你关注的 8 个信息源</p>
    </div>
  </div>
);

const HomePage = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const seen = localStorage.getItem('hasSeenOnboarding');
    if (!seen) setShowOnboarding(true);
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
      <MobileLayout>
        <div className="pb-10">

          {/* 已订阅状态 */}
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

          {/* ── Banner 1：Hero ── */}
          <motion.div {...fadeUp(0.1)} className="px-4 pt-8 pb-2">
            <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-3">硅谷 AI 情报站</p>
            <h1 className="text-[28px] font-bold text-foreground leading-tight tracking-tight">
              每天早上，重要的<br />都已经在这里了
            </h1>
            <p className="text-base text-muted-foreground mt-3 leading-relaxed">
              不用刷推特，不用追 Newsletter。<br />
              AI 替你读完，精华送到飞书或邮件。
            </p>

            {/* 社交证明 */}
            <div className="flex items-center gap-3 mt-5">
              <div className="flex -space-x-2.5">
                {['👨‍💻', '👩‍🔬', '🧑‍💼', '👨‍🎨'].map((e, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 border-2 border-background flex items-center justify-center text-sm shadow-sm">
                    {e}
                  </div>
                ))}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">2,400+ 人已订阅</p>
                <p className="text-xs text-muted-foreground">产品经理 · 工程师 · 投资人</p>
              </div>
            </div>
          </motion.div>

          {/* ── Banner 2：产品样例 ── */}
          <motion.div {...fadeUp(0.2)} className="px-4 mt-8">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-foreground">这是你每天会收到的</p>
              <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">样例</span>
            </div>
            <DigestPreview />
          </motion.div>

          {/* ── Banner 3：三步流程 ── */}
          <motion.div {...fadeUp(0.3)} className="px-4 mt-8">
            <p className="text-sm font-semibold text-foreground mb-4">三步开始使用</p>
            <div className="relative">
              {/* 连接线 */}
              <div className="absolute left-5 top-10 bottom-10 w-px bg-border" />

              <div className="space-y-0">
                {[
                  {
                    num: '1',
                    title: '选择信息源',
                    desc: '从推荐主题包一键订阅，或自己添加 Twitter 账号、RSS、Newsletter',
                    color: 'bg-blue-50 text-blue-600',
                  },
                  {
                    num: '2',
                    title: 'AI 每天自动提炼',
                    desc: '抓取内容、去掉噪音、提炼关键洞察，只保留真正值得你知道的',
                    color: 'bg-violet-50 text-violet-600',
                  },
                  {
                    num: '3',
                    title: '日报准时送达',
                    desc: '每天你选的时间，推送到飞书或邮件，2 分钟读完当天硅谷 AI 动态',
                    color: 'bg-emerald-50 text-emerald-600',
                  },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 py-4 relative">
                    <div className={`w-10 h-10 rounded-full ${item.color} flex items-center justify-center shrink-0 font-bold text-sm z-10 bg-background border-2 border-border`}>
                      {item.num}
                    </div>
                    <div className="flex-1 pt-1.5">
                      <p className="text-sm font-semibold text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* ── CTA ── */}
          <motion.div {...fadeUp(0.4)} className="px-4 mt-6">
            <motion.button
              className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-primary/25"
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/discover')}
            >
              立即选择信息源
              <ChevronRight className="w-5 h-5" />
            </motion.button>
            <p className="text-xs text-muted-foreground text-center mt-3">
              ¥19 / 月 &nbsp;·&nbsp; 随时取消 &nbsp;·&nbsp; 明天早上就能收到第一份日报
            </p>
          </motion.div>

        </div>
      </MobileLayout>
    </>
  );
};

export default HomePage;
