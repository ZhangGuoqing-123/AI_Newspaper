import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Zap, Globe, Bell, Sparkles, Mail, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockChannels } from '@/data/mockData';
import { PushChannel } from '@/types';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (selectedChannels: string[]) => void;
}

const steps = [
  {
    icon: Zap,
    title: '欢迎来到硅谷速递',
    description: '硅谷 AI 圈今天发生了什么，明早你用中文看到。告别信息焦虑，每天 10 分钟搞定。',
  },
  {
    icon: Globe,
    title: '选一个起点',
    description: '我们精选了主题信息源包，可以整包订阅，也可以进去单独挑。当然你也可以随时自己添加源。',
    showChannels: true,
  },
  {
    icon: Bell,
    title: '日报发到哪？',
    description: '配置一次，每天定时推送。不用打开 App，在邮箱或飞书里直接读。',
    showPushSetup: true,
  },
];

const OnboardingModal = ({ isOpen, onComplete }: OnboardingModalProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['c1', 'c2']);
  const [pushChannel, setPushChannel] = useState<PushChannel>('email');
  const [email, setEmail] = useState('');
  const [feishuWebhook, setFeishuWebhook] = useState('');

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isWebhookValid = feishuWebhook.startsWith('https://open.feishu.cn/open-apis/bot/');
  const pushFilled = pushChannel === 'email' ? isEmailValid : isWebhookValid;

  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (!isLastStep) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete(selectedChannels);
    }
  };

  const toggleChannel = (channelId: string) => {
    setSelectedChannels(prev =>
      prev.includes(channelId)
        ? prev.filter(id => id !== channelId)
        : [...prev, channelId]
    );
  };

  const step = steps[currentStep];
  const Icon = step.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background z-[100] overflow-y-auto"
        >
          <div className="min-h-full flex flex-col px-6 safe-area-inset-top safe-area-inset-bottom">
            {/* 进度条 */}
            <div className="flex gap-2 pt-12 pb-4 shrink-0">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    index <= currentStep ? 'bg-primary' : 'bg-secondary'
                  }`}
                />
              ))}
            </div>

            {/* 内容区域 */}
            <div className="flex-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="py-6"
                >
                  {/* 图标 */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6"
                  >
                    <Icon className="w-10 h-10 text-primary" />
                  </motion.div>

                  <h1 className="text-2xl font-bold text-foreground mb-3">
                    {step.title}
                  </h1>
                  <p className="text-muted-foreground mb-6">
                    {step.description}
                  </p>

                  {/* 频道选择 */}
                  {step.showChannels && (
                    <div className="grid grid-cols-2 gap-3">
                      {mockChannels.slice(0, 6).map((channel) => {
                        const isSelected = selectedChannels.includes(channel.id);
                        return (
                          <motion.button
                            key={channel.id}
                            onClick={() => toggleChannel(channel.id)}
                            className={`p-4 rounded-xl border-2 transition-colors text-left relative ${
                              isSelected
                                ? 'border-primary bg-primary/5'
                                : 'border-border bg-card'
                            }`}
                            whileTap={{ scale: 0.98 }}
                          >
                            <span className="text-2xl mb-2 block">{channel.icon}</span>
                            <h3 className="font-medium text-sm text-foreground truncate">
                              {channel.name}
                            </h3>
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                              >
                                <Sparkles className="w-3 h-3 text-primary-foreground" />
                              </motion.div>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  )}

                  {/* 推送渠道设置 */}
                  {step.showPushSetup && (
                    <div className="space-y-4">
                      {/* 渠道选择 */}
                      <div className="grid grid-cols-2 gap-3">
                        <motion.button
                          onClick={() => setPushChannel('email')}
                          className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all relative ${
                            pushChannel === 'email'
                              ? 'border-primary bg-primary/5'
                              : 'border-border bg-card'
                          }`}
                          whileTap={{ scale: 0.97 }}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            pushChannel === 'email' ? 'bg-primary/15' : 'bg-secondary'
                          }`}>
                            <Mail className={`w-5 h-5 ${pushChannel === 'email' ? 'text-primary' : 'text-muted-foreground'}`} />
                          </div>
                          <span className={`text-sm font-medium ${pushChannel === 'email' ? 'text-primary' : 'text-foreground'}`}>
                            邮件
                          </span>
                          {pushChannel === 'email' && (
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
                          onClick={() => setPushChannel('feishu')}
                          className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all relative ${
                            pushChannel === 'feishu'
                              ? 'border-primary bg-primary/5'
                              : 'border-border bg-card'
                          }`}
                          whileTap={{ scale: 0.97 }}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            pushChannel === 'feishu' ? 'bg-primary/15' : 'bg-secondary'
                          }`}>
                            <span className="text-2xl">🪐</span>
                          </div>
                          <span className={`text-sm font-medium ${pushChannel === 'feishu' ? 'text-primary' : 'text-foreground'}`}>
                            飞书
                          </span>
                          {pushChannel === 'feishu' && (
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

                      {/* 输入框 */}
                      <AnimatePresence mode="wait">
                        {pushChannel === 'email' ? (
                          <motion.div
                            key="email-input"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                          >
                            <Input
                              type="email"
                              placeholder="输入接收日报的邮箱"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="h-12"
                            />
                          </motion.div>
                        ) : (
                          <motion.div
                            key="feishu-input"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            className="space-y-2"
                          >
                            <Input
                              type="url"
                              placeholder="飞书机器人 Webhook 地址"
                              value={feishuWebhook}
                              onChange={(e) => setFeishuWebhook(e.target.value)}
                              className="h-12"
                            />
                            <p className="text-xs text-muted-foreground">
                              在飞书群添加「自定义机器人」后获取 Webhook 地址
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {pushFilled && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex items-center gap-2 text-sm text-primary"
                        >
                          <Check className="w-4 h-4" />
                          配置完成，每天 08:00 准时推送
                        </motion.div>
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* 底部按钮 */}
            <div className="pb-4 pt-3 shrink-0">
              <Button
                onClick={handleNext}
                className="w-full h-14 text-base gap-2"
                size="lg"
              >
                {isLastStep ? (
                  pushFilled ? '开始探索' : '跳过，稍后设置'
                ) : (
                  <>
                    继续
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </Button>

              {currentStep === 0 && (
                <button
                  onClick={() => onComplete([])}
                  className="w-full mt-3 text-sm text-muted-foreground"
                >
                  跳过引导
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OnboardingModal;
