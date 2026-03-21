import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ChevronRight, Bell } from 'lucide-react';
import MobileLayout from '@/components/layout/MobileLayout';
import OnboardingModal from '@/components/onboarding/OnboardingModal';
import { mockUser } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';

const hasPushConfigured = false;
const isSubscribed = mockUser.isVip;

// 飞书日报样例卡片
const FeishuSampleCard = () => (
  <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
    {/* 飞书卡片头部 */}
    <div className="bg-[#1456F0] px-4 py-3 flex items-center gap-2">
      <span className="text-white text-sm font-bold">📅 AI 日报 · 今日</span>
    </div>
    <div className="px-4 py-3 space-y-3 text-left">
      {/* 今日概览 */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">今日概览</p>
        <p className="text-sm text-gray-700 leading-relaxed">
          GPT-5 预览版悄然开放内测，OpenAI 罕见选择「静默上线」；
          a16z 领投 Cursor 估值 $4B，AI 编程赛道单笔最大融资。
        </p>
      </div>
      <div className="border-t border-gray-100" />
      {/* 第一条 */}
      <div>
        <p className="text-xs font-semibold text-[#1456F0] mb-1">🔬 模型动态</p>
        <p className="text-sm font-semibold text-gray-800">OpenAI GPT-5 预览版开始内测</p>
        <p className="text-xs text-gray-500 leading-relaxed mt-0.5">
          没有发布会，没有博客，直接内测邀请。结合近期 API 访问限制动作，
          大版本发布前的准备信号明显。
        </p>
      </div>
      <div className="border-t border-gray-100" />
      {/* 第二条 */}
      <div>
        <p className="text-xs font-semibold text-[#F59E0B] mb-1">💰 投融资</p>
        <p className="text-sm font-semibold text-gray-800">a16z 领投 Cursor $4B 新一轮</p>
        <p className="text-xs text-gray-500 leading-relaxed mt-0.5">
          Thrive 和 DST 同时跟投，这两家通常在 Pre-IPO 才出手，
          信号指向明年上市预期。
        </p>
      </div>
      <div className="border-t border-gray-100" />
      <p className="text-xs text-gray-400">共处理 23 条动态 · 来自 8 个信息源</p>
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
        <div className="pb-8">

          {/* 已订阅状态条 */}
          {isSubscribed && (
            <motion.div
              className="mx-4 mt-4 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-emerald-800">今日日报已发送</p>
                <p className="text-xs text-emerald-600 mt-0.5">08:00 · 已推送至你的邮箱</p>
              </div>
            </motion.div>
          )}

          {/* 已订阅 + 未配置推送 */}
          {isSubscribed && !hasPushConfigured && (
            <motion.div
              className="mx-4 mt-3 p-4 rounded-xl bg-primary/8 border border-primary/20 flex items-center gap-3"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
            >
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

          {/* Banner 1：你能得到什么 */}
          <motion.div
            className="mx-4 mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="rounded-2xl bg-gradient-to-br from-[#0F172A] to-[#1E3A5F] px-5 pt-5 pb-0 overflow-hidden">
              <p className="text-xs font-semibold text-blue-300 tracking-wide uppercase mb-2">每天送到你</p>
              <h2 className="text-xl font-bold text-white leading-snug mb-1">
                硅谷 AI 一手动态
                <br />每天早上 8 点准时到达
              </h2>
              <p className="text-sm text-blue-200/80 mb-4">
                飞书 · 邮件，你选
              </p>
              {/* 飞书卡片样例，向下偏移营造截图感 */}
              <div className="translate-y-2 scale-[0.92] origin-top">
                <FeishuSampleCard />
              </div>
            </div>
          </motion.div>

          {/* Banner 2：三步开始 */}
          <motion.div
            className="mx-4 mt-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="rounded-2xl bg-card border border-border px-5 py-5">
              <p className="text-xs font-semibold text-muted-foreground tracking-wide uppercase mb-4">三步开始使用</p>
              <div className="space-y-4">
                {[
                  { step: '01', icon: '🔍', title: '选择信息源', desc: '从推荐主题包一键订阅，或自己添加 Twitter、RSS、Newsletter' },
                  { step: '02', icon: '🤖', title: 'AI 每天自动处理', desc: '抓取内容、提炼要点、分析趋势，只保留真正有价值的信息' },
                  { step: '03', icon: '📬', title: '日报准时送达', desc: '每天定时推送到飞书或邮件，2分钟读完当天硅谷 AI 动态' },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center shrink-0 text-xl">
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Banner 3：开始使用 CTA */}
          <motion.div
            className="mx-4 mt-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 px-5 py-5">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex -space-x-2">
                  {['🧑‍💻','👩‍🔬','🧑‍💼'].map((e, i) => (
                    <div key={i} className="w-7 h-7 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-sm">{e}</div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">已有 <span className="text-foreground font-semibold">2,400+</span> 人订阅</p>
              </div>
              <h3 className="text-base font-bold text-foreground mt-3 mb-1">从今天开始，不再错过</h3>
              <p className="text-xs text-muted-foreground mb-4">选择你感兴趣的信息源，明天早上就能收到第一份日报</p>
              <motion.button
                className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-1.5"
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/discover')}
              >
                立即选择信息源
                <ChevronRight className="w-4 h-4" />
              </motion.button>
              <p className="text-xs text-muted-foreground text-center mt-2">¥19/月 · 随时取消</p>
            </div>
          </motion.div>

        </div>
      </MobileLayout>
    </>
  );
};

export default HomePage;
