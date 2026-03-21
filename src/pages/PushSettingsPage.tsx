import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mail, Clock, Check, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '@/components/layout/MobileLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { PushChannel } from '@/types';

// 飞书图标
const FeishuIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1.5 14.5v-9l7 4.5-7 4.5z"/>
  </svg>
);

const ITEM_HEIGHT = 48;
const VISIBLE_ITEMS = 5;

const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

interface ScrollColumnProps {
  items: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
}

const ScrollColumn = ({ items, selectedIndex, onChange }: ScrollColumnProps) => {
  const dragStartY = useRef(0);
  const currentOffset = useRef(0);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);

  const centerY = Math.floor(VISIBLE_ITEMS / 2) * ITEM_HEIGHT;
  const translateY = centerY - selectedIndex * ITEM_HEIGHT;

  const commitDrag = () => {
    const steps = Math.round(-currentOffset.current / ITEM_HEIGHT);
    const next = Math.max(0, Math.min(items.length - 1, selectedIndex + steps));
    onChange(next);
    currentOffset.current = 0;
    setOffset(0);
    setDragging(false);
  };

  return (
    <div
      className="relative overflow-hidden select-none cursor-grab active:cursor-grabbing"
      style={{ height: ITEM_HEIGHT * VISIBLE_ITEMS, width: 88 }}
      onTouchStart={(e) => { dragStartY.current = e.touches[0].clientY; setDragging(true); }}
      onTouchMove={(e) => {
        const delta = e.touches[0].clientY - dragStartY.current;
        currentOffset.current = delta;
        setOffset(delta);
      }}
      onTouchEnd={commitDrag}
      onMouseDown={(e) => { dragStartY.current = e.clientY; setDragging(true); }}
      onMouseMove={(e) => {
        if (!dragging) return;
        const delta = e.clientY - dragStartY.current;
        currentOffset.current = delta;
        setOffset(delta);
      }}
      onMouseUp={commitDrag}
      onMouseLeave={() => { if (dragging) commitDrag(); }}
    >
      {/* 选中高亮行 */}
      <div
        className="absolute inset-x-0 z-10 pointer-events-none border-t border-b border-primary/25 bg-primary/5 rounded-lg"
        style={{ top: centerY, height: ITEM_HEIGHT }}
      />
      {/* 上下渐变遮罩 */}
      <div className="absolute inset-x-0 top-0 z-20 pointer-events-none h-16 bg-gradient-to-b from-background via-background/80 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 z-20 pointer-events-none h-16 bg-gradient-to-t from-background via-background/80 to-transparent" />

      {/* 滚动列表 */}
      <motion.div
        animate={{ y: translateY + offset }}
        transition={dragging ? { duration: 0 } : { type: 'spring', stiffness: 350, damping: 32 }}
      >
        {items.map((item, i) => {
          const dist = Math.abs(i - selectedIndex);
          const opacity = dist === 0 ? 1 : dist === 1 ? 0.45 : 0.2;
          const scale = dist === 0 ? 1.15 : 0.9;
          return (
            <div
              key={item}
              className="flex items-center justify-center font-semibold tabular-nums"
              style={{ height: ITEM_HEIGHT }}
            >
              <span
                className="transition-all duration-150 text-2xl"
                style={{ opacity, transform: `scale(${scale})`, color: dist === 0 ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))' }}
              >
                {item}
              </span>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
};

const PushSettingsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [channel, setChannel] = useState<PushChannel>('email');
  const [email, setEmail] = useState('');
  const [feishuWebhook, setFeishuWebhook] = useState('');
  const [selectedHour, setSelectedHour] = useState(8);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [isSending, setIsSending] = useState(false);

  const pushTime = `${hours[selectedHour]}:${minutes[selectedMinute]}`;

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isWebhookValid = feishuWebhook.startsWith('https://open.feishu.cn/open-apis/bot/');
  const canSave = channel === 'email' ? isEmailValid : isWebhookValid;

  const handleTestSend = async () => {
    setIsSending(true);
    await new Promise(r => setTimeout(r, 1500));
    setIsSending(false);
    toast({ title: '测试日报已发送', description: '请查收，若未收到请检查配置是否正确' });
  };

  const handleSave = () => {
    toast({ title: '推送设置已保存', description: `将于每日 ${pushTime} 发送日报` });
    navigate(-1);
  };

  return (
    <MobileLayout showNav={false}>
      {/* 顶部导航 */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <motion.button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <h1 className="text-lg font-bold text-foreground">推送设置</h1>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">

        {/* 推送渠道 */}
        <div>
          <label className="text-sm font-medium text-foreground block mb-3">推送渠道</label>
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              onClick={() => setChannel('email')}
              className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                channel === 'email' ? 'border-primary bg-primary/5' : 'border-border bg-card'
              }`}
              whileTap={{ scale: 0.97 }}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                channel === 'email' ? 'bg-primary/15' : 'bg-secondary'
              }`}>
                <Mail className={`w-5 h-5 ${channel === 'email' ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <span className={`text-sm font-medium ${channel === 'email' ? 'text-primary' : 'text-foreground'}`}>
                邮件
              </span>
              {channel === 'email' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                >
                  <Check className="w-3 h-3 text-primary-foreground" />
                </motion.div>
              )}
            </motion.button>

            <motion.button
              onClick={() => setChannel('feishu')}
              className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                channel === 'feishu' ? 'border-primary bg-primary/5' : 'border-border bg-card'
              }`}
              whileTap={{ scale: 0.97 }}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                channel === 'feishu' ? 'bg-primary/15' : 'bg-secondary'
              }`}>
                <span className="text-2xl">🪐</span>
              </div>
              <span className={`text-sm font-medium ${channel === 'feishu' ? 'text-primary' : 'text-foreground'}`}>
                飞书
              </span>
              {channel === 'feishu' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                >
                  <Check className="w-3 h-3 text-primary-foreground" />
                </motion.div>
              )}
            </motion.button>
          </div>
        </div>

        {/* 渠道配置输入 */}
        <AnimatePresence mode="wait">
          {channel === 'email' ? (
            <motion.div key="email" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <label className="text-sm font-medium text-foreground block mb-2">接收邮箱</label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12"
              />
              <p className="text-xs text-muted-foreground mt-2">
                日报将发送至该邮箱，支持 QQ 邮箱、163、企业邮箱等
              </p>
            </motion.div>
          ) : (
            <motion.div key="feishu" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
              <label className="text-sm font-medium text-foreground block mb-2">飞书机器人 Webhook</label>
              <Input
                type="url"
                placeholder="https://open.feishu.cn/open-apis/bot/..."
                value={feishuWebhook}
                onChange={(e) => setFeishuWebhook(e.target.value)}
                className="h-12"
              />
              <div className="p-3 rounded-xl bg-secondary/60 text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">如何获取 Webhook？</p>
                <p>1. 在飞书群中添加「自定义机器人」</p>
                <p>2. 复制生成的 Webhook 地址粘贴到此处</p>
                <p>3. 日报将以卡片消息形式发到群里</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 推送时间 — 滚轮选择器 */}
        <div>
          <label className="text-sm font-medium text-foreground flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-primary" />
            推送时间
          </label>
          <div className="flex items-center justify-center gap-2 py-2">
            <ScrollColumn items={hours} selectedIndex={selectedHour} onChange={setSelectedHour} />
            <span className="text-3xl font-bold text-foreground pb-1">:</span>
            <ScrollColumn items={minutes} selectedIndex={selectedMinute} onChange={setSelectedMinute} />
          </div>
          <p className="text-xs text-muted-foreground text-center mt-3">
            上下滑动选择时间，每天 <span className="text-foreground font-medium">{pushTime}</span> 发送日报
          </p>
        </div>

        {/* 发送测试 */}
        {canSave && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Button variant="outline" className="w-full h-11 gap-2" onClick={handleTestSend} disabled={isSending}>
              <Send className="w-4 h-4" />
              {isSending ? '发送中...' : '发送测试日报'}
            </Button>
          </motion.div>
        )}

        {/* 保存按钮 */}
        <div className="pt-2">
          <Button onClick={handleSave} className="w-full h-12 text-base font-medium" disabled={!canSave}>
            保存设置
          </Button>
          {!canSave && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              {channel === 'email' ? '请输入有效的邮箱地址' : '请输入有效的飞书 Webhook 地址'}
            </p>
          )}
        </div>
      </div>
    </MobileLayout>
  );
};

export default PushSettingsPage;
