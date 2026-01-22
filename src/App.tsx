import { Toaster } from "@/components/ui/toaster";
// Added AcademicTranscript route
import { lazy, Suspense } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/auth";
import { CartProvider } from "@/contexts/CartContext";
import { OnboardingWizard } from "@/components/OnboardingWizard";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import About from "./pages/About";
import ForStreamers from "./pages/ForStreamers";
import ForBrands from "./pages/ForBrands";
import HowItWorks from "./pages/HowItWorks";
import Platform from "./pages/Platform";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Contact from "./pages/Contact";
import { Navigate } from "react-router-dom";
import Affiliates from "./pages/Affiliates";
import VIP from "./pages/VIP";
import Sales from "./pages/Sales";
import Shop from "./pages/Shop";
import Academy from "./pages/Academy";
import Checkout from "./pages/Checkout";
import ProductSalesPage from "./pages/ProductSalesPage";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import AdminPage from "./pages/admin";
import ScrollToTop from "./components/ScrollToTop";
import ScrollToTopButton from "./components/ScrollToTopButton";
// VIP Pages
import VIPLayout from "./pages/vip/VIPLayout";
import VIPDashboard from "./pages/vip/VIPDashboard";
import VIPShop from "./pages/vip/VIPShop";
import VIPCart from "./pages/vip/VIPCart";
import VIPCheckout from "./pages/vip/VIPCheckout";
import VIPRewards from "./pages/vip/VIPRewards";
import VIPHistory from "./pages/vip/VIPHistory";
import VIPReferrals from "./pages/vip/VIPReferrals";
import VIPProfile from "./pages/vip/VIPProfile";
import VIPAffiliateRegister from "./pages/vip/VIPAffiliateRegister";
import VIPAffiliatePayment from "./pages/vip/VIPAffiliatePayment";
import VIPAffiliateProducts from "./pages/vip/VIPAffiliateProducts";
import VIPPerformance from "./pages/vip/VIPPerformance";
import VIPInvites from "./pages/vip/VIPInvites";
import VIPMyProducts from "./pages/vip/VIPMyProducts";
import VIPMaterials from "./pages/vip/VIPMaterials";
import VIPWithdrawals from "./pages/vip/VIPWithdrawals";
import VIPBankSettings from "./pages/vip/VIPBankSettings";
import VIPCreator from "./pages/vip/VIPCreator";
import VIPCreatorProductEditor from "./pages/vip/VIPCreatorProductEditor";
import VIPCreatorUpgrade from "./pages/vip/VIPCreatorUpgrade";
import VIPStorageManager from "./pages/vip/VIPStorageManager";
import VIPProfileEdit from "./pages/vip/VIPProfileEdit";
import VIPSlidesCreator from "./pages/vip/VIPSlidesCreator";
import VIPPresentationShare from "./pages/vip/VIPPresentationShare";
import VIPBilling from "./pages/vip/VIPBilling";
import { VIPAffiliatePanel, VIPActionHistory, VIPRewardStore, VIPRanking, VIPNotifications } from "./pages/vip/panel";
import AffiliateAccept from "./pages/AffiliateAccept";
// Members Area Pages
import MemberLayout from "./pages/members/MemberLayout";
import MemberDashboard from "./pages/members/MemberDashboard";
import MyCourses from "./pages/members/MyCourses";
import CourseViewer from "./pages/members/CourseViewer";
import Certificates from "./pages/members/Certificates";
import CertificateView from "./pages/members/CertificateView";
import MemberProgress from "./pages/members/MemberProgress";
import Community from "./pages/members/Community";
import MemberSettings from "./pages/members/MemberSettings";
import MemberProfile from "./pages/members/MemberProfile";
import ExamsList from "./pages/members/ExamsList";
import ExamPlayer from "./pages/members/ExamPlayer";
import VerifyCertificate from "./pages/members/VerifyCertificate";
import AcademicTranscript from "./pages/members/AcademicTranscript";
import StudentPerformanceReport from "./pages/members/StudentPerformanceReport";
import SimulatorPlayer from "./pages/members/SimulatorPlayer";
import VIPSimulators from "./pages/vip/VIPSimulators";
import VIPCertificates from "./pages/vip/VIPCertificates";
import VIPNetwork from "./pages/vip/VIPNetwork";
import VIPPublicProfile from "./pages/vip/VIPPublicProfile";
import VIPBlog from "./pages/vip/VIPBlog";
import VIPYouTube from "./pages/vip/VIPYouTube";
import MyFilesHybrid from "./pages/members/MyFilesHybrid";
import GoogleDriveCallback from "./pages/members/GoogleDriveCallback";
import UnifiedFiles from "./pages/UnifiedFiles";
// Video Pages (Internal System)
import ShortsPage from "./pages/ShortsPage";
import LiveCreatePage from "./pages/LiveCreatePage";
import LivePage from "./pages/LivePage";
import VideoPage from "./pages/VideoPage";
import VideoUploadPage from "./pages/VideoUploadPage";
// Stripe Connect Pages
import ConnectOnboarding from "./pages/connect/ConnectOnboarding";
import ConnectProducts from "./pages/connect/ConnectProducts";
import Storefront from "./pages/connect/Storefront";
// Payment Pages
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCanceled from "./pages/PaymentCanceled";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <OnboardingWizard />
          <BrowserRouter>
            <ScrollToTop />
            <ScrollToTopButton />
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/admin" element={<AdminPage />} />
              
              {/* Unified Files Route - accessible to all logged-in users */}
              <Route path="/files" element={<UnifiedFiles />} />
              <Route path="/drive-callback" element={<GoogleDriveCallback />} />
              
              {/* Video Routes (Internal System) */}
              <Route path="/shorts" element={<ShortsPage />} />
              <Route path="/live/create" element={<LiveCreatePage />} />
              <Route path="/live/:id" element={<LivePage />} />
              <Route path="/videos/:id" element={<VideoPage />} />
              <Route path="/videos/upload" element={<VideoUploadPage />} />
              
              {/* VIP Area Routes with Layout */}
              <Route path="/vip" element={<VIPLayout />}>
                <Route index element={<VIPDashboard />} />
                <Route path="dashboard" element={<VIPDashboard />} />
                <Route path="shop" element={<VIPShop />} />
                <Route path="cart" element={<VIPCart />} />
                <Route path="checkout" element={<VIPCheckout />} />
                <Route path="rewards" element={<VIPRewards />} />
                <Route path="history" element={<VIPHistory />} />
                <Route path="referrals" element={<VIPReferrals />} />
                <Route path="profile" element={<VIPProfile />} />
                <Route path="affiliate/register" element={<VIPAffiliateRegister />} />
                <Route path="affiliate/payment" element={<VIPAffiliatePayment />} />
                <Route path="affiliate/products" element={<VIPAffiliateProducts />} />
                <Route path="performance" element={<VIPPerformance />} />
                <Route path="invites" element={<VIPInvites />} />
                <Route path="my-products" element={<VIPMyProducts />} />
                <Route path="materials" element={<VIPMaterials />} />
                <Route path="withdrawals" element={<VIPWithdrawals />} />
                <Route path="bank-settings" element={<VIPBankSettings />} />
                {/* VIP Creator Module */}
                <Route path="creator" element={<VIPCreator />} />
                <Route path="creator/new-product" element={<VIPCreatorProductEditor />} />
                <Route path="creator/edit/:productId" element={<VIPCreatorProductEditor />} />
                <Route path="creator-upgrade" element={<VIPCreatorUpgrade />} />
                {/* Storage Manager */}
                <Route path="storage" element={<VIPStorageManager />} />
                {/* Profile Edit (LinkedIn-like) */}
                <Route path="profile/edit" element={<VIPProfileEdit />} />
                {/* VIP Slides Creator (Canva-like with AI) */}
                <Route path="slides" element={<VIPSlidesCreator />} />
                <Route path="billing" element={<VIPBilling />} />
                <Route path="simulators" element={<VIPSimulators />} />
                <Route path="certificates" element={<VIPCertificates />} />
                {/* VIP Network - Social */}
                <Route path="network" element={<VIPNetwork />} />
                <Route path="network/home" element={<VIPNetwork />} />
                <Route path="network/explore" element={<VIPNetwork />} />
                <Route path="network/shorts" element={<VIPNetwork />} />
                <Route path="network/lives" element={<VIPNetwork />} />
                <Route path="network/live" element={<VIPNetwork />} />
                <Route path="network/library" element={<VIPNetwork />} />
                <Route path="network/history" element={<VIPNetwork />} />
                <Route path="network/playlists" element={<VIPNetwork />} />
                <Route path="network/liked" element={<VIPNetwork />} />
                <Route path="network/saved" element={<VIPNetwork />} />
                <Route path="network/trending" element={<VIPNetwork />} />
                <Route path="network/popular" element={<VIPNetwork />} />
                <Route path="network/music" element={<VIPNetwork />} />
                <Route path="network/games" element={<VIPNetwork />} />
                <Route path="network/sports" element={<VIPNetwork />} />
                <Route path="network/education" element={<VIPNetwork />} />
                <Route path="network/news" element={<VIPNetwork />} />
                <Route path="network/following" element={<VIPNetwork />} />
                <Route path="network/settings" element={<VIPNetwork />} />
                <Route path="network/profile/:affiliateId" element={<VIPPublicProfile />} />
                <Route path="network/blog" element={<VIPBlog />} />
                <Route path="network/youtube" element={<VIPYouTube />} />
                {/* VIP Affiliate Panel Module */}
                <Route path="panel" element={<VIPAffiliatePanel />} />
                <Route path="panel/history" element={<VIPActionHistory />} />
                <Route path="panel/store" element={<VIPRewardStore />} />
                <Route path="panel/ranking" element={<VIPRanking />} />
                <Route path="panel/notifications" element={<VIPNotifications />} />
                <Route path="share/:token" element={<VIPPresentationShare />} />
              </Route>
              
              {/* Members Area Routes with Layout */}
              <Route path="/members" element={<MemberLayout />}>
                <Route index element={<MemberDashboard />} />
                <Route path="courses" element={<MyCourses />} />
                <Route path="courses/:productId" element={<CourseViewer />} />
                <Route path="courses/:productId/:lessonId" element={<CourseViewer />} />
                <Route path="certificates" element={<Certificates />} />
                <Route path="certificate/:productId" element={<CertificateView />} />
                <Route path="progress" element={<MemberProgress />} />
                <Route path="performance" element={<StudentPerformanceReport />} />
                <Route path="transcript" element={<AcademicTranscript />} />
                <Route path="transcript/:productId" element={<AcademicTranscript />} />
                <Route path="community" element={<Community />} />
                <Route path="settings" element={<MemberSettings />} />
                <Route path="profile" element={<MemberProfile />} />
                <Route path="exams" element={<ExamsList />} />
                <Route path="exams/:examId/play/:attemptId" element={<ExamPlayer />} />
                <Route path="simulator/:simulatorId" element={<SimulatorPlayer />} />
                <Route path="files" element={<MyFilesHybrid />} />
                <Route path="drive-callback" element={<GoogleDriveCallback />} />
              </Route>
              
              {/* Public Certificate Verification */}
              <Route path="/verificar-certificado/:code" element={<VerifyCertificate />} />
              
              {/* Public Routes */}
              <Route element={<Layout><Home /></Layout>} path="/" />
              <Route path="/sobre" element={<Layout><About /></Layout>} />
              <Route path="/streamers" element={<Layout><ForStreamers /></Layout>} />
              <Route path="/empresas" element={<Layout><ForBrands /></Layout>} />
              <Route path="/como-funciona" element={<Layout><HowItWorks /></Layout>} />
              <Route path="/plataforma" element={<Layout><Platform /></Layout>} />
              <Route path="/academy" element={<Layout><Academy /></Layout>} />
              <Route path="/afiliados" element={<Layout><Affiliates /></Layout>} />
              <Route path="/blog" element={<Layout><Blog /></Layout>} />
              <Route path="/blog/:slug" element={<Layout><BlogPost /></Layout>} />
              <Route path="/contato" element={<Layout><Contact /></Layout>} />
              <Route path="/vendas" element={<Layout><Sales /></Layout>} />
              <Route path="/loja" element={<Layout><Shop /></Layout>} />
              <Route path="/checkout" element={<Layout><Checkout /></Layout>} />
              {/* Product Sales Page - Individual product pages */}
              <Route path="/produto/:slug" element={<ProductSalesPage />} />
              <Route path="/venda/:slug" element={<ProductSalesPage />} />
              {/* Admin Preview Route - allows viewing draft products */}
              <Route path="/preview/:slug" element={<ProductSalesPage />} />
              <Route path="/affiliate/accept" element={<AffiliateAccept />} />
              {/* Payment Pages */}
              <Route path="/sucesso" element={<PaymentSuccess />} />
              <Route path="/cancelado" element={<PaymentCanceled />} />
              {/* Stripe Connect Routes */}
              <Route path="/connect/onboarding" element={<ConnectOnboarding />} />
              <Route path="/connect/products" element={<ConnectProducts />} />
              <Route path="/store/:accountId" element={<Storefront />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
