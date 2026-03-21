import { ReactNode, useState } from 'react';
import { motion, useMotionValue, useTransform, animate, PanInfo } from 'framer-motion';
import { Bookmark, Share2, CheckCircle } from 'lucide-react';

interface SwipeableCardProps {
  children: ReactNode;
  onSave?: () => void;
  onShare?: () => void;
  onMarkRead?: () => void;
}

const SWIPE_THRESHOLD = 80;

const SwipeableCard = ({ children, onSave, onShare, onMarkRead }: SwipeableCardProps) => {
  const x = useMotionValue(0);
  const [isActionVisible, setIsActionVisible] = useState(false);

  // 左滑显示收藏/分享
  const leftOpacity = useTransform(x, [-SWIPE_THRESHOLD, -40, 0], [1, 0.5, 0]);
  const leftScale = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0.8]);
  
  // 右滑显示已读
  const rightOpacity = useTransform(x, [0, 40, SWIPE_THRESHOLD], [0, 0.5, 1]);
  const rightScale = useTransform(x, [0, SWIPE_THRESHOLD], [0.8, 1]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const offset = info.offset.x;
    
    if (offset < -SWIPE_THRESHOLD) {
      // 左滑 - 显示操作按钮
      animate(x, -120, { type: 'spring', stiffness: 300, damping: 30 });
      setIsActionVisible(true);
    } else if (offset > SWIPE_THRESHOLD) {
      // 右滑 - 标记已读
      onMarkRead?.();
      animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 });
    } else {
      animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 });
      setIsActionVisible(false);
    }
  };

  const handleAction = (action: 'save' | 'share') => {
    if (action === 'save') onSave?.();
    if (action === 'share') onShare?.();
    animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 });
    setIsActionVisible(false);
  };

  return (
    <div className="relative overflow-hidden">
      {/* 左侧操作按钮（收藏/分享） */}
      <motion.div 
        className="absolute right-0 top-0 bottom-0 flex items-center gap-2 px-3"
        style={{ opacity: leftOpacity, scale: leftScale }}
      >
        <button
          onClick={() => handleAction('save')}
          className="w-12 h-12 rounded-full bg-accent flex items-center justify-center touch-feedback"
        >
          <Bookmark className="w-5 h-5 text-accent-foreground" />
        </button>
        <button
          onClick={() => handleAction('share')}
          className="w-12 h-12 rounded-full bg-primary flex items-center justify-center touch-feedback"
        >
          <Share2 className="w-5 h-5 text-primary-foreground" />
        </button>
      </motion.div>

      {/* 右侧操作按钮（已读） */}
      <motion.div 
        className="absolute left-0 top-0 bottom-0 flex items-center px-4"
        style={{ opacity: rightOpacity, scale: rightScale }}
      >
        <div className="flex items-center gap-2 text-success">
          <CheckCircle className="w-6 h-6" />
          <span className="font-medium text-sm">标记已读</span>
        </div>
      </motion.div>

      {/* 卡片内容 */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -120, right: SWIPE_THRESHOLD }}
        dragElastic={0.1}
        style={{ x }}
        onDragEnd={handleDragEnd}
        className="relative bg-background touch-feedback"
      >
        {children}
      </motion.div>
    </div>
  );
};

export default SwipeableCard;
