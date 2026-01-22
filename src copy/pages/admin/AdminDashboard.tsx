import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Mail, 
  Settings, 
  Users, 
  LogOut,
  Shield,
  FileText,
  UserCog,
  MessagesSquare,
  Server,
  Send,
  Brain,
  Database,
  Zap,
  Globe,
  Crown,
  Gift,
  Wallet,
  Package,
  DollarSign,
  Trophy,
  CreditCard,
  Banknote,
  Menu,
  X,
  Percent,
  GraduationCap,
  Award,
  ClipboardCheck,
  FileSpreadsheet,
  FolderOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/auth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import AdminOverview from './components/AdminOverview';
import ContactMessages from './components/ContactMessages';
import EmailManager from './components/EmailManager';
import ESPManager from './components/ESPManager';
import CampaignManagerNew from './components/CampaignManagerNew';
import SystemStatus from './components/SystemStatus';
import AuditLogs from './components/AuditLogs';
import AccountSettings from './components/AccountSettings';
import ChatManager from './components/ChatManager';
import AIAssistant from './components/AIAssistant';
import { AIModeManager } from './components/AIModeManager';
import DatabaseManager from './components/DatabaseManager';
import AutomationManager from './components/AutomationManager';
import SocialPublishing from './components/SocialPublishing';
import VIPAffiliatesManager from './components/VIPAffiliatesManager';
import RewardsManager from './components/RewardsManager';
import PayoutsManager from './components/PayoutsManager';
import CommissionTracking from './components/CommissionTracking';
import GamificationManager from './components/GamificationManager';
import ProductCatalogManager from './components/ProductCatalogManager';
import { StripeHealthDashboard } from './components/StripeHealthDashboard';
import { StripeRuntimeAuthority } from './components/StripeRuntimeAuthority';
import TeamMembersManager from './components/TeamMembersManager';
import AdminWithdrawalsManager from './components/AdminWithdrawalsManager';
import CustomerManager from './components/CustomerManager';
import PlatformCommissionSettings from './components/PlatformCommissionSettings';
import AffiliateProgramManager from './components/AffiliateProgramManager';
import MLMStructurePanel from './components/MLMStructurePanel';
import { CertificationManager, ExamManager, ComplianceManager, EducationImpactDashboard } from './components/finance';
import SubscriptionsManager from './components/SubscriptionsManager';
import EvaluationsManager from './components/EvaluationsManager';
import CompanySettings from './components/CompanySettings';
import UnifiedCertificationManager from './components/UnifiedCertificationManager';

