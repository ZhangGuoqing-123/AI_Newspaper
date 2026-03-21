 import { ArrowLeft } from 'lucide-react';
 import { useNavigate } from 'react-router-dom';
 
 const UserAgreementPage = () => {
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
             用户服务协议
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
       </div>
     </div>
   );
 };
 
 export default UserAgreementPage;