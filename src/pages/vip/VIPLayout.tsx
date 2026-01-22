import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, ShoppingBag, Gift, History, 
  User, Users, LogOut, Menu, X, Diamond, Crown,
  Package, TrendingUp, Wallet, GraduationCap, BookOpen,
  Sparkles, Presentation, FolderOpen, Award, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/auth';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/vip/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/vip/panel', icon: Diamond, label: 'Painel VIP' },
  { to: '/vip/network', icon: Users, label: 'Rede Social', highlight: true },
  { to: '/vip/creator', icon: Sparkles, label: 'Creator' },
  { to: '/vip/slides', icon: Presentation, label: 'Slides VIP' },
  { to: '/vip/affiliate/products', icon: Package, label: 'Produtos' },
  { to: '/files', icon: FolderOpen, label: 'Meus Arquivos', badge: 'Drive' },
  { to: '/vip/shop', icon: ShoppingBag, label: 'Loja' },
  { to: '/vip/withdrawals', icon: Wallet, label: 'Saques' },
  { to: '/vip/rewards', icon: Gift, label: 'Recompensas' },
  { to: '/vip/referrals', icon: Users, label: 'Indicações' },
  { to: '/vip/history', icon: History, label: 'Histórico' },
  { to: '/vip/profile', icon: User, label: 'Perfil' },
  { to: '/vip/billing', icon: Crown, label: 'Assinatura' },
];

const portalItems = [
  { to: '/members', icon: GraduationCap, label: 'Portal do Aluno', external: true },
  { to: '/members/courses', icon: BookOpen, label: 'Meus Cursos', external: true },
  { to: '/vip/certificates', icon: Award, label: 'Meus Certificados' },
  { to: '/vip/simulators', icon: FileText, label: 'Simulados' },
];

export default function VIPLayout() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background flex w-full">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-[280px] max-w-[85vw] bg-card/95 backdrop-blur-xl border-r border-border transform transition-transform duration-300 ease-out lg:translate-x-0 lg:static lg:w-64",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-5 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center shadow-lg shadow-primary/20">
                <Crown className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-foreground text-lg">Área VIP</h1>
                <p className="text-xs text-muted-foreground">SKY BRASIL</p>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.email?.split('@')[0]}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                    : (item as any).highlight 
                      ? "text-primary hover:bg-primary/10 border border-primary/30"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
                {(item as any).badge && (
                  <span className="ml-auto text-[10px] bg-blue-500/20 text-blue-600 px-1.5 py-0.5 rounded">{(item as any).badge}</span>
                )}
                {(item as any).highlight && (
                  <span className="ml-auto text-[10px] bg-primary/20 px-1.5 py-0.5 rounded">NOVO</span>
                )}
              </NavLink>
            ))}
            
            {/* Portal do Aluno Section */}
            <div className="pt-4 mt-4 border-t border-border">
              <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Portal do Aluno
              </p>
              {portalItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) => cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive 
                      ? "bg-accent text-accent-foreground shadow-md" 
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </nav>

          {/* Stats Preview */}
          <div className="p-4 border-t border-border">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-background">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <TrendingUp className="h-4 w-4" />
                Performance
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-foreground">0</span>
                <span className="text-xs text-muted-foreground">vendas este mês</span>
              </div>
            </div>
          </div>

          {/* Logout */}
          <div className="p-4 border-t border-border">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sair da conta
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border safe-top">
          <div className="flex items-center justify-between px-4 py-3">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="touch-manipulation">
              <Menu className="h-6 w-6" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
                <Diamond className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-foreground">VIP</span>
            </div>
            <div className="w-10" />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden p-3 sm:p-5 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
