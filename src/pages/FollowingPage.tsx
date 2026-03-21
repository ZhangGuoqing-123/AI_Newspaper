import { useState } from 'react';
import { motion, AnimatePresence, useMotionValue, animate, PanInfo } from 'framer-motion';
import { Plus, Bell, BellOff, Trash2, FolderOpen, User, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '@/components/layout/MobileLayout';
import { mockChannels } from '@/data/mockData';
import { Channel, Source } from '@/types';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

// 可滑动删除的卡片组件
const SwipeableCard = ({ 
  children,
  onDelete 
}: { 
  children: React.ReactNode;
  onDelete: () => void;
}) => {
  const x = useMotionValue(0);
  const [showDelete, setShowDelete] = useState(false);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x < -80) {
      animate(x, -80, { type: 'spring', stiffness: 300, damping: 30 });
      setShowDelete(true);
    } else {
      animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 });
      setShowDelete(false);
    }
  };

  const handleDelete = () => {
    animate(x, -400, { type: 'spring', stiffness: 300, damping: 30 });
    setTimeout(onDelete, 200);
  };

  return (
    <div className="relative overflow-hidden rounded-xl mb-2">
      <motion.div 
        className="absolute right-0 top-0 bottom-0 w-20 bg-destructive flex items-center justify-center rounded-r-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: showDelete ? 1 : 0 }}
      >
        <button onClick={handleDelete} className="p-3">
          <Trash2 className="w-5 h-5 text-destructive-foreground" />
        </button>
      </motion.div>

      <motion.div
        drag="x"
        dragConstraints={{ left: -80, right: 0 }}
        dragElastic={0.1}
        style={{ x }}
        onDragEnd={handleDragEnd}
        className="relative bg-card"
      >
        {children}
      </motion.div>
    </div>
  );
};

const FollowingPage = () => {
  const navigate = useNavigate();
  const [channels, setChannels] = useState<Channel[]>(mockChannels);
  const { toast } = useToast();

  // 已关注的集合
  const subscribedCollections = channels.filter(ch => ch.isSubscribed);
  
  // 已关注的信息源（从所有集合中提取）
  const followedSources: (Source & { collectionName: string })[] = [];
  channels.forEach(ch => {
    ch.sources?.forEach(source => {
      if (source.isFollowed && !followedSources.find(s => s.id === source.id)) {
        followedSources.push({ ...source, collectionName: ch.name });
      }
    });
  });

  // 计算信息源总数（所有关注的集合中的信息源 + 单独关注的信息源）
  const totalSourcesCount = subscribedCollections.reduce((acc, ch) => acc + (ch.sources?.length || 0), 0) + followedSources.length;

  const toggleCollectionPush = (channelId: string) => {
    setChannels(prev =>
      prev.map(ch =>
        ch.id === channelId
          ? { ...ch, pushEnabled: !ch.pushEnabled }
          : ch
      )
    );
  };

  const unsubscribeCollection = (channelId: string) => {
    const channel = channels.find(ch => ch.id === channelId);
    setChannels(prev =>
      prev.map(ch =>
        ch.id === channelId
          ? { ...ch, isSubscribed: false, sources: ch.sources?.map(s => ({ ...s, isFollowed: false })) }
          : ch
      )
    );
    toast({
      title: "已取消关注",
      description: `已取消关注「${channel?.name}」`,
    });
  };

  const unfollowSource = (sourceId: string) => {
    setChannels(prev =>
      prev.map(ch => ({
        ...ch,
        sources: ch.sources?.map(s =>
          s.id === sourceId ? { ...s, isFollowed: false } : s
        )
      }))
    );
    toast({
      title: "已取消关注",
      description: "已取消关注该信息源",
    });
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'twitter': return '𝕏';
      case 'youtube': return '▶️';
      case 'blog': return '📝';
      default: return '🌐';
    }
  };

  return (
    <MobileLayout>
      {/* 头部 */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-30 safe-area-inset-top">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-baseline gap-2">
            <h1 className="text-2xl font-bold text-foreground">我的关注</h1>
            <span className="text-sm text-muted-foreground">{totalSourcesCount} 个信息源</span>
          </div>
        </div>
      </div>

      <div className="px-4 pb-8">
        {/* 推送设置入口 */}
        <motion.button
          onClick={() => navigate('/settings/push')}
          className="w-full flex items-center gap-4 p-4 mb-6 rounded-2xl bg-card border border-border"
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
            <Bell className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 text-left">
            <h3 className="font-semibold text-foreground">推送设置</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              未配置 · 设置后每天自动发送日报
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </motion.button>

        {/* 已关注的信息集合 */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <FolderOpen className="w-4 h-4 text-primary" />
            <span className="font-semibold text-foreground text-sm">信息集合</span>
            <span className="text-xs text-muted-foreground">({subscribedCollections.length})</span>
          </div>

          {subscribedCollections.length === 0 ? (
            <div className="text-center py-8 bg-card rounded-xl">
              <p className="text-sm text-muted-foreground">暂未关注任何集合</p>
              <p className="text-xs text-muted-foreground mt-1">去发现页探索热门集合</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {subscribedCollections.map((channel, index) => (
                <motion.div
                  key={channel.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ delay: index * 0.05 }}
                  layout
                >
                  <SwipeableCard onDelete={() => unsubscribeCollection(channel.id)}>
                    <div className="flex items-center gap-3 p-3">
                      <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-2xl">
                        {channel.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{channel.name}</h3>
                        <p className="text-xs text-muted-foreground truncate">
                          {channel.sources?.length || 0} 个信息源
                        </p>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        {channel.pushEnabled ? (
                          <Bell className="w-4 h-4 text-primary" />
                        ) : (
                          <BellOff className="w-4 h-4 text-muted-foreground" />
                        )}
                        <Switch
                          checked={channel.pushEnabled}
                          onCheckedChange={() => toggleCollectionPush(channel.id)}
                          className="scale-75"
                        />
                      </div>
                    </div>
                  </SwipeableCard>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* 详细信息源 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-accent" />
            <span className="font-semibold text-foreground text-sm">详细信息源</span>
            <span className="text-xs text-muted-foreground">({followedSources.length})</span>
          </div>

          <p className="text-xs text-muted-foreground mb-3">
            左滑取消关注后，将停止为你爬取和推送该信息源的内容
          </p>

          {followedSources.length === 0 ? (
            <div className="text-center py-8 bg-card rounded-xl">
              <p className="text-sm text-muted-foreground">暂无关注的信息源</p>
              <p className="text-xs text-muted-foreground mt-1">在集合详情中可单独关注</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {followedSources.map((source, index) => (
                <motion.div
                  key={source.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ delay: index * 0.05 }}
                  layout
                >
                  <SwipeableCard onDelete={() => unfollowSource(source.id)}>
                    <div className="flex items-center gap-3 p-3">
                      <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center text-xl">
                        {source.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground truncate">{source.name}</span>
                          <span className="text-xs px-1.5 py-0.5 rounded bg-secondary text-muted-foreground shrink-0">
                            {getPlatformIcon(source.platform)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {source.handle}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded-full">
                        {source.collectionName}
                      </span>
                    </div>
                  </SwipeableCard>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </MobileLayout>
  );
};

export default FollowingPage;
