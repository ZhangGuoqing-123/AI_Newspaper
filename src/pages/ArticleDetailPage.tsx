import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  ExternalLink, 
  Bookmark, 
  Share2, 
  Lightbulb,
  List,
  MessageSquareQuote,
  FileText,
  BookOpen,
  Languages
} from 'lucide-react';
import { mockArticles, getSourceIcon, getSourceName, formatPublishTime } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import ChapterSection from '@/components/article/ChapterSection';

// 原文内容组件（支持中英文切换）
const OriginalContentSection = ({ 
  article, 
  onOpenOriginal 
}: { 
  article: typeof mockArticles[0]; 
  onOpenOriginal: () => void;
}) => {
  const [showChinese, setShowChinese] = useState(true);

  // 生成中文翻译版本（实际项目中应从后端获取）
  const getChineseContent = (originalContent: string) => {
    // 这里是模拟翻译，实际应该从数据中获取
    const translations: Record<string, string> = {
      'Sam Altman (@sama) · 2h': 'Sam Altman (@sama) · 2小时前',
      'Big news: GPT-5 preview is coming soon.': '重大新闻：GPT-5 预览版即将发布。',
      "We've achieved a 50% improvement in complex reasoning tasks.": '我们在复杂推理任务上实现了 50% 的性能提升。',
      'The new model also features a 256K context window and enhanced multimodal capabilities.': '新模型还具有 256K 上下文窗口和增强的多模态能力。',
      "This is our biggest leap since GPT-4. Can't wait for you all to try it.": '这是自 GPT-4 以来我们最大的飞跃。迫不及待想让大家体验。',
      '🧵 More details in thread...': '🧵 更多细节请看主题帖...',
      'Anthropic Research Blog: Introducing Claude 3.5': 'Anthropic 研究博客：Claude 3.5 发布',
      "We're excited to announce Claude 3.5, our most capable model yet.": '我们很高兴地宣布 Claude 3.5，这是我们迄今为止最强大的模型。',
      'Key Highlights:': '主要亮点：',
      '**Coding Excellence**': '**编程卓越**',
      'Claude 3.5 achieves 92.1% on HumanEval, our best result ever and a new state-of-the-art for publicly available models.': 'Claude 3.5 在 HumanEval 上达到 92.1%，这是我们有史以来最好的成绩，也是公开可用模型的最新最优水平。',
      'Real-world testing shows developers complete tasks 35% faster when using Claude 3.5.': '实际测试表明，开发者使用 Claude 3.5 完成任务的速度提高了 35%。',
      '**Enhanced Reasoning**': '**增强推理**',
      'On the MATH benchmark, Claude 3.5 scores 78.2%, a 15 percentage point improvement over Claude 3.': '在 MATH 基准测试中，Claude 3.5 得分 78.2%，比 Claude 3 提高了 15 个百分点。',
      'Complex multi-step problems that previously stumped AI assistants are now solvable.': '以前让 AI 助手束手无策的复杂多步骤问题现在都能解决了。',
      '**Constitutional AI 2.0**': '**宪法 AI 2.0**',
      "We've significantly improved our safety framework.": '我们大幅改进了安全框架。',
      'Claude 3.5 is better at recognizing and refusing harmful': 'Claude 3.5 在识别和拒绝有害内容方面表现更出色',
    };

    let result = originalContent;
    Object.entries(translations).forEach(([en, zh]) => {
      result = result.replace(en, zh);
    });
    return result;
  };

  const displayContent = showChinese && article.originalContent 
    ? getChineseContent(article.originalContent) 
    : article.originalContent;

  return (
    <motion.div 
      className="px-4 py-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      {/* 原文标题 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
            <span className="text-base">{getSourceIcon(article.sourceType || 'website')}</span>
          </div>
          <span className="font-bold text-foreground">原文内容</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenOriginal}
          className="gap-1.5"
        >
          <ExternalLink className="w-4 h-4" />
          查看原文
        </Button>
      </div>

      {/* 语言切换 */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => setShowChinese(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            showChinese 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
          }`}
        >
          <Languages className="w-3.5 h-3.5" />
          中文翻译
        </button>
        <button
          onClick={() => setShowChinese(false)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            !showChinese 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
          }`}
        >
          原文
        </button>
      </div>

      {/* 原文内容 */}
      {displayContent && (
        <div className="bg-secondary/50 rounded-xl p-4">
          <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">
            {displayContent}
          </pre>
        </div>
      )}
    </motion.div>
  );
};

const ArticleDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const article = mockArticles.find(a => a.id === id);

  if (!article) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">文章不存在</p>
      </div>
    );
  }

  const handleSave = () => {
    toast({ title: "已收藏", description: "可在「我的」页面查看" });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: article.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "链接已复制", description: "可以分享给好友" });
    }
  };

  const handleOpenOriginal = () => {
    window.open(article.sourceUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-background max-w-[430px] mx-auto">
      {/* 顶部导航栏 */}
      <motion.header 
        className="sticky top-0 bg-background/95 backdrop-blur-sm z-50 border-b border-border safe-area-inset-top"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between px-4 h-14">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleSave}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-secondary transition-colors"
            >
              <Bookmark className="w-5 h-5" />
            </button>
            <button 
              onClick={handleShare}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-secondary transition-colors"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.header>

      {/* 文章内容 */}
      <div className="pb-8">
        {/* 头部信息 */}
        <motion.div 
          className="px-4 pt-4 pb-5 border-b border-border"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* 来源标签 */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 rounded-full">
              <span className="text-sm">{getSourceIcon(article.sourceType || 'website')}</span>
              <span className="text-xs font-medium text-primary">
                {getSourceName(article.sourceType || 'website')}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {formatPublishTime(article.publishedAt)}
            </span>
          </div>

          {/* 标题 */}
          <h1 className="text-xl font-bold text-foreground leading-tight mb-3">
            {article.title}
          </h1>

          {/* 作者信息 */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-lg">
              {article.channelIcon}
            </div>
            <div>
              <p className="font-medium text-foreground text-sm">{article.authorName}</p>
              <p className="text-xs text-muted-foreground">{article.authorHandle}</p>
            </div>
          </div>
        </motion.div>

        {/* AI 总结部分 */}
        {article.aiSummary && (
          <motion.div 
            className="px-4 py-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {/* AI 总结标题 */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Lightbulb className="w-4 h-4 text-primary" />
              </div>
              <span className="font-bold text-foreground">AI 智能总结</span>
            </div>

            {/* 引言 */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">引言</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed pl-6">
                {article.aiSummary.introduction}
              </p>
            </div>

            {/* 核心内容提炼 - 支持两种格式 */}
            {article.aiSummary.chapters ? (
              // 长内容：章节结构
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-semibold text-foreground">核心内容提炼</span>
                  <span className="text-xs text-muted-foreground">
                    ({article.aiSummary.chapters.length} 个章节)
                  </span>
                </div>
                <div className="space-y-3">
                  {article.aiSummary.chapters.map((chapter, index) => (
                    <ChapterSection
                      key={index}
                      chapter={chapter}
                      index={index}
                      defaultExpanded={index === 0}
                    />
                  ))}
                </div>
              </div>
            ) : article.aiSummary.corePoints && article.aiSummary.corePoints.length > 0 ? (
              // 短内容：简单列表
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <List className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-semibold text-foreground">核心内容提炼</span>
                </div>
                <div className="space-y-2 pl-6">
                  {article.aiSummary.corePoints.map((point, index) => (
                    <motion.div 
                      key={index}
                      className="flex items-start gap-2"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + index * 0.05 }}
                    >
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <p className="text-sm text-foreground leading-relaxed">{point}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* 独家批注 */}
            <div className="p-4 bg-accent/10 rounded-xl border border-accent/20">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquareQuote className="w-4 h-4 text-accent" />
                <span className="text-sm font-semibold text-accent">独家批注</span>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {article.aiSummary.exclusiveComment}
              </p>
            </div>
          </motion.div>
        )}

        {/* 分割线 */}
        <div className="h-2 bg-secondary" />

        {/* 原文部分 */}
        <OriginalContentSection 
          article={article} 
          onOpenOriginal={handleOpenOriginal} 
        />
      </div>
    </div>
  );
};

export default ArticleDetailPage;
