import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mail, Clock, Check, ChevronDown, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '@/components/layout/MobileLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { PushChannel } from '@/types';

// 飞书图标（SVG）
const FeishuIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1.5 14.5v-9l7 4.5-7 4.5z"/>
  </svg>
);

const pushTimeOptions = [
  { value: '07:00', label: '07:00 早起型' },
  { value: '08:00', label: '08:00 通勤时' },
  { value: '09:00', label: '09:00 上班前' },
  { value: '12:00', label: '12:00 午休时' },
  { value: '18:00', label: '18:00 下班后' },
  { value: '21:00', label: '21:00 睡前' },
];

const PushSettingsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [channel, setChannel] = useState<PushChannel>('email');
  const [email, setEmail] = useState('');
  const [feishuWebhook, setFeishuWebhook] = useState('');
  const [pushTime, setPushTime] = useState('08:00');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isSending, setIsSending] = useState(false);

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

  const selectedTimeLabel = pushTimeOptions.find(o => o.value === pushTime)?.label || pushTime;

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

        {/* 推送渠道选择 */}
        <div>
          <label className="text-sm font-medium text-foreground block mb-3">
            推送渠道
          </label>
          <div className="grid grid-cols-2 gap-3">
            {/* 邮件 */}
            <motion.button
              onClick={() => setChannel('email')}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                channel === 'email'
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card'
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

            {/* 飞书 */}
            <motion.button
              onClick={() => setChannel('feishu')}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                channel === 'feishu'
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card'
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
            </motion.button>
          </div>
        </div>

        {/* 渠道配置输入 */}
        <AnimatePresence mode="wait">
          {channel === 'email' ? (
            <motion.div
              key="email"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <label className="text-sm font-medium text-foreground block mb-2">
                接收邮箱
              </label>
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
            <motion.div
              key="feishu"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-3"
            >
              <label className="text-sm font-medium text-foreground block mb-2">
                飞书机器人 Webhook
              </label>
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

        {/* 推送时间 */}
        <div>
          <label className="text-sm font-medium text-foreground flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-primary" />
            推送时间
          </label>
          <motion.button
            onClick={() => setShowTimePicker(!showTimePicker)}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-border bg-card"
            whileTap={{ scale: 0.98 }}
          >
            <span className="font-medium text-foreground">{selectedTimeLabel}</span>
            <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${showTimePicker ? 'rotate-180' : ''}`} />
          </motion.button>

          <AnimatePresence>
            {showTimePicker && (
              <motion.div
                className="mt-2 rounded-xl border border-border bg-card overflow-hidden"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                {pushTimeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => { setPushTime(option.value); setShowTimePicker(false); }}
                    className={`w-full flex items-center justify-between px-4 py-3 border-b border-border last:border-b-0 hover:bg-secondary/50 transition-colors ${
                      pushTime === option.value ? 'bg-primary/5' : ''
                    }`}
                  >
                    <span className={`text-sm ${pushTime === option.value ? 'font-medium text-primary' : 'text-foreground'}`}>
                      {option.label}
                    </span>
                    {pushTime === option.value && <Check className="w-4 h-4 text-primary" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 发送测试 */}
        {canSave && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Button
              variant="outline"
              className="w-full h-11 gap-2"
              onClick={handleTestSend}
              disabled={isSending}
            >
              <Send className="w-4 h-4" />
              {isSending ? '发送中...' : '发送测试日报'}
            </Button>
          </motion.div>
        )}

        {/* 保存按钮 */}
        <div className="pt-2">
          <Button
            onClick={handleSave}
            className="w-full h-12 text-base font-medium"
            disabled={!canSave}
          >
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
