import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, Zap, Star, Clock, Shield, Check } from 'lucide-react';
 import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const proFeatures = [
  { icon: Zap, label: '关注 100 个信息源' },
  { icon: Star, label: 'AI 智能分析总结' },
  { icon: Clock, label: '优先推送通知' },
  { icon: Shield, label: '专属客服支持' },
];

const plans = [
  { 
    id: 'yearly', 
    name: '年付', 
    price: 168, 
    unit: '年',
    monthlyPrice: 14,
    badge: '省30%',
    recommended: true 
  },
  { 
    id: 'monthly', 
    name: '月付', 
    price: 19, 
    unit: '月',
    monthlyPrice: 19,
    badge: null,
    recommended: false 
  },
];

const UpgradeModal = ({ isOpen, onClose }: UpgradeModalProps) => {
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [selectedPayment, setSelectedPayment] = useState('alipay');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const currentPlan = plans.find(p => p.id === selectedPlan) || plans[0];

  const handleUpgrade = () => {
    if (!agreedToTerms) return;
    // TODO: 接入支付逻辑
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[100]"
            onClick={onClose}
          />

          {/* 弹窗内容 */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className="fixed bottom-0 left-0 right-0 z-[101] bg-background rounded-t-3xl max-w-[430px] mx-auto max-h-[90vh] overflow-y-auto"
          >
            {/* 顶部渐变装饰 */}
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-accent/10 to-transparent rounded-t-3xl pointer-events-none" />
            
            {/* 拖拽指示条 */}
            <div className="flex justify-center pt-3 pb-2 relative z-10">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>
            
            {/* 关闭按钮 */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-secondary/80 flex items-center justify-center hover:bg-secondary transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            <div className="px-5 pb-6 relative">
              {/* 头部 - Pro 标识 */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent via-accent to-accent/60 flex items-center justify-center shadow-lg shadow-accent/20">
                  <Crown className="w-7 h-7 text-accent-foreground" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">升级 Pro 会员</h2>
                  <p className="text-sm text-muted-foreground">解锁全部高级功能</p>
                </div>
              </div>

              {/* 套餐选择 */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                {plans.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`relative p-4 rounded-2xl border-2 transition-all text-left ${
                      selectedPlan === plan.id
                        ? 'border-accent bg-accent/5 shadow-sm'
                        : 'border-border bg-card hover:border-muted-foreground/30'
                    }`}
                  >
                    {/* 推荐标签 */}
                    {plan.badge && (
                      <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-xs font-medium">
                        {plan.badge}
                      </div>
                    )}
                    
                    <p className={`text-sm font-medium mb-1 ${
                      selectedPlan === plan.id ? 'text-accent' : 'text-muted-foreground'
                    }`}>
                      {plan.name}
                    </p>
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-xs text-muted-foreground">¥</span>
                      <span className={`text-2xl font-bold ${
                        selectedPlan === plan.id ? 'text-foreground' : 'text-foreground'
                      }`}>
                        {plan.price}
                      </span>
                      <span className="text-xs text-muted-foreground">/{plan.unit}</span>
                    </div>
                    {plan.id === 'yearly' && (
                      <p className="text-xs text-muted-foreground mt-1">
                        ≈ ¥{plan.monthlyPrice}/月
                      </p>
                    )}
                    
                    {/* 选中指示器 */}
                    {selectedPlan === plan.id && (
                      <div className="absolute top-3 right-3">
                        <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                          <Check className="w-3 h-3 text-accent-foreground" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* 权益列表 - 紧凑横向 */}
              <div className="bg-secondary/40 rounded-2xl p-4 mb-5">
                <p className="text-xs font-medium text-muted-foreground mb-3">Pro 会员权益</p>
                <div className="grid grid-cols-2 gap-2">
                  {proFeatures.map((feature) => (
                    <div key={feature.label} className="flex items-center gap-2">
                      <feature.icon className="w-4 h-4 text-accent shrink-0" />
                      <span className="text-xs text-foreground">{feature.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 支付方式 */}
              <div className="mb-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">支付方式</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSelectedPayment('alipay')}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-all ${
                      selectedPayment === 'alipay'
                        ? 'border-accent bg-accent/5'
                        : 'border-border bg-card hover:border-muted-foreground/30'
                    }`}
                  >
                    <span className="text-sm">💳</span>
                    <span className={`text-sm ${
                      selectedPayment === 'alipay' ? 'text-accent font-medium' : 'text-foreground'
                    }`}>
                      支付宝
                    </span>
                  </button>
                  <button
                    onClick={() => setSelectedPayment('wechat')}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-all ${
                      selectedPayment === 'wechat'
                        ? 'border-accent bg-accent/5'
                        : 'border-border bg-card hover:border-muted-foreground/30'
                    }`}
                  >
                    <span className="text-sm">💚</span>
                    <span className={`text-sm ${
                      selectedPayment === 'wechat' ? 'text-accent font-medium' : 'text-foreground'
                    }`}>
                      微信支付
                    </span>
                  </button>
                </div>
              </div>

              {/* 协议同意 */}
              <label className="flex items-start gap-2 mb-4 cursor-pointer">
                <div className="relative mt-0.5">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                    agreedToTerms 
                      ? 'bg-accent border-accent' 
                      : 'border-muted-foreground/40 bg-transparent'
                  }`}>
                    {agreedToTerms && <Check className="w-2.5 h-2.5 text-accent-foreground" />}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground leading-relaxed flex-1">
                  我已阅读并同意
                 <Link to="/membership-terms" className="text-primary mx-0.5 hover:underline" onClick={(e) => e.stopPropagation()}>《会员服务协议》</Link>
                  和
                 <Link to="/user-agreement" className="text-primary mx-0.5 hover:underline" onClick={(e) => e.stopPropagation()}>《自动续费协议》</Link>
                </span>
              </label>

              {/* 升级按钮 */}
              <Button
                onClick={handleUpgrade}
                disabled={!agreedToTerms}
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 text-accent-foreground disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-accent/20"
                size="lg"
              >
                <span>立即开通</span>
                <span className="ml-2 px-2 py-0.5 rounded-full bg-accent-foreground/20 text-sm">
                  ¥{currentPlan.price}/{currentPlan.unit}
                </span>
              </Button>

              {/* 底部提示 */}
              <p className="text-center text-xs text-muted-foreground mt-3 pb-safe">
                {selectedPlan === 'yearly' ? '年付更划算，立省 ¥60' : '首月特惠'} · 随时可取消
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default UpgradeModal;