import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Plus, Check, Flame, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ChannelDetailModal from '@/components/discover/ChannelDetailModal';
import { mockChannels } from '@/data/mockData';
import { Channel } from '@/types';
import { useToast } from '@/hooks/use-toast';

// 「发现」Tab 的内容（不含 MobileLayout / 页面标题，由 FeedPage 统一承载）
const DiscoverContent = () => {
  const navigate = useNavigate();
  const [channels, setChannels] = useState<Channel[]>(mockChannels);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const { toast } = useToast();

  const handleSubscribe = (channelId: string) => {
    setChannels(prev =>
      prev.map(ch =>
        ch.id === channelId
          ? {
              ...ch,
              isSubscribed: !ch.isSubscribed,
              // 关注频道时，将所有源也设为已关注
              sources: ch.sources?.map(s => ({ ...s, isFollowed: !ch.isSubscribed }))
            }
          : ch
      )
    );

    const channel = channels.find(ch => ch.id === channelId);
    if (channel && !channel.isSubscribed) {
      toast({
        title: "已关注",
        description: `你已成功关注「${channel.name}」的全部 ${channel.sources?.length || 0} 个信息源`,
      });
    }

    // 同步更新 selectedChannel
    if (selectedChannel && selectedChannel.id === channelId) {
      const updatedChannel = channels.find(ch => ch.id === channelId);
      if (updatedChannel) {
        setSelectedChannel({
          ...updatedChannel,
          isSubscribed: !updatedChannel.isSubscribed,
          sources: updatedChannel.sources?.map(s => ({ ...s, isFollowed: !updatedChannel.isSubscribed }))
        });
      }
    }
  };

  const handleFollowSource = (sourceId: string) => {
    setChannels(prev =>
      prev.map(ch => ({
        ...ch,
        sources: ch.sources?.map(s =>
          s.id === sourceId ? { ...s, isFollowed: !s.isFollowed } : s
        )
      }))
    );

    // 同步更新 selectedChannel
    if (selectedChannel) {
      setSelectedChannel({
        ...selectedChannel,
        sources: selectedChannel.sources?.map(s =>
          s.id === sourceId ? { ...s, isFollowed: !s.isFollowed } : s
        )
      });
    }
  };

  const handleChannelClick = (channel: Channel) => {
    setSelectedChannel(channel);
  };

  // 按订阅人数排序
  const sortedChannels = [...channels].sort((a, b) => b.subscriberCount - a.subscriberCount);

  return (
    <>
      {/* 添加信息源入口 */}
      <div className="px-4 pt-3">
        <motion.button
          onClick={() => navigate('/add-source')}
          className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 border border-primary/20"
          whileTap={{ scale: 0.98 }}
        >
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
            <Plus className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 text-left">
            <h3 className="font-semibold text-foreground text-sm">添加自定义信息源</h3>
            <p className="text-xs text-muted-foreground mt-0.5">粘贴链接，自动识别平台类型</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </motion.button>
      </div>

      {/* 主题包标题 */}
      <div className="px-4 py-3 flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <Flame className="w-5 h-5 text-accent" />
          <span className="font-bold text-foreground">热门主题包</span>
        </div>
        <span className="text-sm text-muted-foreground">· 一键订阅全部信息源</span>
      </div>

      {/* 频道列表 */}
      <div className="px-4 pb-4">
        <AnimatePresence>
          {sortedChannels.map((channel, index) => (
            <motion.div
              key={channel.id}
              className="flex items-center gap-3 p-3 bg-card rounded-xl mb-2 shadow-sm cursor-pointer"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
              layout
              onClick={() => handleChannelClick(channel)}
            >
              {/* 排名 */}
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white' :
                index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white' :
                index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white' :
                'bg-secondary text-muted-foreground'
              }`}>
                {index + 1}
              </div>

              {/* 图标 */}
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-2xl shadow-sm">
                {channel.icon}
              </div>

              {/* 信息 */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">{channel.name}</h3>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{channel.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {(channel.subscriberCount / 1000).toFixed(1)}k 订阅
                  </span>
                  {index < 3 && (
                    <span className="text-xs text-accent flex items-center gap-0.5">
                      <TrendingUp className="w-3 h-3" />
                      热门
                    </span>
                  )}
                </div>
              </div>

              {/* 关注按钮 */}
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSubscribe(channel.id);
                }}
                className={`flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  channel.isSubscribed
                    ? 'bg-secondary text-muted-foreground'
                    : 'bg-primary text-primary-foreground shadow-md shadow-primary/30'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                {channel.isSubscribed ? (
                  <>
                    <Check className="w-4 h-4" />
                    已关注
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    关注
                  </>
                )}
              </motion.button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 频道详情弹窗 */}
      <ChannelDetailModal
        channel={selectedChannel}
        isOpen={!!selectedChannel}
        onClose={() => setSelectedChannel(null)}
        onFollowChannel={handleSubscribe}
        onFollowSource={handleFollowSource}
      />
    </>
  );
};

export default DiscoverContent;