type TabType = 'overview' | 'messages' | 'chat' | 'database' | 'team' | 'customers' | 'certifications' | 'exams' | 'evaluations' | 'compliance' | 'education-impact' | 'company' | 'vip' | 'commissions' | 'commission-settings' | 'affiliate-programs' | 'mlm-structure' | 'gamification' | 'products' | 'rewards' | 'payouts' | 'withdrawals' | 'subscriptions' | 'stripe' | 'ai-modes' | 'automations' | 'social' | 'emails' | 'esp' | 'campaigns' | 'system' | 'audit' | 'account';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    await signOut();
    toast({
      title: 'Até logo!',
      description: 'Você saiu do painel administrativo.',
    });
    navigate('/');
  };

  const tabs = [
    { id: 'overview' as TabType, label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'team' as TabType, label: 'Equipe', icon: Users },
    { id: 'customers' as TabType, label: 'Clientes', icon: UserCog },
    { id: 'messages' as TabType, label: 'Contatos', icon: MessageSquare },
    { id: 'chat' as TabType, label: 'Chat ao Vivo', icon: MessagesSquare },
    { id: 'database' as TabType, label: 'Banco de Dados', icon: Database },
    { id: 'products' as TabType, label: 'Catálogo Produtos', icon: Package },
    { id: 'certifications' as TabType, label: 'Sistema Certificação', icon: GraduationCap, highlight: true },
    { id: 'compliance' as TabType, label: 'Compliance', icon: Shield },
    { id: 'compliance' as TabType, label: 'Compliance', icon: Shield },
    { id: 'company' as TabType, label: 'Empresa', icon: Settings },
    { id: 'vip' as TabType, label: 'Afiliados VIP', icon: Crown },
    { id: 'affiliate-programs' as TabType, label: 'Programas Afiliação', icon: Users },
    { id: 'mlm-structure' as TabType, label: 'Estrutura MLM', icon: Crown },
    { id: 'commissions' as TabType, label: 'Histórico Comissões', icon: DollarSign },
    { id: 'commission-settings' as TabType, label: 'Config. Comissões', icon: Percent },
    { id: 'gamification' as TabType, label: 'Gamificação', icon: Trophy },
    { id: 'rewards' as TabType, label: 'Recompensas', icon: Gift },
    { id: 'payouts' as TabType, label: 'PIX/Pagamentos', icon: Wallet },
    { id: 'withdrawals' as TabType, label: 'Saques Afiliados', icon: Banknote },
    { id: 'subscriptions' as TabType, label: 'Assinaturas', icon: CreditCard, highlight: true },
    { id: 'stripe' as TabType, label: 'Stripe Authority', icon: CreditCard },
    { id: 'ai-modes' as TabType, label: 'IA Evolutiva', icon: Brain },
    { id: 'automations' as TabType, label: 'Automações', icon: Zap },
    { id: 'social' as TabType, label: 'Publicações Sociais', icon: Globe },
    { id: 'emails' as TabType, label: 'Templates', icon: Mail },
    { id: 'campaigns' as TabType, label: 'Campanhas', icon: Send },
    { id: 'esp' as TabType, label: 'Integrações ESP', icon: Server },
    { id: 'system' as TabType, label: 'Sistema', icon: Settings },
    { id: 'audit' as TabType, label: 'Auditoria', icon: FileText },
    { id: 'account' as TabType, label: 'Minha Conta', icon: UserCog },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <AdminOverview />;
      case 'team':
        return <TeamMembersManager />;
      case 'customers':
        return <CustomerManager />;
      case 'messages':
        return <ContactMessages />;
      case 'chat':
        return <ChatManager />;
      case 'database':
        return <DatabaseManager />;
      case 'products':
        return <ProductCatalogManager />;
      case 'certifications':
        return <UnifiedCertificationManager />;
      case 'company':
        return <CompanySettings />;
      case 'compliance':
        return <ComplianceManager />;
      case 'vip':
        return <VIPAffiliatesManager />;
      case 'affiliate-programs':
        return <AffiliateProgramManager />;
      case 'mlm-structure':
        return <MLMStructurePanel />;
      case 'commissions':
        return <CommissionTracking />;
      case 'commission-settings':
        return <PlatformCommissionSettings />;
      case 'gamification':
        return <GamificationManager />;
      case 'rewards':
        return <RewardsManager />;
      case 'payouts':
        return <PayoutsManager />;
      case 'withdrawals':
        return <AdminWithdrawalsManager />;
      case 'subscriptions':
        return <SubscriptionsManager />;
      case 'stripe':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Stripe Runtime Authority</h2>
              <p className="text-muted-foreground text-sm">
                Monitoramento autônomo • Sem ação necessária • Sistema decide e executa
              </p>
            </div>
            <StripeRuntimeAuthority />
            <StripeHealthDashboard />
          </div>
        );
      case 'ai-modes':
        return <AIModeManager />;
      case 'automations':
        return <AutomationManager />;
      case 'social':
        return <SocialPublishing />;
      case 'emails':
        return <EmailManager />;
      case 'campaigns':
        return <CampaignManagerNew />;
      case 'esp':
        return <ESPManager />;
      case 'system':
        return <SystemStatus />;
      case 'audit':
        return <AuditLogs />;
      case 'account':
        return <AccountSettings />;
      default:
        return <AdminOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex w-full">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Responsive */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-[280px] max-w-[85vw] bg-card/95 backdrop-blur-xl border-r border-border/50 flex flex-col transition-transform duration-300 ease-out",
        "lg:translate-x-0 lg:static lg:w-64",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header */}
        <div className="p-4 border-b border-border/30 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-glow-primary">
                <Shield className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-sm text-foreground">SKY BRASIL</h1>
                <p className="text-[10px] text-muted-foreground">Painel Admin</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 overflow-y-auto scrollbar-modern p-3 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-left ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-glow-primary'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              }`}
            >
              <tab.icon className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs font-medium truncate">{tab.label}</span>
            </button>
          ))}
          
          {/* External Link to Files */}
          <button
            onClick={() => navigate('/files')}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-left text-muted-foreground hover:bg-muted/50 hover:text-foreground border border-dashed border-border/50 mt-2"
          >
            <FolderOpen className="w-4 h-4 flex-shrink-0" />
            <span className="text-xs font-medium truncate">Meus Arquivos</span>
            <span className="ml-auto text-[9px] bg-blue-500/20 text-blue-600 px-1.5 py-0.5 rounded">Drive</span>
          </button>
        </nav>

        {/* User Footer */}
        <div className="p-3 border-t border-border/30 flex-shrink-0 bg-card/50">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
              <Users className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">
                {user?.email?.split('@')[0]}
              </p>
              <p className="text-[10px] text-muted-foreground">Administrador</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="w-full h-8 text-xs"
          >
            <LogOut className="w-3 h-3 mr-1.5" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0 lg:ml-0">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-30 bg-card/95 backdrop-blur-xl border-b border-border safe-top">
          <div className="flex items-center justify-between px-4 py-3">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="touch-manipulation">
              <Menu className="h-6 w-6" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Shield className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-sm text-foreground">Admin</span>
            </div>
            <div className="w-10" />
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto scrollbar-modern">
          <div className="p-3 sm:p-5 lg:p-8 max-w-full">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </div>
        </main>
      </div>

      {/* AI Assistant */}
      <AIAssistant />
    </div>
  );
};

export default AdminDashboard;
