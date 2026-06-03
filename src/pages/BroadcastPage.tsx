import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Radio, Volume2 } from 'lucide-react';
import MobileLayout from '@/components/layout/MobileLayout';
import { mockBroadcast } from '@/data/mockData';

const formatTime = (s: number) => {
  if (!isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

// 播报页（方案甲）：上方音频、下方数字人视频，同一时刻只播一个（互斥）
const BroadcastPage = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const progress = duration ? (currentTime / duration) * 100 : 0;

  const toggleAudio = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      videoRef.current?.pause(); // 互斥：开始放音频前先暂停视频
      a.play();
    } else {
      a.pause();
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current;
    if (!a || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    a.currentTime = ratio * duration;
  };

  return (
    <MobileLayout>
      {/* 头部 */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-30 safe-area-inset-top">
        <div className="px-4 pt-4 pb-3 flex items-center gap-2">
          <Radio className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">播报</h1>
          <span className="text-sm text-muted-foreground ml-auto">{mockBroadcast.date}</span>
        </div>
      </div>

      <div className="px-4 pb-8 space-y-5">
        {/* 标题 */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-lg font-bold text-foreground">{mockBroadcast.title}</h2>
          <p className="text-xs text-muted-foreground mt-1">AI 为你把今日日报读出来 · 可听可看</p>
        </motion.div>

        {/* 上方：语音播报 */}
        <motion.div
          className="rounded-2xl p-5 bg-foreground text-background shadow-lg"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Volume2 className="w-5 h-5" />
            <span className="font-medium">语音播报</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleAudio}
              className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shrink-0 touch-feedback"
              aria-label={isAudioPlaying ? '暂停' : '播放'}
            >
              {isAudioPlaying ? (
                <Pause className="w-7 h-7 text-primary-foreground" />
              ) : (
                <Play className="w-7 h-7 text-primary-foreground ml-1" />
              )}
            </button>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate mb-2">{mockBroadcast.title}</p>
              <div
                className="h-1.5 bg-background/20 rounded-full cursor-pointer"
                onClick={handleSeek}
              >
                <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex justify-between text-xs opacity-70 mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>

          <audio
            ref={audioRef}
            src={mockBroadcast.audioUrl}
            preload="metadata"
            onPlay={() => {
              videoRef.current?.pause();
              setIsAudioPlaying(true);
            }}
            onPause={() => setIsAudioPlaying(false)}
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            onEnded={() => {
              setIsAudioPlaying(false);
              setCurrentTime(0);
            }}
          />
        </motion.div>

        {/* 下方：数字人口播 */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-foreground">数字人口播</span>
            <span className="text-xs text-muted-foreground">播放会自动暂停语音</span>
          </div>
          <div className="rounded-2xl overflow-hidden bg-black shadow-lg">
            <video
              ref={videoRef}
              src={mockBroadcast.videoUrl}
              poster={mockBroadcast.posterImage}
              controls
              playsInline
              className="w-full bg-black"
              onPlay={() => {
                audioRef.current?.pause();
              }}
            />
          </div>
        </motion.div>

        {/* 今日文稿 */}
        <motion.div
          className="rounded-2xl bg-card border border-border p-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h3 className="font-semibold text-foreground text-sm mb-2">今日文稿</h3>
          <p className="text-sm text-foreground/80 leading-relaxed">{mockBroadcast.description}</p>
        </motion.div>

        {/* 占位提示 */}
        <p className="text-xs text-muted-foreground text-center">
          当前为占位音视频，接入 DreamAPI LipSync 生成后替换 mockBroadcast 的 URL 即可
        </p>
      </div>
    </MobileLayout>
  );
};

export default BroadcastPage;
