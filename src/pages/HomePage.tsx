import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import MobileLayout from '@/components/layout/MobileLayout';
import DateSelector from '@/components/home/DateSelector';
import AISummaryCard from '@/components/home/AISummaryCard';
import ArticleCard from '@/components/home/ArticleCard';
import OnboardingModal from '@/components/onboarding/OnboardingModal';
import PullToRefresh from '@/components/common/PullToRefresh';
import { ArticleCardSkeleton, AISummarySkeleton } from '@/components/ui/skeleton-card';
import { mockArticles, mockDailySummary, getGreeting, mockUser } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';

const HomePage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { toast } = useToast();
  const greeting = getGreeting();

  // 模拟初始加载
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);
    
    return () => clearTimeout(timer);
  }, []);

  // 下拉刷新处理
  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    // 模拟网络请求
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    toast({
      title: "刷新成功",
      description: "已获取最新内容",
    });
  }, [toast]);

  // 完成引导
  const handleOnboardingComplete = (selectedChannels: string[]) => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setShowOnboarding(false);
    if (selectedChannels.length > 0) {
      toast({
        title: "设置成功",
        description: `已关注 ${selectedChannels.length} 个频道`,
      });
    }
  };

  return (
    <>
      <OnboardingModal 
        isOpen={showOnboarding}
        onComplete={handleOnboardingComplete}
      />
      
      <MobileLayout>
        <PullToRefresh onRefresh={handleRefresh}>
          {/* 顶部问候语 */}
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
                    今日有 {mockDailySummary.articleCount} 条新消息
                  </p>
                </div>
                {/* 品牌 Logo */}
                <motion.div 
                  className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg"
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="text-xl">⚡</span>
                </motion.div>
              </div>
            </div>

            {/* 日期选择器 */}
            <DateSelector 
              selectedDate={selectedDate} 
              onDateChange={setSelectedDate} 
            />
          </motion.header>

          {/* 内容区域 */}
          {isLoading ? (
            <>
              <AISummarySkeleton />
              {[1, 2, 3].map(i => (
                <ArticleCardSkeleton key={i} />
              ))}
            </>
          ) : (
            <>
              {/* AI 摘要卡片 */}
              <AISummaryCard summary={mockDailySummary} />

              {/* 文章列表 */}
              <div className="pb-4">
                {mockArticles.map((article, index) => (
                  <ArticleCard 
                    key={article.id} 
                    article={article} 
                    index={index}
                  />
                ))}
              </div>
            </>
          )}
        </PullToRefresh>
      </MobileLayout>
    </>
  );
};

export default HomePage;
