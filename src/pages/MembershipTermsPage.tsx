 import { ArrowLeft } from 'lucide-react';
 import { useNavigate } from 'react-router-dom';
 
 const MembershipTermsPage = () => {
   const navigate = useNavigate();
 
   return (
     <div className="min-h-screen bg-background">
       {/* Header */}
       <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
         <div className="flex items-center px-4 py-3">
           <button
             onClick={() => navigate(-1)}
             className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
           >
             <ArrowLeft className="w-5 h-5 text-foreground" />
           </button>
           <h1 className="flex-1 text-center text-lg font-semibold text-foreground pr-10">
             会员服务协议
           </h1>
         </div>
       </div>
 
       {/* Content */}
       <div className="px-5 py-6 max-w-2xl mx-auto">
         <div className="prose prose-sm dark:prose-invert max-w-none">
           <p className="text-muted-foreground text-sm mb-6">
             更新日期：2024年1月1日 | 生效日期：2024年1月1日
           </p>
 
           <section className="mb-8">
             <h2 className="text-lg font-semibold text-foreground mb-3">一、服务说明</h2>
             <p className="text-sm text-muted-foreground leading-relaxed mb-3">
               硅谷速递 Pro 会员服务（以下简称"会员服务"）是硅谷速递为用户提供的增值服务。购买会员后，您将享有以下专属权益：
             </p>
             <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
               <li><strong>信息源扩容</strong>：可关注最多100个信息源（免费版20个）</li>
               <li><strong>AI智能分析</strong>：获取AI生成的文章摘要和深度分析</li>
               <li><strong>优先推送</strong>：享受更快的内容更新和推送通知</li>
               <li><strong>专属客服</strong>：获得专属客服支持服务</li>
             </ul>
           </section>
 
           <section className="mb-8">
             <h2 className="text-lg font-semibold text-foreground mb-3">二、会员价格</h2>
             <div className="bg-secondary/50 rounded-xl p-4 mb-4">
               <div className="flex justify-between items-center mb-3 pb-3 border-b border-border">
                 <span className="text-sm font-medium text-foreground">月付套餐</span>
                 <span className="text-lg font-bold text-foreground">¥19/月</span>
               </div>
               <div className="flex justify-between items-center">
                 <div>
                   <span className="text-sm font-medium text-foreground">年付套餐</span>
                   <span className="ml-2 px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-xs">省30%</span>
                 </div>
                 <span className="text-lg font-bold text-foreground">¥168/年</span>
               </div>
             </div>
             <p className="text-sm text-muted-foreground leading-relaxed">
               实际价格以购买页面显示为准，我们可能会不定期推出优惠活动。
             </p>
           </section>
 
           <section className="mb-8">
             <h2 className="text-lg font-semibold text-foreground mb-3">三、自动续费说明</h2>
             <p className="text-sm text-muted-foreground leading-relaxed mb-3">
               3.1 如您开通自动续费服务，将在会员到期前24小时内自动从您的支付账户扣款，以延续会员服务。
             </p>
             <p className="text-sm text-muted-foreground leading-relaxed mb-3">
               3.2 自动续费价格以续费时的标准价格为准。
             </p>
             <p className="text-sm text-muted-foreground leading-relaxed mb-3">
               3.3 您可以随时在"我的-会员中心"取消自动续费服务，取消后当前会员期限内的权益不受影响。
             </p>
             <p className="text-sm text-muted-foreground leading-relaxed">
               3.4 取消自动续费的具体路径：我的 → 会员中心 → 管理订阅 → 关闭自动续费
             </p>
           </section>
 
           <section className="mb-8">
             <h2 className="text-lg font-semibold text-foreground mb-3">四、退款政策</h2>
             <p className="text-sm text-muted-foreground leading-relaxed mb-3">
               4.1 会员服务属于虚拟商品，一经开通即时生效，原则上不支持退款。
             </p>
             <p className="text-sm text-muted-foreground leading-relaxed mb-3">
               4.2 如遇以下情况，我们将协助处理退款：
             </p>
             <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
               <li>系统错误导致的重复扣款</li>
               <li>购买后72小时内未使用任何会员权益</li>
               <li>会员服务严重故障无法正常使用超过7天</li>
             </ul>
           </section>
 
           <section className="mb-8">
             <h2 className="text-lg font-semibold text-foreground mb-3">五、会员权益变更</h2>
             <p className="text-sm text-muted-foreground leading-relaxed mb-3">
               5.1 我们有权根据业务发展需要，对会员权益内容进行调整。
             </p>
             <p className="text-sm text-muted-foreground leading-relaxed mb-3">
               5.2 权益调整将提前通知，对已购买会员的用户，在当前有效期内保持原有权益。
             </p>
             <p className="text-sm text-muted-foreground leading-relaxed">
               5.3 如权益调整对您产生重大不利影响，您有权选择不续费。
             </p>
           </section>
 
           <section className="mb-8">
             <h2 className="text-lg font-semibold text-foreground mb-3">六、账号与会员</h2>
             <p className="text-sm text-muted-foreground leading-relaxed mb-3">
               6.1 会员权益与账号绑定，不可转让或赠送。
             </p>
             <p className="text-sm text-muted-foreground leading-relaxed mb-3">
               6.2 如账号因违规被封禁，会员权益同时终止，不予退款。
             </p>
             <p className="text-sm text-muted-foreground leading-relaxed">
               6.3 账号注销后，会员权益自动失效。
             </p>
           </section>
 
           <section className="mb-8">
             <h2 className="text-lg font-semibold text-foreground mb-3">七、服务保障</h2>
             <p className="text-sm text-muted-foreground leading-relaxed mb-3">
               7.1 我们承诺会员服务的可用性不低于99.5%（按月计算）。
             </p>
             <p className="text-sm text-muted-foreground leading-relaxed">
               7.2 如因我们原因导致服务中断超过24小时，将按比例延长会员有效期。
             </p>
           </section>
 
           <section className="mb-8">
             <h2 className="text-lg font-semibold text-foreground mb-3">八、争议解决</h2>
             <p className="text-sm text-muted-foreground leading-relaxed">
               如您对会员服务有任何疑问或争议，请优先联系我们的客服团队。如协商无法解决，双方同意提交至服务提供方所在地有管辖权的人民法院诉讼解决。
             </p>
           </section>
 
           <section className="mb-8">
             <h2 className="text-lg font-semibold text-foreground mb-3">九、联系方式</h2>
             <p className="text-sm text-muted-foreground leading-relaxed">
               会员服务咨询：<br />
               邮箱：vip@guigusudi.com<br />
               客服热线：400-XXX-XXXX<br />
               服务时间：工作日 9:00-18:00
             </p>
           </section>
         </div>
       </div>
     </div>
   );
 };
 
 export default MembershipTermsPage;