import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ResearchPage from "./pages/ResearchPage";
import TrendsPage from "./pages/TrendsPage";
import TopicDetailPage from "./pages/TopicDetailPage";
import Index from "./pages/Index";
import FeedPage from "./pages/FeedPage";
import BroadcastPage from "./pages/BroadcastPage";
import ProfilePage from "./pages/ProfilePage";
import ArticleDetailPage from "./pages/ArticleDetailPage";
import FavoritesPage from "./pages/FavoritesPage";
import AddSourcePage from "./pages/AddSourcePage";
import PushSettingsPage from "./pages/PushSettingsPage";
import HelpPage from "./pages/HelpPage";
 import AuthPage from "./pages/AuthPage";
 import UserAgreementPage from "./pages/UserAgreementPage";
 import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
 import MembershipTermsPage from "./pages/MembershipTermsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* 改造为「研究」对话页 = agent 本体，是新的首页/产品中心 */}
          <Route path="/" element={<ResearchPage />} />
          <Route path="/trends" element={<TrendsPage />} />
          <Route path="/topic" element={<TopicDetailPage />} />
          {/* 旧首页/信息流/播报页保留路由（不进底部导航），便于对照旧版或后续复用其内部组件 */}
          <Route path="/old-home" element={<Index />} />
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/discover" element={<FeedPage defaultTab="发现" />} />
          <Route path="/following" element={<FeedPage defaultTab="关注" />} />
          <Route path="/broadcast" element={<BroadcastPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/article/:id" element={<ArticleDetailPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/add-source" element={<AddSourcePage />} />
          <Route path="/settings/push" element={<PushSettingsPage />} />
          <Route path="/help" element={<HelpPage />} />
           <Route path="/auth" element={<AuthPage />} />
           <Route path="/user-agreement" element={<UserAgreementPage />} />
           <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
           <Route path="/membership-terms" element={<MembershipTermsPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
