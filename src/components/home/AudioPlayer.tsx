import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipForward, X, Volume2 } from 'lucide-react';

const AudioPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <motion.div
      className="fixed bottom-20 left-2 right-2 max-w-[414px] mx-auto z-40"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 30 }}
    >
      <AnimatePresence mode="wait">
        {isExpanded ? (
          <motion.div
            key="expanded"
            className="bg-foreground text-background rounded-2xl p-4 shadow-xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Volume2 className="w-5 h-5" />
                <span className="font-medium">AI 语音播报</span>
              </div>
              <button 
                onClick={() => setIsVisible(false)}
                className="p-1 hover:bg-background/10 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-sm opacity-80 mb-4 line-clamp-2">
              正在播放：今日 AI 圈大事 - OpenAI GPT-5 预览版发布引发热议...
            </p>

            {/* 进度条 */}
            <div className="w-full h-1 bg-background/20 rounded-full mb-4">
              <div className="w-1/3 h-full bg-primary rounded-full" />
            </div>

            <div className="flex items-center justify-center gap-6">
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-12 h-12 rounded-full bg-primary flex items-center justify-center touch-feedback"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 text-primary-foreground" />
                ) : (
                  <Play className="w-6 h-6 text-primary-foreground ml-1" />
                )}
              </button>
              <button className="p-2 hover:bg-background/10 rounded-full">
                <SkipForward className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="collapsed"
            className="bg-foreground text-background rounded-full px-4 py-3 shadow-xl flex items-center gap-3 cursor-pointer"
            onClick={() => setIsExpanded(true)}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            whileTap={{ scale: 0.98 }}
          >
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsPlaying(!isPlaying);
              }}
              className="w-8 h-8 rounded-full bg-primary flex items-center justify-center touch-feedback"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 text-primary-foreground" />
              ) : (
                <Play className="w-4 h-4 text-primary-foreground ml-0.5" />
              )}
            </button>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">今日 AI 圈大事</p>
            </div>

            {isPlaying && (
              <div className="audio-wave text-primary">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AudioPlayer;
