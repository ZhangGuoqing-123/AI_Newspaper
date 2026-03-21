import { motion } from 'framer-motion';
import { ArrowLeft, Bookmark, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '@/components/layout/MobileLayout';
import { mockArticles, getSourceIcon, getSourceName, formatPublishTime } from '@/data/mockData';

// 模拟收藏数据 - 取前3篇文章作为收藏
const mockFavorites = mockArticles.slice(0, 3).map(article => ({
  ...article,
  savedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
}));

const FavoritesPage = () => {
  const navigate = useNavigate();

  return (
    <MobileLayout showNav={false}>
      {/* 顶部导航 */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <motion.button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <h1 className="text-lg font-bold text-foreground">我的收藏</h1>
          <div className="flex-1" />
          <span className="text-sm text-muted-foreground">{mockFavorites.length} 篇</span>
        </div>
      </div>

      {/* 收藏列表 */}
      <div className="px-4 py-4 space-y-3">
        {mockFavorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Bookmark className="w-10 h-10 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">暂无收藏内容</p>
            <p className="text-sm text-muted-foreground mt-1">浏览文章时点击收藏按钮添加</p>
          </div>
        ) : (
          mockFavorites.map((article, index) => (
            <motion.div
              key={article.id}
              className="bg-card rounded-xl p-4 shadow-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => navigate(`/article/${article.id}`)}
            >
              {/* 来源信息 */}
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-secondary rounded-full">
                  <span className="text-xs">{getSourceIcon(article.sourceType || 'website')}</span>
                  <span className="text-xs text-muted-foreground">{getSourceName(article.sourceType || 'website')}</span>
                </div>
                <span className="text-xs text-muted-foreground">{article.authorName}</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  收藏于 {formatPublishTime(article.savedAt)}
                </span>
              </div>

              {/* 标题 */}
              <h3 className="font-bold text-foreground mb-2 line-clamp-2">
                {article.title}
              </h3>

              {/* AI 摘要 */}
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {article.aiSummary?.introduction || article.summary}
              </p>

              {/* 底部操作 */}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-xs text-muted-foreground">{article.readTime} 分钟阅读</span>
                <motion.button
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-destructive/10 text-destructive text-xs"
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    // TODO: 实现取消收藏功能
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>取消收藏</span>
                </motion.button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </MobileLayout>
  );
};

export default FavoritesPage;
