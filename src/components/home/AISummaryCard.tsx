import { motion } from 'framer-motion';
import { Sparkles, TrendingUp } from 'lucide-react';
import { DailySummary } from '@/types';

interface AISummaryCardProps {
  summary: DailySummary;
}

const AISummaryCard = ({ summary }: AISummaryCardProps) => {
  return (
    <motion.div
      className="mx-4 mb-4 p-5 rounded-2xl relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, hsl(217 91% 60% / 0.15) 0%, hsl(238 84% 67% / 0.08) 50%, hsl(280 80% 60% / 0.05) 100%)',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      {/* 装饰元素 */}
      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-primary/10 blur-2xl" />
      <div className="absolute -left-4 -bottom-4 w-24 h-24 rounded-full bg-accent/10 blur-xl" />
      
      {/* 头部 */}
      <div className="relative flex items-center gap-2 mb-3">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-base text-foreground">今日专属速递</h3>
          <p className="text-xs text-muted-foreground">基于你的关注，AI 为你精选</p>
        </div>
      </div>

      {/* 内容 */}
      <p className="relative text-sm text-foreground/80 leading-relaxed mb-4 font-medium">
        {summary.content}
      </p>

      {/* 统计标签 */}
      <div className="relative flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-xs font-medium text-primary">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{summary.articleCount} 篇文章</span>
        </div>
        <div className="px-3 py-1.5 rounded-full bg-accent/10 text-xs font-medium text-accent">
          来自 {summary.channelCount} 个频道
        </div>
      </div>
    </motion.div>
  );
};

export default AISummaryCard;
