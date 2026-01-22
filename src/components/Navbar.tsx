import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Shield, LogIn, LogOut, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CartSheet } from "./CartSheet";
import { NotificationCenter } from "./NotificationCenter";
import LanguageSwitcher from "./LanguageSwitcher";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useAuth } from "@/auth";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const { isAdmin, isAuthenticated, isLoading } = useAdminRole();
  const { signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  // Detect scroll for glass effect intensity + shrink
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 20;
      setIsScrolled(scrolled);
      // Calculate scroll progress for shrink effect (0-100px scroll)
      const progress = Math.min(window.scrollY / 100, 1);
      setScrollProgress(progress);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Sobre", path: "/sobre" },
    { name: "Streamers", path: "/streamers" },
    { name: "Empresas", path: "/empresas" },
    { name: "Como Funciona", path: "/como-funciona" },
    { name: "Academy", path: "/academy" },
    { name: "Plataforma", path: "/plataforma" },
    { name: "Vendas", path: "/vendas" },
    { name: "Blog", path: "/blog" },
    { name: "Contato", path: "/contato" },
  ];

  const isActiveLink = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          isScrolled
            ? "bg-background/80 backdrop-blur-2xl border-b border-border/50 shadow-glass supports-[backdrop-filter]:bg-background/60"
            : "bg-background/40 backdrop-blur-xl border-b border-transparent"
        )}
      >
        <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <motion.div 
            className="flex items-center justify-between"
            style={{ 
              height: `clamp(56px, ${72 - scrollProgress * 16}px, 72px)`,
            }}
            transition={{ duration: 0.2 }}
          >
            {/* Logo - Responsive sizing */}
            <Link 
              to="/" 
              className="flex items-center gap-2 sm:gap-3 group flex-shrink-0"
            >
              <motion.img 
                src={logo} 
                alt="SKY BRASIL" 
                className="transition-all duration-300 w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10"
                style={{
                  transform: `scale(${1 - scrollProgress * 0.15})`,
                }}
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6 }}
              />
              <span 
                className="text-lg sm:text-xl md:text-2xl font-bold text-gradient-primary hidden min-[400px]:inline transition-all duration-300"
              >
                SKY BRASIL
              </span>
            </Link>

          {/* Desktop Navigation - Centered */}
          <div className="hidden lg:flex items-center justify-center gap-1 flex-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "relative px-2.5 py-1.5 text-sm font-medium rounded-lg transition-all duration-200",
                  isActiveLink(link.path)
                    ? "text-primary"
                    : "text-foreground/70 hover:text-foreground hover:bg-muted/50"
                )}
              >
                {link.name}
                {isActiveLink(link.path) && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 h-0.5 bg-gradient-to-r from-primary to-secondary rounded-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            ))}
            
            {/* Admin Link */}
            {!isLoading && isAdmin && (
              <Link
                to="/admin"
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-all duration-200"
              >
                <Shield size={14} />
                Admin
              </Link>
            )}
            
            {/* Login/Logout */}
            {!isLoading && !isAuthenticated && (
              <Link
                to="/auth"
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-muted/50 rounded-lg transition-all duration-200"
              >
                <LogIn size={14} />
                Login
              </Link>
            )}
            
            {/* User Menu when authenticated */}
            {!isLoading && isAuthenticated && (
              <>
                <Link
                  to="/vip/dashboard"
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-muted/50 rounded-lg transition-all duration-200"
                >
                  <User size={14} />
                  Minha Conta
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-muted/50 rounded-lg transition-all duration-200"
                >
                  <LogOut size={14} />
                  Sair
                </button>
              </>
            )}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
            {/* Language Switcher */}
            <LanguageSwitcher />
            {/* Notification Center - Only for authenticated users */}
            {!isLoading && isAuthenticated && <NotificationCenter />}
            <CartSheet />
            
            {/* CTA Button - Hidden on small mobile */}
            <Button 
              variant="hero" 
              size="sm" 
              asChild 
              className="hidden sm:flex text-xs sm:text-sm px-3 sm:px-4 shadow-glow-primary hover:shadow-[0_0_30px_hsl(330_100%_60%/0.4)]"
            >
              <Link to="/vip">Lista VIP</Link>
            </Button>

            {/* Mobile Menu Toggle - Animated hamburger */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2 sm:p-2.5 rounded-xl text-foreground hover:bg-muted/50 active:scale-95 transition-all touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={isOpen}
            >
              <div className="relative w-6 h-5 flex flex-col justify-center items-center">
                <motion.span
                  className="absolute w-6 h-0.5 bg-current rounded-full"
                  animate={{
                    rotate: isOpen ? 45 : 0,
                    y: isOpen ? 0 : -6,
                  }}
                  transition={{ duration: 0.2 }}
                />
                <motion.span
                  className="absolute w-6 h-0.5 bg-current rounded-full"
                  animate={{
                    opacity: isOpen ? 0 : 1,
                    scaleX: isOpen ? 0 : 1,
                  }}
                  transition={{ duration: 0.15 }}
                />
                <motion.span
                  className="absolute w-6 h-0.5 bg-current rounded-full"
                  animate={{
                    rotate: isOpen ? -45 : 0,
                    y: isOpen ? 0 : 6,
                  }}
                  transition={{ duration: 0.2 }}
                />
              </div>
            </button>
          </div>
        </motion.div>

        {/* Mobile Navigation - Full screen overlay */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="lg:hidden overflow-hidden max-h-[calc(100vh-60px)] overflow-y-auto"
            >
              <motion.div
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                exit={{ y: -20 }}
                className="py-3 sm:py-4 space-y-0.5 sm:space-y-1 border-t border-border/50"
              >
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.path}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Link
                      to={link.path}
                      className={cn(
                        "block px-4 py-3 sm:py-3.5 text-base sm:text-lg font-medium rounded-xl transition-all duration-200 active:scale-[0.98] touch-manipulation min-h-[48px] flex items-center",
                        isActiveLink(link.path)
                          ? "text-primary bg-primary/10 border-l-4 border-primary"
                          : "text-foreground/80 hover:text-foreground hover:bg-muted/50 active:bg-muted/70"
                      )}
                    >
                      {link.name}
                    </Link>
                  </motion.div>
                ))}
                
                {/* Admin Link - Mobile */}
                {!isLoading && isAdmin && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: navLinks.length * 0.03 }}
                  >
                    <Link
                      to="/admin"
                      className="flex items-center gap-3 px-4 py-3 sm:py-3.5 text-base sm:text-lg font-medium text-primary hover:bg-primary/10 active:bg-primary/20 rounded-xl transition-all duration-200 active:scale-[0.98] touch-manipulation min-h-[48px]"
                    >
                      <Shield size={20} />
                      Painel Admin
                    </Link>
                  </motion.div>
                )}
                
                {/* Login Link - Mobile */}
                {!isLoading && !isAuthenticated && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (navLinks.length + 1) * 0.03 }}
                  >
                    <Link
                      to="/auth"
                      className="flex items-center gap-3 px-4 py-3 sm:py-3.5 text-base sm:text-lg font-medium text-foreground/80 hover:text-foreground hover:bg-muted/50 active:bg-muted/70 rounded-xl transition-all duration-200 active:scale-[0.98] touch-manipulation min-h-[48px]"
                    >
                      <LogIn size={20} />
                      Login
                    </Link>
                  </motion.div>
                )}
                
                {/* User Menu - Mobile */}
                {!isLoading && isAuthenticated && (
                  <>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (navLinks.length + 1) * 0.03 }}
                    >
                      <Link
                        to="/vip/dashboard"
                        className="flex items-center gap-3 px-4 py-3 sm:py-3.5 text-base sm:text-lg font-medium text-foreground/80 hover:text-foreground hover:bg-muted/50 active:bg-muted/70 rounded-xl transition-all duration-200 active:scale-[0.98] touch-manipulation min-h-[48px]"
                      >
                        <User size={20} />
                        Minha Conta
                      </Link>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (navLinks.length + 2) * 0.03 }}
                    >
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 sm:py-3.5 text-base sm:text-lg font-medium text-foreground/80 hover:text-foreground hover:bg-muted/50 active:bg-muted/70 rounded-xl transition-all duration-200 active:scale-[0.98] touch-manipulation min-h-[48px] w-full"
                      >
                        <LogOut size={20} />
                        Sair
                      </button>
                    </motion.div>
                  </>
                )}
                
                {/* Mobile CTA */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (navLinks.length + 2) * 0.03 }}
                  className="pt-4 px-4"
                >
                  <Button 
                    variant="hero" 
                    size="lg" 
                    className="w-full shadow-glow-primary text-base sm:text-lg py-4 sm:py-5" 
                    asChild
                  >
                    <Link to="/vip">
                      Entrar na Lista VIP
                    </Link>
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
    
    {/* Mobile menu backdrop */}
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </AnimatePresence>
    </>
  );
};

export default Navbar;