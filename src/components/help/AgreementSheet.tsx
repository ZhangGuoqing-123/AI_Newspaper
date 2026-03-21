 import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
 import { ScrollArea } from '@/components/ui/scroll-area';
 
 type AgreementType = 'user-agreement' | 'privacy-policy' | 'membership-terms';
 
 interface AgreementSheetProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   type: AgreementType | null;
 }
 
 const AgreementSheet = ({ open, onOpenChange, type }: AgreementSheetProps) => {
   const getContent = () => {
     switch (type) {
       case 'user-agreement':
         return {
           title: '用户服务协议',
           content: <UserAgreementContent />
         };
       case 'privacy-policy':
         return {
           title: '隐私政策',
           content: <PrivacyPolicyContent />
         };
       case 'membership-terms':
         return {
           title: '会员服务条款',
           content: <MembershipTermsContent />
         };
       default:
         return { title: '', content: null };
     }
   };
 
   const { title, content } = getContent();
 
   return (
     <Sheet open={open} onOpenChange={onOpenChange}>
       <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl p-0">
         <SheetHeader className="sticky top-0 z-10 bg-background border-b border-border px-5 py-4">
           <SheetTitle className="text-center text-lg font-semibold">{title}</SheetTitle>
         </SheetHeader>
         <ScrollArea className="h-[calc(85vh-60px)]">
           <div className="px-5 py-6">
             {content}
           </div>
         </ScrollArea>
       </SheetContent>
     </Sheet>
   );
 };
 
 // 用户服务协议内容
 const UserAgreementContent = () => (
   <div className="prose prose-sm dark:prose-invert max-w-none">
     <p className="text-muted-foreground text-sm mb-6">
       更新日期：2024年1月1日 | 生效日期：2024年1月1日
     </p>
 
     <section className="mb-8">
       <h2 className="text-lg font-semibold text-foreground mb-3">一、服务条款的确认</h2>
       <p className="text-sm text-muted-foreground leading-relaxed mb-3">
         欢迎使用「硅谷速递」服务。在使用本服务之前，请您仔细阅读本协议的全部内容。如果您对本协议的任何条款有疑问，请通过客服渠道进行询问。
       </p>
       <p className="text-sm text-muted-foreground leading-relaxed">
         当您点击"同意"或以其他方式确认接受本协议，即表示您已充分阅读、理解并同意接受本协议的全部内容，本协议即在您与硅谷速递之间产生法律效力。
       </p>
     </section>
 
     <section className="mb-8">
       <h2 className="text-lg font-semibold text-foreground mb-3">二、服务内容</h2>
       <p className="text-sm text-muted-foreground leading-relaxed mb-3">
         硅谷速递是一款信息聚合与智能分析服务平台，主要提供以下服务：
       </p>
       <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
         <li>海外科技资讯的聚合与推送</li>
         <li>AI智能内容分析与总结</li>
         <li>多语言内容翻译服务</li>
         <li>个性化信息源订阅管理</li>
         <li>其他相关增值服务</li>
       </ul>
     </section>
 
     <section className="mb-8">
       <h2 className="text-lg font-semibold text-foreground mb-3">三、用户账号</h2>
       <p className="text-sm text-muted-foreground leading-relaxed mb-3">
         3.1 您需要注册账号才能使用本服务的全部功能。注册时，您应提供真实、准确、完整的个人资料。
       </p>
       <p className="text-sm text-muted-foreground leading-relaxed mb-3">
         3.2 您有责任妥善保管账号信息和密码安全，因您个人原因导致的账号密码泄露所造成的损失由您自行承担。
       </p>
       <p className="text-sm text-muted-foreground leading-relaxed">
         3.3 如发现账号被盗用或存在其他安全问题，您应立即通知我们。
       </p>
     </section>
 
     <section className="mb-8">
       <h2 className="text-lg font-semibold text-foreground mb-3">四、用户行为规范</h2>
       <p className="text-sm text-muted-foreground leading-relaxed mb-3">
         您在使用本服务时，应遵守以下规范：
       </p>
       <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
         <li>遵守中华人民共和国相关法律法规</li>
         <li>不得利用本服务从事任何违法违规活动</li>
         <li>不得干扰或破坏本服务的正常运行</li>
         <li>不得侵犯他人的合法权益</li>
         <li>不得传播违法、有害信息</li>
       </ul>
     </section>
 
     <section className="mb-8">
       <h2 className="text-lg font-semibold text-foreground mb-3">五、知识产权</h2>
       <p className="text-sm text-muted-foreground leading-relaxed mb-3">
         5.1 本服务中的所有内容，包括但不限于文字、图片、音频、视频、软件、程序、版面设计等，均受著作权法和其他知识产权法律法规的保护。
       </p>
       <p className="text-sm text-muted-foreground leading-relaxed">
         5.2 未经我们书面许可，您不得以任何方式使用、复制、修改、传播上述内容。
       </p>
     </section>
 
     <section className="mb-8">
       <h2 className="text-lg font-semibold text-foreground mb-3">六、服务的变更与终止</h2>
       <p className="text-sm text-muted-foreground leading-relaxed mb-3">
         6.1 我们有权根据业务发展需要，对服务内容进行调整或变更。
       </p>
       <p className="text-sm text-muted-foreground leading-relaxed">
         6.2 如您违反本协议的任何条款，我们有权暂停或终止向您提供服务。
       </p>
     </section>
 
     <section className="mb-8">
       <h2 className="text-lg font-semibold text-foreground mb-3">七、免责声明</h2>
       <p className="text-sm text-muted-foreground leading-relaxed mb-3">
         7.1 本服务聚合的第三方内容仅供参考，我们不对其准确性、完整性或时效性作任何保证。
       </p>
       <p className="text-sm text-muted-foreground leading-relaxed">
         7.2 因不可抗力或系统故障导致的服务中断，我们不承担责任。
       </p>
     </section>
 
     <section className="mb-8">
       <h2 className="text-lg font-semibold text-foreground mb-3">八、联系我们</h2>
       <p className="text-sm text-muted-foreground leading-relaxed">
         如您对本协议有任何疑问，请通过以下方式联系我们：<br />
         邮箱：support@guigusudi.com<br />
         客服热线：400-XXX-XXXX
       </p>
     </section>
   </div>
 );
 
 // 隐私政策内容
 const PrivacyPolicyContent = () => (
   <div className="prose prose-sm dark:prose-invert max-w-none">
     <p className="text-muted-foreground text-sm mb-6">
       更新日期：2024年1月1日 | 生效日期：2024年1月1日
     </p>
 
     <section className="mb-8">
       <h2 className="text-lg font-semibold text-foreground mb-3">引言</h2>
       <p className="text-sm text-muted-foreground leading-relaxed">
         硅谷速递（以下简称"我们"）深知个人信息对您的重要性，我们将按照法律法规的规定，保护您的个人信息及隐私安全。我们制定本隐私政策并特别提示：希望您在使用我们的产品和服务前仔细阅读并理解本隐私政策。
       </p>
     </section>
 
     <section className="mb-8">
       <h2 className="text-lg font-semibold text-foreground mb-3">一、我们收集的信息</h2>
       <p className="text-sm text-muted-foreground leading-relaxed mb-3">
         在您使用我们的服务时，我们可能会收集以下信息：
       </p>
       <h3 className="text-base font-medium text-foreground mb-2">1.1 您提供的信息</h3>
       <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground mb-4">
         <li>账号信息：手机号码、邮箱地址、用户名、密码</li>
         <li>个人资料：头像、昵称、个人简介</li>
         <li>支付信息：用于会员订阅的支付账号信息</li>
       </ul>
       <h3 className="text-base font-medium text-foreground mb-2">1.2 自动收集的信息</h3>
       <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
         <li>设备信息：设备型号、操作系统、唯一设备标识符</li>
         <li>日志信息：访问时间、浏览记录、搜索记录</li>
         <li>位置信息：IP地址（用于提供本地化服务）</li>
       </ul>
     </section>
 
     <section className="mb-8">
       <h2 className="text-lg font-semibold text-foreground mb-3">二、信息使用目的</h2>
       <p className="text-sm text-muted-foreground leading-relaxed mb-3">
         我们收集您的信息用于以下目的：
       </p>
       <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
         <li>提供、维护和改进我们的服务</li>
         <li>个性化您的使用体验，推荐您可能感兴趣的内容</li>
         <li>处理您的会员订阅和支付</li>
         <li>向您发送服务通知和推送消息</li>
         <li>进行数据分析以改进产品</li>
         <li>保障服务安全，防止欺诈行为</li>
       </ul>
     </section>
 
     <section className="mb-8">
       <h2 className="text-lg font-semibold text-foreground mb-3">三、信息共享与披露</h2>
       <p className="text-sm text-muted-foreground leading-relaxed mb-3">
         3.1 我们不会将您的个人信息出售给第三方。
       </p>
       <p className="text-sm text-muted-foreground leading-relaxed mb-3">
         3.2 在以下情况下，我们可能会共享您的信息：
       </p>
       <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
         <li>获得您的明确同意后</li>
         <li>为完成支付需要与支付服务商共享必要信息</li>
         <li>根据法律法规的要求或政府部门的强制性要求</li>
         <li>为保护我们或用户的权益、财产或安全</li>
       </ul>
     </section>
 
     <section className="mb-8">
       <h2 className="text-lg font-semibold text-foreground mb-3">四、信息安全</h2>
       <p className="text-sm text-muted-foreground leading-relaxed mb-3">
         4.1 我们采用业界标准的安全技术和管理措施来保护您的个人信息，包括但不限于：
       </p>
       <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
         <li>数据传输加密（SSL/TLS）</li>
         <li>敏感数据存储加密</li>
         <li>访问权限控制</li>
         <li>安全审计和监控</li>
       </ul>
     </section>
 
     <section className="mb-8">
       <h2 className="text-lg font-semibold text-foreground mb-3">五、您的权利</h2>
       <p className="text-sm text-muted-foreground leading-relaxed mb-3">
         根据适用的法律法规，您享有以下权利：
       </p>
       <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
         <li><strong>访问权</strong>：您可以访问和查看您的个人信息</li>
         <li><strong>更正权</strong>：您可以修改不准确的个人信息</li>
         <li><strong>删除权</strong>：您可以请求删除您的个人信息</li>
         <li><strong>撤回同意</strong>：您可以撤回之前给予的同意</li>
         <li><strong>注销账号</strong>：您可以申请注销您的账号</li>
       </ul>
     </section>
 
     <section className="mb-8">
       <h2 className="text-lg font-semibold text-foreground mb-3">六、Cookie 使用</h2>
       <p className="text-sm text-muted-foreground leading-relaxed">
         我们使用 Cookie 和类似技术来改善您的用户体验，包括记住您的登录状态、分析使用情况等。您可以通过浏览器设置管理 Cookie，但禁用 Cookie 可能影响某些功能的正常使用。
       </p>
     </section>
 
     <section className="mb-8">
       <h2 className="text-lg font-semibold text-foreground mb-3">七、未成年人保护</h2>
       <p className="text-sm text-muted-foreground leading-relaxed">
         我们非常重视未成年人的隐私保护。如果您是未满18周岁的未成年人，请在监护人的陪同下阅读本政策，并在取得监护人同意后使用我们的服务。
       </p>
     </section>
 
     <section className="mb-8">
       <h2 className="text-lg font-semibold text-foreground mb-3">八、政策更新</h2>
       <p className="text-sm text-muted-foreground leading-relaxed">
         我们可能会不时更新本隐私政策。更新后的政策将在本页面发布，重大变更时我们会通过应用内通知或其他方式告知您。
       </p>
     </section>
 
     <section className="mb-8">
       <h2 className="text-lg font-semibold text-foreground mb-3">九、联系我们</h2>
       <p className="text-sm text-muted-foreground leading-relaxed">
         如您对本隐私政策有任何疑问或建议，请通过以下方式联系我们：<br />
         邮箱：privacy@guigusudi.com<br />
         客服热线：400-XXX-XXXX
       </p>
     </section>
   </div>
 );
 
 // 会员服务条款内容
 const MembershipTermsContent = () => (
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
 );
 
 export default AgreementSheet;