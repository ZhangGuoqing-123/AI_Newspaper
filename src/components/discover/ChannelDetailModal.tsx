import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Plus, Users, ExternalLink } from 'lucide-react';
import { Channel, Source } from '@/types';

interface ChannelDetailModalProps {
  channel: Channel | null;
  isOpen: boolean;
  onClose: () => void;
  onFollowChannel: (channelId: string) => void;
  onFollowSource: (sourceId: string) => void;
}

const getPlatformIcon = (platform: Source['platform']) => {
  switch (platform) {
    case 'twitter': return '𝕏';
    case 'youtube': return '▶️';
    case 'blog': return '📝';
    case 'hackernews': return '🟠';
    case 'newsletter': return '📬';
    default: return '🌐';
  }
};

const getPlatformName = (platform: Source['platform']) => {
  switch (platform) {
    case 'twitter': return 'Twitter';
    case 'youtube': return 'YouTube';
    case 'blog': return 'Blog';
    case 'hackernews': return 'HN';
    case 'newsletter': return 'Newsletter';
    default: return 'Website';
  }
};

const formatFollowers = (count: number) => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
};

const ChannelDetailModal = ({
  channel,
  isOpen,
  onClose,
  onFollowChannel,
  onFollowSource,
}: ChannelDetailModalProps) => {
  if (!channel) return null;

  const sources = channel.sources || [];
  const followedCount = sources.filter(s => s.isFollowed).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* 弹窗内容 */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 max-w-[430px] mx-auto"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="bg-background rounded-t-3xl max-h-[85vh] overflow-hidden flex flex-col">
              {/* 拖动指示条 */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </div>

              {/* 头部 */}
              <div className="px-5 pb-4 border-b border-border">
                <div className="flex items-start gap-4">
                  {/* 图标 */}
                  <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center text-3xl shadow-sm">
                    {channel.icon}
                  </div>

                  {/* 信息 */}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold text-foreground">{channel.name}</h2>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {channel.description}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {(channel.subscriberCount / 1000).toFixed(1)}k 订阅
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {sources.length} 个信息源
                      </span>
                    </div>
                  </div>

                  {/* 关闭按钮 */}
                  <motion.button
                    className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </motion.button>
                </div>

                {/* 一键关注全部按钮 */}
                <motion.button
                  className={`w-full mt-4 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                    channel.isSubscribed
                      ? 'bg-secondary text-muted-foreground'
                      : 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                  }`}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onFollowChannel(channel.id)}
                >
                  {channel.isSubscribed ? (
                    <>
                      <Check className="w-4 h-4" />
                      已关注全部 ({sources.length} 个信息源)
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      一键关注全部 ({sources.length} 个信息源)
                    </>
                  )}
                </motion.button>
              </div>

              {/* 信息源列表 */}
              <div className="flex-1 overflow-y-auto px-5 py-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-foreground">包含的信息源</h3>
                  <span className="text-xs text-muted-foreground">
                    已关注 {followedCount}/{sources.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {sources.map((source, index) => (
                    <motion.div
                      key={source.id}
                      className="flex items-center gap-3 p-3 bg-card rounded-xl"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      {/* 头像 */}
                      <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center text-xl">
                        {source.avatar}
                      </div>

                      {/* 信息 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground truncate">
                            {source.name}
                          </span>
                          <span className="text-xs px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                            {getPlatformIcon(source.platform)} {getPlatformName(source.platform)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground truncate">
                            {source.handle}
                          </span>
                          {source.followerCount > 0 && (
                            <span className="text-xs text-muted-foreground">
                              · {formatFollowers(source.followerCount)} 粉丝
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 关注按钮 */}
                      <motion.button
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          source.isFollowed
                            ? 'bg-secondary text-muted-foreground'
                            : 'bg-primary/10 text-primary'
                        }`}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onFollowSource(source.id);
                        }}
                      >
                        {source.isFollowed ? (
                          <>
                            <Check className="w-3 h-3" />
                            已关注
                          </>
                        ) : (
                          <>
                            <Plus className="w-3 h-3" />
                            关注
                          </>
                        )}
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* 底部安全区域 */}
              <div className="h-8 bg-background" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ChannelDetailModal;
