import { useLocation, Link } from "react-router-dom";
import { useEffect, Suspense, lazy } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Home, Star, Rocket, ArrowLeft, Sparkles } from "lucide-react";

// Lazy load 3D scene for performance
const SpaceScene = lazy(() => 
  import("@/components/3d/SpaceScene").then(m => ({ default: m.SpaceScene }))
);

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* 3D Space Background */}
      <div className="absolute inset-0 z-0">
        <Suspense fallback={
          <div className="w-full h-full bg-gradient-to-b from-background via-[#0a0a1a] to-background">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          </div>
        }>
          <SpaceScene className="w-full h-full" />
        </Suspense>
      </div>
      
      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-background/80 z-10 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-background/60 z-10 pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-20 min-h-screen flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-2xl mx-auto"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full mb-8"
          >
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-sm text-primary font-medium">Universo Paralelo Detectado</span>
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          </motion.div>
          
          {/* 404 Number */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
            className="relative mb-6"
          >
            <h1 className="text-[150px] md:text-[200px] font-bold leading-none tracking-tighter">
              <span className="text-gradient-primary">4</span>
              <span className="text-foreground/20">0</span>
              <span className="text-gradient-primary">4</span>
            </h1>
            
            {/* Glow effect behind numbers */}
            <div className="absolute inset-0 blur-3xl opacity-30 bg-gradient-to-r from-primary via-purple-500 to-secondary -z-10" />
          </motion.div>
          
          {/* Title */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-2xl md:text-4xl font-bold mb-4"
          >
            <span className="text-gradient-primary">SKY BRASIL</span>
            <span className="text-foreground"> — Galáxia Não Mapeada</span>
          </motion.h2>
          
          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-lg text-muted-foreground mb-10 max-w-md mx-auto"
          >
            Ops! Esta galáxia ainda não foi explorada pelo nosso foguete. 
            Volte à base para continuar sua jornada de transformação.
          </motion.p>
          
          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <Button 
              size="lg" 
              className="group relative overflow-hidden bg-gradient-to-r from-primary to-purple-600 hover:shadow-lg hover:shadow-primary/30 transition-all"
              asChild
            >
              <Link to="/">
                <Home className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                <span>Voltar à Home</span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-primary opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
              </Link>
            </Button>
            
            <Button 
              size="lg" 
              variant="outline"
              className="border-primary/50 hover:bg-primary/10 group"
              asChild
            >
              <Link to="/vip">
                <Star className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                <span>Lista VIP</span>
              </Link>
            </Button>
          </motion.div>
          
          {/* Easter egg hint */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="mt-12 text-sm text-muted-foreground/50"
          >
            <Rocket className="w-4 h-4 inline-block mr-2 animate-bounce" />
            Dica: Mova o mouse para controlar o foguete
          </motion.p>
        </motion.div>
        
        {/* Navigation breadcrumb */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="absolute bottom-8 left-8"
        >
          <Link 
            to="/" 
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Voltar para o início</span>
          </Link>
        </motion.div>
        
        {/* Quick links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="absolute bottom-8 right-8 flex gap-4"
        >
          {[
            { to: "/streamers", label: "Streamers" },
            { to: "/empresas", label: "Empresas" },
            { to: "/plataforma", label: "Plataforma" },
          ].map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </motion.div>
      </div>
      
      {/* Animated border glow */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-primary/30 to-transparent" />
      <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-secondary/30 to-transparent" />
    </div>
  );
};

export default NotFound;
