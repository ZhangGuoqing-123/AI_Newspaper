import { motion } from 'framer-motion';
import { ArrowLeft, Bookmark, Trash2, Share2, Flame, Sparkles, Check } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import MobileLayout from '@/components/layout/MobileLayout';
import AccountAvatar from '@/components/common/AccountAvatar';
import { useToast } from '@/hooks/use-toast';
import {
  FavoriteItem,
  useFavorites,
  removeFavorite,
  copyShareCard,
} from '@/lib/favorites';

// 热度紧凑格式：12345 → 1.2w
function fmt(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}w`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins} 分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  return new Date(ts).toLocaleDateString('zh-CN');
}

const FavoriteCard = ({ item }: { item: FavoriteItem }) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await copyShareCard(item);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } else {
      toast({ title: '复制失败', description: '当前环境不支持剪贴板', variant: 'destructive' });
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="bg-card rounded-2xl p-4 shadow-card"
    >
      {/* 顶部：类型标签 + 收藏时间 */}
      <div className="flex items-center gap-2 mb-2">
        {item.kind === 'tweet' ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-xs text-muted-foreground">
            <Flame className="w-3 h-3 text-primary/70" />热门讨论
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-xs text-muted-foreground">
            <Sparkles className="w-3 h-3 text-primary/70" />情报问答
          </span>
        )}
        <span className="text-xs text-muted-foreground ml-auto">
          收藏于 {relativeTime(item.savedAt)}
        </span>
      </div>

      {/* 正文 */}
      {item.kind === 'tweet' ? (
        <>
          <div className="flex gap-3">
            <AccountAvatar account={item.account} size={38} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-foreground truncate">{item.account}</span>
                <span className="text-muted-foreground/70 shrink-0">{item.date}</span>
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap mt-0.5">{item.text}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 text-primary/80">
              <Flame className="w-3 h-3" />热度 {fmt(item.engagement)}
            </span>
            <span>♥ {fmt(item.likes)}</span>
            <span>↻ {fmt(item.retweets)}</span>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm font-semibold text-foreground mb-2 line-clamp-2">
            Q：{item.question}
          </p>
          <div
            className="text-sm text-foreground/90 leading-relaxed prose prose-sm prose-neutral max-w-none line-clamp-6
              prose-headings:text-foreground prose-headings:font-bold prose-headings:text-sm prose-headings:my-1
              prose-p:my-1 prose-strong:text-foreground prose-ul:my-1 prose-li:my-0.5"
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.answer}</ReactMarkdown>
          </div>
        </>
      )}

      {/* 操作栏 */}
      <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-border">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleShare}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-secondary text-foreground text-xs"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Share2 className="w-3.5 h-3.5" />}
          <span>{copied ? '已复制' : '分享'}</span>
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => removeFavorite(item.id)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-destructive/10 text-destructive text-xs"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>取消收藏</span>
        </motion.button>
      </div>
    </motion.div>
  );
};

const FavoritesPage = () => {
  const navigate = useNavigate();
  const favorites = useFavorites();

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
          <span className="text-sm text-muted-foreground">{favorites.length} 条</span>
        </div>
      </div>

      {/* 收藏列表 */}
      <div className="px-4 py-4 space-y-3">
        {favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Bookmark className="w-10 h-10 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">还没有收藏</p>
            <p className="text-sm text-muted-foreground mt-1">
              在「榜单」里收藏热门讨论，或收藏研究助手的回答
            </p>
          </div>
        ) : (
          favorites.map((item) => <FavoriteCard key={item.id} item={item} />)
        )}
      </div>
      <div className="pb-8" />
    </MobileLayout>
  );
};

export default FavoritesPage;
