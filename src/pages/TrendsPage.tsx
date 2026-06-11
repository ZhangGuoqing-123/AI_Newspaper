import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, TrendingUp, Flame, RefreshCw, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '@/components/layout/MobileLayout';
import { fetchTopics, TrendTopic } from '@/lib/agentApi';

// 热度紧凑格式：12345 → 1.2w，便于一眼比大小
function fmt(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}w`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

const RANK_COLORS = ['text-amber-500', 'text-orange-400', 'text-rose-400'];

const TopicCard = ({ topic }: { topic: TrendTopic }) => {
  const navigate = useNavigate();
  const rank = topic.rank;

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(rank * 0.03, 0.3) }}
      whileTap={{ scale: 0.99 }}
      onClick={() => navigate('/topic', { state: { topic } })}
      className="w-full flex gap-3 px-4 py-3 text-left rounded-2xl bg-card shadow-card active:bg-secondary/20 transition-colors"
    >
      <div className={`text-lg font-bold tabular-nums w-6 text-center shrink-0 ${RANK_COLORS[rank - 1] ?? 'text-muted-foreground/50'}`}>
        {rank}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground leading-snug">{topic.title}</h3>
        {topic.summary && <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{topic.summary}</p>}
        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 text-primary/80"><Flame className="w-3 h-3" />热度 {fmt(topic.heat)}</span>
          <span>{topic.tweet_count} 条讨论</span>
          <span>{topic.accounts.length} 人参与</span>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 shrink-0 mt-1 text-muted-foreground/60" />
    </motion.button>
  );
};

const TrendsPage = () => {
  const [topics, setTopics] = useState<TrendTopic[]>([]);
  const [window, setWindow] = useState<{ since?: string; until?: string }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    fetchTopics()
      .then((data) => {
        setTopics(data.topics ?? []);
        setWindow(data.window ?? {});
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  return (
    <MobileLayout>
      <div className="flex flex-col min-h-[calc(100vh-5rem)]">
        {/* 头部 */}
        <div className="px-5 pt-6 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">AI 圈热榜</h1>
              <p className="text-xs text-muted-foreground">
                {window.since ? `${window.since} 起的热门讨论话题` : '最近的热门讨论话题'}
              </p>
            </div>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="w-8 h-8 rounded-full bg-secondary/40 flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50"
            aria-label="刷新"
          >
            <RefreshCw className={`w-4 h-4 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-2.5">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>加载热榜中…</span>
            </div>
          )}

          {!loading && error && (
            <div className="py-16 text-center space-y-3">
              <p className="text-sm text-muted-foreground">热榜加载失败：{error}</p>
              <button onClick={load} className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm active:scale-95 transition-transform">
                重试
              </button>
            </div>
          )}

          {!loading && !error && topics.length === 0 && (
            <div className="py-16 text-center space-y-1">
              <p className="text-sm text-muted-foreground">热榜还在生成中</p>
              <p className="text-xs text-muted-foreground/70">后台每 6 小时聚合一次最近的讨论话题，稍后再来看看</p>
            </div>
          )}

          {!loading && !error && topics.map((t) => <TopicCard key={t.rank} topic={t} />)}
        </div>
      </div>
    </MobileLayout>
  );
};

export default TrendsPage;
