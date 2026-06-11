import { motion } from 'framer-motion';
import { ArrowLeft, Flame, Bookmark, ExternalLink, MessageSquareText } from 'lucide-react';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MobileLayout from '@/components/layout/MobileLayout';
import AccountAvatar from '@/components/common/AccountAvatar';
import { TrendTopic, TopicTweet, tweetUrl } from '@/lib/agentApi';
import { tweetFavoriteId, toggleFavorite, useIsFavorited } from '@/lib/favorites';

function fmt(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}w`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

const TweetItem = ({ t }: { t: TopicTweet }) => {
  const favId = tweetFavoriteId(t.account, t.text);
  const favorited = useIsFavorited(favId);
  const url = tweetUrl(t.account, t.tweet_id, t.text);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl p-4 shadow-card"
    >
      <div className="flex gap-3">
        <AccountAvatar account={t.account} size={38} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-foreground truncate">{t.account}</span>
            <span className="text-muted-foreground/60 shrink-0">{t.date}</span>
          </div>
          {/* 点正文跳转原文（新标签页） */}
          <a href={url} target="_blank" rel="noopener noreferrer" className="block">
            {t.text && (
              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap mt-0.5">{t.text}</p>
            )}
            {/* 引用推文/回复：被引用的原文才是真正内容，嵌套引用块展示，避免只剩一句空壳短评论 */}
            {t.quoted && (
              <div className="mt-1.5 border-l-2 border-border pl-2.5 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap line-clamp-6">
                {t.quoted}
              </div>
            )}
          </a>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2.5">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 text-primary/80"><Flame className="w-3 h-3" />{fmt(t.engagement)}</span>
          <span>♥ {fmt(t.likes)}</span>
          <span>↻ {fmt(t.retweets)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary text-foreground text-xs active:scale-95 transition-transform"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>看原文</span>
          </a>
          <button
            onClick={() =>
              toggleFavorite({
                kind: 'tweet', id: favId, account: t.account, date: t.date, text: t.text,
                engagement: t.engagement, likes: t.likes, retweets: t.retweets, savedAt: Date.now(),
              })
            }
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs active:scale-95 transition-transform ${
              favorited ? 'bg-primary/10 text-primary' : 'bg-secondary text-foreground'
            }`}
            aria-label={favorited ? '取消收藏' : '收藏'}
          >
            <Bookmark className={`w-3.5 h-3.5 ${favorited ? 'fill-primary' : ''}`} />
            <span>{favorited ? '已藏' : '收藏'}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const TopicDetailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const topic = (location.state as { topic?: TrendTopic } | null)?.topic;

  // 直接访问 /topic 或刷新丢了 state 时，回榜单（话题是临时快照，不做持久路由）
  useEffect(() => {
    if (!topic) navigate('/trends', { replace: true });
  }, [topic, navigate]);

  if (!topic) return null;

  return (
    <MobileLayout showNav={false}>
      {/* 顶部导航 */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <motion.button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0"
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <h1 className="text-base font-bold text-foreground truncate">话题详情</h1>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {/* 话题头 */}
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <h2 className="text-lg font-bold text-foreground leading-snug">{topic.title}</h2>
          {topic.summary && <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{topic.summary}</p>}
          <div className="flex items-center gap-3 mt-2.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 text-primary/80"><Flame className="w-3 h-3" />热度 {fmt(topic.heat)}</span>
            <span>{topic.tweet_count} 条讨论</span>
            <span>{topic.accounts.length} 人参与</span>
          </div>
          <button
            onClick={() => navigate('/', { state: { ask: `帮我深入分析一下「${topic.title}」这个话题，大家都在讨论什么、有什么值得关注的？` } })}
            className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium active:scale-[0.98] transition-transform"
          >
            <MessageSquareText className="w-4 h-4" />
            和 AI 深聊这个话题
          </button>
        </div>

        {/* 讨论推文 */}
        <p className="text-xs text-muted-foreground px-1 pt-1">代表讨论（{topic.tweets.length} 条）</p>
        {topic.tweets.map((t, i) => (
          <TweetItem key={`${t.account}-${i}`} t={t} />
        ))}
      </div>
      <div className="pb-8" />
    </MobileLayout>
  );
};

export default TopicDetailPage;
