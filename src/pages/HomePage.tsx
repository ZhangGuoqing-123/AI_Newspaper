import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronRight, Lock } from 'lucide-react';
import MobileLayout from '@/components/layout/MobileLayout';
import DateSelector from '@/components/home/DateSelector';
import AISummaryCard from '@/components/home/AISummaryCard';
import ArticleCard from '@/components/home/ArticleCard';
import OnboardingModal from '@/components/onboarding/OnboardingModal';
import PullToRefresh from '@/components/common/PullToRefresh';
import { ArticleCardSkeleton, AISummarySkeleton } from '@/components/ui/skeleton-card';
import { mockArticles, mockDailySummary, getGreeting, mockUser } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';

// 模拟：是否已配置推送（实际接后端判断）
const hasPushConfigured = false;
// 模拟：是否已付费订阅
const isSubscribed = mockUser.isVip;

const HomePage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const greeting = getGreeting();

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    toast({ title: '刷新成功', description: '已获取最新内容' });
  }, [toast]);

  const handleOnboardingComplete = (selectedChannels: string[]) => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setShowOnboarding(false);
    if (selectedChannels.length > 0) {
      toast({ title: '设置成功', description: `已关注 ${selectedChannels.length} 个主题包` });
    }
  };

  // 已订阅：前两条完整展示，后面的模糊锁定
  const visibleArticles = isSubscribed ? mockArticles : mockArticles.slice(0, 2);
  const lockedArticles = isSubscribed ? [] : mockArticles.slice(2);

  return (
    <>
      <OnboardingModal isOpen={showOnboarding} onComplete={handleOnboardingComplete} />

      <MobileLayout>
        <PullToRefresh onRefresh={handleRefresh}>
          {/* 顶部 */}
          <motion.header
            className="sticky top-0 bg-background/95 backdrop-blur-sm z-30 safe-area-inset-top"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="px-4 pt-4 pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    {greeting}，{mockUser.nickname}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {isSubscribed
                      ? `今日有 ${mockDailySummary.articleCount} 条新消息`
                      : '以下为今日样例内容'}
                  </p>
                </div>
                <motion.div
                  className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg"
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="text-xl">⚡</span>
                </motion.div>
              </div>
            </div>
            <DateSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />
          </motion.header>

          {/* 已订阅 + 未配置推送：提示配置推送 */}
          <AnimatePresence>
            {isSubscribed && !hasPushConfigured && (
              <motion.div
                className="mx-4 mt-3 p-4 rounded-xl bg-primary/8 border border-primary/20 flex items-center gap-3"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, margin: 0, padding: 0 }}
              >
                <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                  <Bell className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
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
          </AnimatePresence>

          {/* 内容区域 */}
          {isLoading ? (
            <>
              <AISummarySkeleton />
              {[1, 2, 3].map(i => <ArticleCardSkeleton key={i} />)}
            </>
          ) : (
            <>
              <AISummaryCard summary={mockDailySummary} />

              <div className="pb-4">
                {/* 正常展示的文章 */}
                {visibleArticles.map((article, index) => (
                  <ArticleCard key={article.id} article={article} index={index} />
                ))}

                {/* 未订阅：锁定内容 + 转化 CTA */}
                {lockedArticles.length > 0 && (
                  <div className="relative">
                    {/* 模糊遮罩层 */}
                    <div className="pointer-events-none select-none opacity-30 blur-[2px]">
                      {lockedArticles.slice(0, 2).map((article, index) => (
                        <ArticleCard key={article.id} article={article} index={index + 2} />
                      ))}
                    </div>

                    {/* 锁定 CTA */}
                    <motion.div
                      className="absolute inset-0 flex flex-col items-center justify-center px-6"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="w-full bg-card/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-border text-center">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                          <Lock className="w-5 h-5 text-primary" />
                        </div>
                        <h3 className="font-bold text-foreground text-base mb-1">
                          还有 {lockedArticles.length} 条今日动态
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          订阅后每天自动推送到邮箱或飞书，不错过任何一手信息
                        </p>
                        <motion.button
                          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-1.5"
                          whileTap={{ scale: 0.98 }}
                          onClick={() => navigate('/profile')}
                        >
                          立即订阅
                          <ChevronRight className="w-4 h-4" />
                        </motion.button>
                        <p className="text-xs text-muted-foreground mt-2">¥19/月 · 随时取消</p>
                      </div>
                    </motion.div>
                  </div>
                )}
              </div>
            </>
          )}
        </PullToRefresh>
      </MobileLayout>
    </>
  );
};

export default HomePage;
