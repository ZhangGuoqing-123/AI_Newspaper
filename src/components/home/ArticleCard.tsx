import { motion } from 'framer-motion';
import { Clock, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Article } from '@/types';
import { formatPublishTime, getSourceIcon, getSourceName } from '@/data/mockData';

interface ArticleCardProps {
  article: Article;
  index: number;
}

const ArticleCard = ({ article, index }: ArticleCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/article/${article.id}`);
  };

  return (
    <motion.article
      className="mx-4 mb-3 p-4 bg-card rounded-2xl shadow-card cursor-pointer active:scale-[0.98] transition-transform"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.05 }}
      onClick={handleClick}
    >
      {/* 来源信息 */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {/* 来源平台 */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-secondary rounded-full">
          <span className="text-sm">{getSourceIcon(article.sourceType || 'website')}</span>
          <span className="text-xs font-medium text-muted-foreground">
            {getSourceName(article.sourceType || 'website')}
          </span>
        </div>
        
        {/* 博主信息 */}
        <span className="text-xs font-medium text-foreground">{article.authorName}</span>
        <span className="text-xs text-muted-foreground">{article.authorHandle}</span>

        {/* 时间 */}
        <span className="text-xs text-muted-foreground ml-auto">
          {formatPublishTime(article.publishedAt)}
        </span>
      </div>

      {/* 标题 */}
      <h2 className="text-base font-bold text-foreground mb-2 line-clamp-2 leading-snug">
        {article.title}
      </h2>

      {/* 摘要 */}
      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-3">
        {article.summary}
      </p>

      {/* 底部信息 */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        {/* 阅读时间 */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <span>{article.readTime} 分钟阅读</span>
        </div>
        
        {/* 查看详情 */}
        <div className="flex items-center gap-0.5 text-xs text-primary font-medium">
          <span>阅读详情</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </motion.article>
  );
};

export default ArticleCard;
