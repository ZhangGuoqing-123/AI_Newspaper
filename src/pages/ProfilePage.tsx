import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { 
  ChevronRight, 
  Crown,
  Clock, 
  Bookmark, 
  HelpCircle,
  LogOut,
  Star,
  Zap,
  Shield
} from 'lucide-react';
import MobileLayout from '@/components/layout/MobileLayout';
import UpgradeModal from '@/components/profile/UpgradeModal';
import { mockUser } from '@/data/mockData';

const menuItems = [
  { icon: Clock, label: '推送时间', value: '每天 08:00', path: '/settings/push' },
  { icon: Bookmark, label: '我的收藏', value: '', path: '/favorites' },
  { icon: HelpCircle, label: '帮助与反馈', value: '', path: '/help' },
];

const freeFeatures = [
  { label: '关注 20 个信息源', included: true },
  { label: '每日爬取更新', included: true },
  { label: '内容翻译', included: true },
  { label: 'AI 智能分析', included: false },
];

const proFeatures = [
  { icon: Zap, label: '关注 100 个信息源' },
  { icon: Star, label: 'AI 智能分析总结' },
  { icon: Clock, label: '多次推送' },
  { icon: Shield, label: '专属客服' },
];

const ProfilePage = () => {
  const navigate = useNavigate();
   const { toast } = useToast();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

   const handleLogout = () => {
     // TODO: 清除用户登录状态
     toast({
       title: "已退出登录",
       description: "期待您的再次使用",
     });
     navigate('/auth');
   };

  return (
    <>
      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
      />
    <MobileLayout>
      {/* 个人信息卡片 */}
      <motion.div
        className="mx-4 mt-4 p-5 rounded-2xl bg-card shadow-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4">
          {/* 头像 */}
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary via-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
              <span className="text-2xl font-bold text-primary-foreground">
                {mockUser.nickname.charAt(0)}
              </span>
            </div>
            {mockUser.isVip && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-accent flex items-center justify-center shadow-md">
                <Crown className="w-3.5 h-3.5 text-accent-foreground" />
              </div>
            )}
          </div>

          {/* 信息 */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-foreground">{mockUser.nickname}</h2>
              {mockUser.isVip && (
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-gradient-to-r from-accent to-accent/70 text-accent-foreground">
                  PRO
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              UID: {mockUser.uid.replace('u_', '')}
            </p>
          </div>

          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>
      </motion.div>

      {/* VIP 升级卡片 */}
      {!mockUser.isVip && (
        <motion.div
          className="mx-4 mt-4 rounded-2xl overflow-hidden relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* 背景渐变 */}
          <div className="absolute inset-0 bg-gradient-to-br from-foreground to-foreground/90" />
          
          {/* 装饰光效 */}
          <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-accent/20 blur-3xl" />
          <div className="absolute -left-8 -bottom-8 w-32 h-32 rounded-full bg-primary/20 blur-2xl" />

          <div className="relative p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center">
                <Crown className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <span className="font-bold text-background">升级 Pro 会员</span>
                <p className="text-xs text-background/60">解锁全部高级功能</p>
              </div>
            </div>

            {/* 功能对比 */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {proFeatures.map((feature, index) => (
                <motion.div
                  key={feature.label}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background/5"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                >
                  <feature.icon className="w-4 h-4 text-accent" />
                  <span className="text-xs text-background/80">{feature.label}</span>
                </motion.div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-3xl font-bold text-background">¥19</span>
                <span className="text-sm text-background/60">/月</span>
              </div>
              <motion.button 
                className="px-6 py-2.5 rounded-full bg-accent text-accent-foreground font-bold text-sm shadow-lg"
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowUpgradeModal(true)}
              >
                立即升级
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {/* 功能菜单 */}
      <motion.div
        className="mx-4 mt-4 bg-card rounded-2xl shadow-card overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.label}
              className="w-full flex items-center gap-3 px-4 py-4 hover:bg-secondary/50 transition-colors border-b border-border last:border-b-0"
              whileTap={{ backgroundColor: 'hsl(var(--secondary))' }}
              onClick={() => navigate(item.path)}
            >
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <Icon className="w-5 h-5 text-foreground" />
              </div>
              <span className="flex-1 text-left font-medium text-foreground">
                {item.label}
              </span>
              {item.value && (
                <span className="text-sm text-muted-foreground mr-1">
                  {item.value}
                </span>
              )}
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </motion.button>
          );
        })}
      </motion.div>

      {/* 退出登录 */}
      <motion.div
        className="mx-4 mt-4 mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
         <button 
           onClick={handleLogout}
           className="w-full flex items-center justify-center gap-2 py-4 text-destructive font-medium rounded-xl bg-destructive/10 hover:bg-destructive/15 transition-colors"
         >
          <LogOut className="w-5 h-5" />
          退出登录
        </button>
      </motion.div>

      {/* 底部留白 */}
      <div className="pb-8" />
    </MobileLayout>
    </>
  );
};

export default ProfilePage;
