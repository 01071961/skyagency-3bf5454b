import { useState } from 'react';
import { Outlet, Navigate, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Award, 
  BarChart3, 
  MessageSquare, 
  Settings,
  Home,
  GraduationCap,
  Menu,
  X,
  Crown,
  FileText,
  ClipboardCheck,
  FolderOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const MemberLayout = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  const navItems = [
    { path: '/members', icon: Home, label: 'Início', exact: true },
    { path: '/members/courses', icon: BookOpen, label: 'Meus Cursos' },
    { path: '/members/exams', icon: ClipboardCheck, label: 'Simulados' },
    { path: '/members/certificates', icon: Award, label: 'Certificados' },
    { path: '/members/transcript', icon: FileText, label: 'Histórico Escolar' },
    { path: '/files', icon: FolderOpen, label: 'Meus Arquivos', badge: 'Drive' },
    { path: '/members/progress', icon: BarChart3, label: 'Progresso' },
    { path: '/members/performance', icon: BarChart3, label: 'Relatório IA' },
    { path: '/members/community', icon: MessageSquare, label: 'Comunidade' },
    { path: '/members/settings', icon: Settings, label: 'Configurações' },
  ];

  return (
    <div className="min-h-screen bg-background flex w-full print:block print:bg-white">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Responsive (hidden on print) */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-[280px] max-w-[85vw] bg-card/95 backdrop-blur-xl border-r border-border flex flex-col transition-transform duration-300 ease-out print:hidden no-print",
        "md:translate-x-0 md:static md:w-64",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">Área do Aluno</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                )
              }
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
              {(item as any).badge && (
                <span className="ml-auto text-[10px] bg-blue-500/20 text-blue-600 px-1.5 py-0.5 rounded">{(item as any).badge}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* VIP Area Link */}
        <div className="p-4 border-t border-border space-y-2">
          <NavLink 
            to="/vip/dashboard" 
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-primary/20 to-accent/20 text-primary hover:from-primary/30 hover:to-accent/30 transition-all text-sm font-medium"
          >
            <Crown className="h-4 w-4" />
            Área VIP
          </NavLink>
          <NavLink 
            to="/" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors block text-center"
          >
            Voltar ao Site
          </NavLink>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Mobile Header (hidden on print) */}
        <header className="md:hidden sticky top-0 z-30 bg-card/95 backdrop-blur-xl border-b border-border safe-top print:hidden no-print">
          <div className="flex items-center justify-between px-4 py-3">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="touch-manipulation">
              <Menu className="h-6 w-6" />
            </Button>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-primary" />
              <span className="font-bold text-foreground">Aluno</span>
            </div>
            <div className="w-10" />
          </div>
        </header>

        {/* Mobile Bottom Navigation (hidden on print) */}
        <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border md:hidden z-50 pb-safe print:hidden no-print">
          <div className="flex justify-around py-2 px-1">
            {navItems.slice(0, 5).map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center gap-0.5 p-1.5 rounded-lg transition-all min-w-[52px] touch-manipulation",
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground active:bg-muted"
                  )
                }
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] leading-tight">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 p-3 sm:p-5 md:p-6 pb-24 md:pb-6 overflow-x-hidden overflow-y-auto print:p-0 print:overflow-visible">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MemberLayout;
