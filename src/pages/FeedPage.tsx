import { useState } from 'react';
import { motion } from 'framer-motion';
import MobileLayout from '@/components/layout/MobileLayout';
import DiscoverContent from '@/components/feed/DiscoverContent';
import FollowingContent from '@/components/feed/FollowingContent';

type FeedTab = '关注' | '发现';

interface FeedPageProps {
  defaultTab?: FeedTab;
}

// 关注 / 发现 合并页：顶部 Tab 切换，底部导航只占一个位置
const FeedPage = ({ defaultTab = '发现' }: FeedPageProps) => {
  const [tab, setTab] = useState<FeedTab>(defaultTab);

  return (
    <MobileLayout>
      {/* 顶部 Tab 切换 */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-30 safe-area-inset-top border-b border-border/50">
        <div className="flex items-center justify-center gap-2 px-4 pt-4 pb-3">
          {(['关注', '发现'] as FeedTab[]).map((t) => {
            const isActive = t === tab;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="relative px-6 py-2 rounded-full text-sm font-semibold whitespace-nowrap touch-feedback"
              >
                {isActive && (
                  <motion.div
                    layoutId="feedTabBg"
                    className="absolute inset-0 bg-primary rounded-full"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className={`relative z-10 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                  {t}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 内容区 */}
      {tab === '发现' ? <DiscoverContent /> : <FollowingContent />}
    </MobileLayout>
  );
};

export default FeedPage;
