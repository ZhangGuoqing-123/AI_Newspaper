import { motion } from 'framer-motion';
import { Compass, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const EmptyState = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      className="flex flex-col items-center justify-center px-8 py-16 text-center"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
    >
      {/* 插画 */}
      <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center mb-6">
        <Compass className="w-12 h-12 text-muted-foreground" />
      </div>

      {/* 文案 */}
      <h3 className="text-lg font-semibold text-foreground mb-2">
        还没有关注任何频道
      </h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-[240px]">
        去发现页面探索感兴趣的内容，开启你的硅谷速递之旅
      </p>

      {/* CTA 按钮 */}
      <Button 
        onClick={() => navigate('/discover')}
        className="gap-2"
      >
        <Plus className="w-4 h-4" />
        去逛逛
      </Button>
    </motion.div>
  );
};

export default EmptyState;
