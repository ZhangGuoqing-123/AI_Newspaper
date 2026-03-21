import { useState, useRef, ReactNode } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  className?: string;
}

const PULL_THRESHOLD = 80;

const PullToRefresh = ({ children, onRefresh, className = '' }: PullToRefreshProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const y = useMotionValue(0);
  
  const rotate = useTransform(y, [0, PULL_THRESHOLD], [0, 360]);
  const opacity = useTransform(y, [0, PULL_THRESHOLD / 2, PULL_THRESHOLD], [0, 0.5, 1]);
  const scale = useTransform(y, [0, PULL_THRESHOLD], [0.5, 1]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    const diff = Math.max(0, (currentY - startY.current) * 0.5);
    
    if (diff > 0 && containerRef.current?.scrollTop === 0) {
      y.set(Math.min(diff, PULL_THRESHOLD * 1.5));
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling) return;
    
    if (y.get() >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      await animate(y, PULL_THRESHOLD, { duration: 0.2 });
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        animate(y, 0, { duration: 0.3 });
      }
    } else {
      animate(y, 0, { duration: 0.3 });
    }
    
    setIsPulling(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* 刷新指示器 */}
      <motion.div 
        className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center z-20"
        style={{ 
          y: useTransform(y, [0, PULL_THRESHOLD], [-40, 16]),
          opacity 
        }}
      >
        <motion.div 
          className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"
          style={{ scale }}
        >
          <motion.div style={{ rotate: isRefreshing ? undefined : rotate }}>
            <RefreshCw 
              className={`w-5 h-5 text-primary ${isRefreshing ? 'animate-spin' : ''}`} 
            />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* 内容容器 */}
      <motion.div
        ref={containerRef}
        className="h-full overflow-y-auto"
        style={{ y: isPulling || isRefreshing ? y : 0 }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default PullToRefresh;
