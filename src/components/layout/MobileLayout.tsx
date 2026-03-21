import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import BottomNav from './BottomNav';

interface MobileLayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

const MobileLayout = ({ children, showNav = true }: MobileLayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex flex-col max-w-[430px] mx-auto relative">
      {/* 主内容区域 */}
      <motion.main 
        className={`flex-1 overflow-y-auto ${showNav ? 'pb-20' : ''}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.main>

      {/* 底部导航 */}
      {showNav && <BottomNav />}
    </div>
  );
};

export default MobileLayout;
