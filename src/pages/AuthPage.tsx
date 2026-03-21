import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Lock, User, Smartphone } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import appIcon from '@/assets/app-icon.png';
 
 type AuthMode = 'login' | 'register';
 
 const AuthPage = () => {
   const navigate = useNavigate();
   const [mode, setMode] = useState<AuthMode>('login');
   const [agreedToTerms, setAgreedToTerms] = useState(false);
   
   // Form states
   const [phone, setPhone] = useState('');
   const [verifyCode, setVerifyCode] = useState('');
   const [nickname, setNickname] = useState('');
   const [countdown, setCountdown] = useState(0);
 
   const handleSendCode = () => {
     if (countdown > 0) return;
     // TODO: 发送验证码逻辑
     setCountdown(60);
     const timer = setInterval(() => {
       setCountdown((prev) => {
         if (prev <= 1) {
           clearInterval(timer);
           return 0;
         }
         return prev - 1;
       });
     }, 1000);
   };
 
   const handleSubmit = () => {
     if (!agreedToTerms) return;
     // TODO: 登录/注册逻辑
     navigate('/');
   };
 
   const isFormValid = () => {
     if (!agreedToTerms) return false;
     if (mode === 'login') {
       return phone.length === 11 && verifyCode.length === 6;
     } else {
       return (
         nickname.length >= 2 &&
         phone.length === 11 &&
         verifyCode.length === 6
       );
     }
   };
 
   const handleWeChatLogin = () => {
     // TODO: 接入微信登录SDK
     console.log('WeChat login clicked');
   };
 
   return (
     <div className="min-h-screen bg-background flex flex-col">
       {/* Header */}
       <div className="flex items-center px-4 py-3 border-b border-border">
         <button
           onClick={() => navigate(-1)}
           className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
         >
           <ArrowLeft className="w-5 h-5 text-foreground" />
         </button>
         <h1 className="flex-1 text-center text-lg font-semibold text-foreground pr-10">
           {mode === 'login' ? '登录' : '注册'}
         </h1>
       </div>
 
       <div className="flex-1 px-6 py-8">
          {/* Logo & Welcome */}
          <div className="text-center mb-8">
            <img 
              src={appIcon} 
              alt="硅谷速递" 
              className="w-20 h-20 mx-auto mb-4 rounded-2xl shadow-lg shadow-accent/20"
            />
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {mode === 'login' ? '欢迎使用硅谷速递' : '加入硅谷速递'}
            </h2>
            <p className="text-sm text-muted-foreground">
              开启你的高质信息空间
            </p>
          </div>
 
         <AnimatePresence mode="wait">
           <motion.div
             key={mode}
             initial={{ opacity: 0, x: mode === 'login' ? -20 : 20 }}
             animate={{ opacity: 1, x: 0 }}
             exit={{ opacity: 0, x: mode === 'login' ? 20 : -20 }}
             transition={{ duration: 0.2 }}
           >
             {mode === 'login' ? (
               <div className="space-y-5">
                 {/* Phone Input */}
                 <div className="relative">
                   <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                   <Input
                     type="tel"
                     placeholder="请输入手机号"
                     value={phone}
                     onChange={(e) => setPhone(e.target.value)}
                     className="pl-12 h-12 rounded-xl border-border bg-secondary/50"
                     maxLength={11}
                   />
                 </div>
 
                 {/* Verify Code */}
                 <div className="flex gap-3">
                   <div className="relative flex-1">
                     <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                     <Input
                       type="text"
                       placeholder="验证码"
                       value={verifyCode}
                       onChange={(e) => setVerifyCode(e.target.value)}
                       className="pl-12 h-12 rounded-xl border-border bg-secondary/50"
                       maxLength={6}
                     />
                   </div>
                   <Button
                     variant="outline"
                     onClick={handleSendCode}
                     disabled={phone.length !== 11 || countdown > 0}
                     className="h-12 px-4 rounded-xl whitespace-nowrap"
                   >
                     {countdown > 0 ? `${countdown}s` : '获取验证码'}
                   </Button>
                 </div>
               </div>
             ) : (
               <div className="space-y-5">
                 {/* Nickname */}
                 <div className="relative">
                   <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                   <Input
                     type="text"
                     placeholder="设置昵称"
                     value={nickname}
                     onChange={(e) => setNickname(e.target.value)}
                     className="pl-12 h-12 rounded-xl border-border bg-secondary/50"
                     maxLength={20}
                   />
                 </div>
 
                 {/* Phone */}
                 <div className="relative">
                   <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                   <Input
                     type="tel"
                     placeholder="请输入手机号"
                     value={phone}
                     onChange={(e) => setPhone(e.target.value)}
                     className="pl-12 h-12 rounded-xl border-border bg-secondary/50"
                     maxLength={11}
                   />
                 </div>
 
                 {/* Verify Code */}
                 <div className="flex gap-3">
                   <div className="relative flex-1">
                     <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                     <Input
                       type="text"
                       placeholder="验证码"
                       value={verifyCode}
                       onChange={(e) => setVerifyCode(e.target.value)}
                       className="pl-12 h-12 rounded-xl border-border bg-secondary/50"
                       maxLength={6}
                     />
                   </div>
                   <Button
                     variant="outline"
                     onClick={handleSendCode}
                     disabled={phone.length !== 11 || countdown > 0}
                     className="h-12 px-4 rounded-xl whitespace-nowrap"
                   >
                     {countdown > 0 ? `${countdown}s` : '获取验证码'}
                   </Button>
                 </div>
               </div>
             )}
           </motion.div>
         </AnimatePresence>
 
         {/* Terms Agreement */}
         <label className="flex items-start gap-3 mt-6 cursor-pointer">
           <Checkbox
             checked={agreedToTerms}
             onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
             className="mt-0.5"
           />
           <span className="text-xs text-muted-foreground leading-relaxed flex-1">
             我已阅读并同意
             <Link to="/user-agreement" className="text-primary mx-0.5 hover:underline">
               《用户服务协议》
             </Link>
             和
             <Link to="/privacy-policy" className="text-primary mx-0.5 hover:underline">
               《隐私政策》
             </Link>
           </span>
         </label>
 
         {/* Submit Button */}
         <Button
           onClick={handleSubmit}
           disabled={!isFormValid()}
           className="w-full h-12 mt-6 text-base font-semibold bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 text-accent-foreground disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-accent/20"
         >
           {mode === 'login' ? '登录' : '注册'}
         </Button>
 
         {/* WeChat Login */}
         <div className="mt-6">
           <div className="relative mb-6">
             <div className="absolute inset-0 flex items-center">
               <div className="w-full border-t border-border" />
             </div>
             <div className="relative flex justify-center text-xs">
               <span className="bg-background px-4 text-muted-foreground">或</span>
             </div>
           </div>
 
           <button
             onClick={handleWeChatLogin}
             className="w-full h-12 flex items-center justify-center gap-3 rounded-xl bg-[#07C160] hover:bg-[#06AD56] text-white font-medium transition-colors"
           >
             <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
               <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.006-.27-.022-.407-.03zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z"/>
             </svg>
             微信登录
           </button>
         </div>
 
         {/* Switch Mode */}
         <div className="text-center mt-6">
           <span className="text-sm text-muted-foreground">
             {mode === 'login' ? '还没有账号？' : '已有账号？'}
           </span>
           <button
             onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
             className="text-sm text-primary font-medium ml-1 hover:underline"
           >
             {mode === 'login' ? '立即注册' : '去登录'}
           </button>
         </div>
       </div>
     </div>
   );
 };
 
 export default AuthPage;