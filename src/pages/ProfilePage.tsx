import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Bookmark, Radio, Sparkles } from 'lucide-react';
import MobileLayout from '@/components/layout/MobileLayout';
import { getClientId } from '@/lib/agentApi';
import { useFavorites } from '@/lib/favorites';

const ProfilePage = () => {
  const navigate = useNavigate();
  const favorites = useFavorites();

  // 当前是匿名 MVP：没有正式登录，身份就是浏览器维度的匿名 id（见 agentApi.getClientId）。
  // 展示其短指纹，比挂一个假昵称/假 VIP 更诚实。
  const clientId = getClientId();
  const shortId = clientId === 'anon' ? '匿名' : clientId.replace(/-/g, '').slice(0, 8).toUpperCase();

  // 「情报来源」是产品透明度入口；「我的收藏」带实时计数。
  // （「帮助与反馈」已移除：内容全是日报时代遗留的假客服/会员条款，与当前产品无关。）
  const menuItems = [
    {
      icon: Bookmark,
      label: '我的收藏',
      value: favorites.length > 0 ? `${favorites.length} 条` : '',
      path: '/favorites',
    },
    { icon: Radio, label: '情报来源', value: 'AI 圈账号', path: '/add-source' },
  ];

  return (
    <MobileLayout>
      {/* 身份卡片 */}
      <motion.div
        className="mx-4 mt-4 p-5 rounded-2xl bg-card shadow-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary via-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-foreground">硅谷速递用户</h2>
            <p className="text-xs text-muted-foreground mt-0.5">ID: {shortId}</p>
          </div>
        </div>
      </motion.div>

      {/* 功能菜单 */}
      <motion.div
        className="mx-4 mt-4 bg-card rounded-2xl shadow-card overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {menuItems.map((item) => {
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
              <span className="flex-1 text-left font-medium text-foreground">{item.label}</span>
              {item.value && (
                <span className="text-sm text-muted-foreground mr-1">{item.value}</span>
              )}
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </motion.button>
          );
        })}
      </motion.div>

      <div className="pb-8" />
    </MobileLayout>
  );
};

export default ProfilePage;
