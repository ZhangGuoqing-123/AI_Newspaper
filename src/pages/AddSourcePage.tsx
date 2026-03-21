import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Link2, Tag, FolderPlus, Check, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '@/components/layout/MobileLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { mockChannels } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';

const platformOptions = [
  { id: 'twitter', name: 'Twitter / X', icon: '𝕏', placeholder: 'https://x.com/username' },
  { id: 'blog', name: 'Blog / RSS', icon: '📝', placeholder: 'https://example.com/rss' },
  { id: 'newsletter', name: 'Newsletter', icon: '📬', placeholder: 'https://substack.com/@author' },
  { id: 'hackernews', name: 'Hacker News', icon: '🟠', placeholder: 'https://news.ycombinator.com' },
];

const AddSourcePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [showCollectionPicker, setShowCollectionPicker] = useState(false);

  const collections = mockChannels.filter(ch => ch.isSubscribed);

  const handleSubmit = () => {
    if (!sourceUrl.trim() || !sourceName.trim()) {
      toast({
        title: "请填写完整信息",
        description: "信息源名称和链接地址不能为空",
        variant: "destructive",
      });
      return;
    }

    // URL 验证
    const urlPattern = /^(https?:\/\/|[\u4e00-\u9fa5])/;
    if (!urlPattern.test(sourceUrl.trim())) {
      toast({
        title: "链接格式不正确",
        description: "请输入有效的链接地址",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "提交成功",
      description: "已添加至审核队列，通过后将自动同步内容",
    });
    navigate(-1);
  };

  const selectedCollectionData = collections.find(c => c.id === selectedCollection);

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
          <h1 className="text-lg font-bold text-foreground">添加信息源</h1>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* 平台选择 */}
        <div>
          <label className="text-sm font-medium text-foreground flex items-center gap-2 mb-3">
            <Tag className="w-4 h-4 text-primary" />
            选择平台类型
          </label>
          <div className="grid grid-cols-2 gap-2">
            {platformOptions.map((platform) => (
              <motion.button
                key={platform.id}
                onClick={() => setSelectedPlatform(platform.id)}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                  selectedPlatform === platform.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card'
                }`}
                whileTap={{ scale: 0.98 }}
              >
                <span className="text-xl">{platform.icon}</span>
                <span className={`text-sm font-medium flex-1 text-left ${
                  selectedPlatform === platform.id ? 'text-primary' : 'text-foreground'
                }`}>
                  {platform.name}
                </span>
                {selectedPlatform === platform.id && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* 链接输入 */}
        <div>
          <label className="text-sm font-medium text-foreground flex items-center gap-2 mb-3">
            <Link2 className="w-4 h-4 text-primary" />
            链接地址
          </label>
          <Input
            placeholder={
              selectedPlatform 
                ? platformOptions.find(p => p.id === selectedPlatform)?.placeholder 
                : "输入信息源链接..."
            }
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            className="h-12"
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground mt-2">
            支持 Twitter 主页、Blog/RSS 地址、Substack Newsletter、Hacker News
          </p>
        </div>

        {/* 名称输入 */}
        <div>
          <label className="text-sm font-medium text-foreground mb-3 block">
            信息源名称
          </label>
          <Input
            placeholder="给这个信息源起个名字..."
            value={sourceName}
            onChange={(e) => setSourceName(e.target.value)}
            className="h-12"
            maxLength={50}
          />
        </div>

        {/* 加入集合 */}
        <div>
          <label className="text-sm font-medium text-foreground flex items-center gap-2 mb-3">
            <FolderPlus className="w-4 h-4 text-primary" />
            加入信息集合（可选）
          </label>
          
          <motion.button
            onClick={() => setShowCollectionPicker(!showCollectionPicker)}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-border bg-card"
            whileTap={{ scale: 0.98 }}
          >
            {selectedCollectionData ? (
              <div className="flex items-center gap-2">
                <span className="text-xl">{selectedCollectionData.icon}</span>
                <span className="font-medium text-foreground">{selectedCollectionData.name}</span>
              </div>
            ) : (
              <span className="text-muted-foreground">选择一个集合...</span>
            )}
            <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${
              showCollectionPicker ? 'rotate-180' : ''
            }`} />
          </motion.button>

          {/* 集合列表 */}
          {showCollectionPicker && (
            <motion.div
              className="mt-2 rounded-xl border border-border bg-card overflow-hidden"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
            >
              {/* 不加入任何集合选项 */}
              <button
                onClick={() => {
                  setSelectedCollection(null);
                  setShowCollectionPicker(false);
                }}
                className={`w-full flex items-center gap-3 p-3 border-b border-border hover:bg-secondary/50 transition-colors ${
                  !selectedCollection ? 'bg-primary/5' : ''
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                  <span className="text-muted-foreground">—</span>
                </div>
                <span className="text-sm text-muted-foreground">不加入任何集合</span>
                {!selectedCollection && <Check className="w-4 h-4 text-primary ml-auto" />}
              </button>

              {collections.map((collection) => (
                <button
                  key={collection.id}
                  onClick={() => {
                    setSelectedCollection(collection.id);
                    setShowCollectionPicker(false);
                  }}
                  className={`w-full flex items-center gap-3 p-3 border-b border-border last:border-b-0 hover:bg-secondary/50 transition-colors ${
                    selectedCollection === collection.id ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-lg">
                    {collection.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-foreground">{collection.name}</p>
                    <p className="text-xs text-muted-foreground">{collection.sources?.length || 0} 个信息源</p>
                  </div>
                  {selectedCollection === collection.id && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </button>
              ))}

              {collections.length === 0 && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  暂无已关注的集合
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* 提交按钮 */}
        <div className="pt-4">
          <Button 
            onClick={handleSubmit}
            className="w-full h-12 text-base font-medium"
            disabled={!sourceUrl.trim() || !sourceName.trim()}
          >
            提交审核
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-3">
            提交后需人工审核，通过后会自动开始同步内容
          </p>
        </div>
      </div>
    </MobileLayout>
  );
};

export default AddSourcePage;
