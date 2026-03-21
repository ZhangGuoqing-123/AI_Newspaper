 import { motion } from 'framer-motion';
 import { useState } from 'react';
 import { 
   ArrowLeft, 
   Info, 
   FileText, 
   Shield, 
   Mail, 
   MessageCircle, 
   ChevronRight,
   Sparkles,
   ExternalLink
 } from 'lucide-react';
 import { useNavigate } from 'react-router-dom';
 import MobileLayout from '@/components/layout/MobileLayout';
 import AgreementSheet from '@/components/help/AgreementSheet';
 
 type AgreementType = 'user-agreement' | 'privacy-policy' | 'membership-terms';

const HelpPage = () => {
  const navigate = useNavigate();
   const [sheetOpen, setSheetOpen] = useState(false);
   const [activeAgreement, setActiveAgreement] = useState<AgreementType | null>(null);
 
   const openAgreement = (type: AgreementType) => {
     setActiveAgreement(type);
     setSheetOpen(true);
   };

  const productFeatures = [
    { icon: '🔍', title: '智能聚合', desc: '自动抓取你关注的信息源内容' },
    { icon: '🤖', title: 'AI 摘要', desc: '用 AI 为你提炼核心观点' },
    { icon: '📱', title: '每日推送', desc: '按时推送，不错过重要资讯' },
    { icon: '🎯', title: '个性定制', desc: '关注你感兴趣的频道和博主' },
  ];

  const agreements = [
     { icon: FileText, title: '用户服务协议', type: 'user-agreement' as AgreementType },
     { icon: Shield, title: '隐私政策', type: 'privacy-policy' as AgreementType },
     { icon: FileText, title: '会员服务条款', type: 'membership-terms' as AgreementType },
  ];

  const contactMethods = [
    { icon: Mail, title: '邮件反馈', value: 'support@guigusudi.com', action: 'mailto:support@guigusudi.com' },
    { icon: MessageCircle, title: '微信客服', value: '添加微信: guigusudi_ai', action: null },
  ];

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
          <h1 className="text-lg font-bold text-foreground">帮助与反馈</h1>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* 产品介绍 */}
        <motion.div
          className="rounded-2xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 p-5 border border-primary/10 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-foreground text-lg">硅谷速递</h2>
                <p className="text-xs text-muted-foreground">你的 AI 信息助理</p>
              </div>
            </div>

            <p className="text-sm text-foreground/80 leading-relaxed mb-4">
              硅谷速递是一款智能信息聚合工具，帮助你追踪科技圈动态。我们自动抓取你关注的信息源，用 AI 提炼核心内容，每天为你推送精选资讯。
            </p>

            <div className="grid grid-cols-2 gap-2">
              {productFeatures.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-background/60"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <span className="text-lg">{feature.icon}</span>
                  <div>
                    <p className="text-xs font-medium text-foreground">{feature.title}</p>
                    <p className="text-xs text-muted-foreground">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* 协议条款 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-primary" />
            <span className="font-semibold text-foreground text-sm">协议与条款</span>
          </div>

          <div className="bg-card rounded-xl overflow-hidden shadow-sm">
            {agreements.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.button
                  key={item.title}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/50 transition-colors border-b border-border last:border-b-0"
                  whileTap={{ backgroundColor: 'hsl(var(--secondary))' }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + index * 0.05 }}
                 onClick={() => openAgreement(item.type)}
                >
                  <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
                    <Icon className="w-4.5 h-4.5 text-foreground" />
                  </div>
                  <span className="flex-1 text-left text-sm font-medium text-foreground">
                    {item.title}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* 联系我们 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle className="w-4 h-4 text-accent" />
            <span className="font-semibold text-foreground text-sm">联系我们</span>
          </div>

          <div className="bg-card rounded-xl overflow-hidden shadow-sm">
            {contactMethods.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.a
                  key={item.title}
                  href={item.action || undefined}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/50 transition-colors border-b border-border last:border-b-0"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + index * 0.05 }}
                >
                  <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
                    <Icon className="w-4.5 h-4.5 text-foreground" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.value}</p>
                  </div>
                  {item.action && (
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  )}
                </motion.a>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground text-center mt-4">
            工作日 9:00 - 18:00 回复
          </p>
        </motion.div>

        {/* 底部留白 */}
        <div className="pb-8" />
      </div>
       
       <AgreementSheet 
         open={sheetOpen} 
         onOpenChange={setSheetOpen} 
         type={activeAgreement} 
       />
    </MobileLayout>
  );
};

export default HelpPage;
