import { memo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, TrendingUp, User } from 'lucide-react';

// 旧版「首页/发现/播报」三个 Tab 已收编：信源变成「我的」里的透明度面板，
// 播报音频就地播放——保留「研究」(agent 本体)、「榜单」(热度榜) 和「我的」。
const navItems = [
  { path: '/', label: '聊一聊', icon: Sparkles, matchPaths: ['/', '/feed', '/discover', '/following', '/broadcast'] },
  { path: '/trends', label: '榜单', icon: TrendingUp, matchPaths: ['/trends'] },
  { path: '/profile', label: '我的', icon: User, matchPaths: ['/profile'] },
];

const BottomNav = memo(() => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavClick = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-card/95 backdrop-blur-lg border-t border-border safe-area-inset-bottom z-50">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = item.matchPaths.includes(location.pathname);
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => handleNavClick(item.path)}
              className="relative flex flex-col items-center justify-center w-16 h-full active:scale-95 transition-transform duration-100"
            >
              <div className="relative">
                <Icon 
                  className={`w-6 h-6 ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                />
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
              </div>
              <span className={`text-xs mt-1 ${
                isActive ? 'text-primary font-medium' : 'text-muted-foreground'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
});

BottomNav.displayName = 'BottomNav';

export default BottomNav;
