import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Plus, Check, Flame, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '@/components/layout/MobileLayout';
import PullToRefresh from '@/components/common/PullToRefresh';
import ChannelDetailModal from '@/components/discover/ChannelDetailModal';
import { ChannelCardSkeleton } from '@/components/ui/skeleton-card';
import { mockChannels } from '@/data/mockData';
import { Channel } from '@/types';
import { useToast } from '@/hooks/use-toast';

const DiscoverPage = () => {
  const navigate = useNavigate();
  const [channels, setChannels] = useState<Channel[]>(mockChannels);
  const [isLoading, setIsLoading] = useState(false);
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

  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1200));
    setIsLoading(false);
  }, []);

  const filteredChannels = channels.filter(ch =>
    ch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ch.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 按订阅人数排序
  const sortedChannels = [...filteredChannels].sort((a, b) => b.subscriberCount - a.subscriberCount);

  return (
    <MobileLayout>
      <PullToRefresh onRefresh={handleRefresh}>
        {/* 头部 */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-30 safe-area-inset-top">
          <div className="px-4 pt-4 pb-3">
            <h1 className="text-2xl font-bold text-foreground mb-4">发现</h1>
            
            {/* 搜索栏 */}
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="搜索频道、博主..."
            />
          </div>

          {/* 分类 Tab */}
          <CategoryTabs
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
        </div>

        {/* 提示 Banner */}
        <AnimatePresence>
          {showBanner && (
            <motion.div
              className="mx-4 mb-3 p-4 rounded-xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/20 relative overflow-hidden"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0, padding: 0 }}
            >
              {/* 装饰 */}
              <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-primary/10 blur-2xl" />
              
              <div className="flex items-center gap-3 relative">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm text-foreground font-medium">
                  不知道从哪开始？我们为你精选了主题包
                </p>
                <motion.button
                  className="ml-auto w-6 h-6 rounded-full bg-secondary/80 flex items-center justify-center shrink-0"
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowBanner(false)}
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 飙升榜标题 */}
        <div className="px-4 py-3 flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Flame className="w-5 h-5 text-accent" />
            <span className="font-bold text-foreground">热门主题包</span>
          </div>
          <span className="text-sm text-muted-foreground">· 一键订阅全部信息源</span>
        </div>

        {/* 频道列表 */}
        <div className="px-4 pb-4">
          {isLoading ? (
            <>
              {[1, 2, 3, 4, 5].map(i => (
                <ChannelCardSkeleton key={i} />
              ))}
            </>
          ) : (
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
          )}
        </div>
      </PullToRefresh>

      {/* 频道详情弹窗 */}
      <ChannelDetailModal
        channel={selectedChannel}
        isOpen={!!selectedChannel}
        onClose={() => setSelectedChannel(null)}
        onFollowChannel={handleSubscribe}
        onFollowSource={handleFollowSource}
      />
    </MobileLayout>
  );
};

export default DiscoverPage;
