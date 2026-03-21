import { memo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Compass, Heart, User } from 'lucide-react';

const navItems = [
  { path: '/', label: '首页', icon: Home },
  { path: '/discover', label: '发现', icon: Compass },
  { path: '/following', label: '关注', icon: Heart },
  { path: '/profile', label: '我的', icon: User },
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
          const isActive = location.pathname === item.path;
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
