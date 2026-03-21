 import { ArrowLeft } from 'lucide-react';
 import { useNavigate } from 'react-router-dom';
 
 const PrivacyPolicyPage = () => {
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
             隐私政策
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
       </div>
     </div>
   );
 };
 
 export default PrivacyPolicyPage;