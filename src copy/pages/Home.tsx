import { Link, useSearchParams } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useState, useEffect, useRef, Suspense } from "react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import {
  Target,
  TrendingUp,
  Users,
  Award,
  Sparkles,
  Shield,
  BarChart3,
  Zap,
  Rocket,
  DollarSign,
  Star,
  ArrowRight,
} from "lucide-react";
import Autoplay from "embla-carousel-autoplay";
import heroCarousel1 from "@/assets/hero-carousel-1.jpg";
import heroCarousel2 from "@/assets/hero-carousel-2.jpg";
import heroCarousel3 from "@/assets/hero-carousel-3.jpg";
import { HeroScene } from "@/components/3d/HeroScene";
import { GlassCard, BentoCard } from "@/components/ui/glass-card";
import { FAQ } from "@/components/landing/FAQ";
import { Partners } from "@/components/landing/Partners";
import { Testimonials } from "@/components/landing/Testimonials";

const AnimatedCounter = ({ end, duration = 2 }: { end: number; duration?: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      
      setCount(Math.floor(progress * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return <span>{count}+</span>;
};

const Home = () => {
  const [searchParams] = useSearchParams();
  const plugin = useRef(
    Autoplay({ delay: 4000, stopOnInteraction: false })
  );
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 300], [0, -50]);
  const opacity1 = useTransform(scrollY, [0, 300], [1, 0]);

  // Capture referral code from URL
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      localStorage.setItem('affiliate_ref_code', refCode);
      localStorage.setItem('affiliate_ref_timestamp', Date.now().toString());
    }
  }, [searchParams]);

  const carouselImages = [
    { src: heroCarousel1, title: "Setup Profissional", subtitle: "Tecnologia de Ponta" },
    { src: heroCarousel2, title: "Sucesso Garantido", subtitle: "Celebre suas Conquistas" },
    { src: heroCarousel3, title: "Crescimento Exponencial", subtitle: "Dados e Estratégia" },
  ];

  const features = [
    {
      icon: Target,
      title: "Conexão com Marcas Premium",
      description: "Parcerias exclusivas com marcas líderes do mercado brasileiro e internacional",
      link: "/empresas",
    },
    {
      icon: TrendingUp,
      title: "Monetização Inteligente",
      description: "Estratégias comprovadas que já geraram R$2M+ em receita para nossos parceiros",
      link: "/streamers",
    },
    {
      icon: Sparkles,
      title: "Academy SKY",
      description: "Treinamento intensivo com metodologia exclusiva de alta conversão",
      link: "/streamers",
    },
    {
      icon: Shield,
      title: "Gestão 360°",
      description: "Planejamento estratégico personalizado com métricas e análise de dados",
      link: "/como-funciona",
    },
    {
      icon: BarChart3,
      title: "Setup Técnico Pro",
      description: "Configuração OBS, overlays, alertas e integração completa de ferramentas",
      link: "/streamers",
    },
    {
      icon: Award,
      title: "Branding Profissional",
      description: "Identidade visual única que diferencia você no mercado de streaming",
      link: "/streamers",
    },
    {
      icon: Users,
      title: "Networking Exclusivo",
      description: "Acesso à comunidade VIP de creators com eventos e collabs mensais",
      link: "/vip",
    },
    {
      icon: Zap,
      title: "Mentoria 1:1",
      description: "Acompanhamento individual com especialistas do mercado de streaming",
      link: "/contato",
    },
  ];

  const stats = [
    { icon: Users, value: 500, label: "Creators Parceiros", prefix: "" },
    { icon: DollarSign, value: 2, label: "Milhões Gerados", prefix: "R$", suffix: "M+" },
    { icon: Rocket, value: 150, label: "Marcas Ativas", prefix: "" },
    { icon: Star, value: 98, label: "Satisfação", prefix: "", suffix: "%" },
  ];

  const platforms = [
    { name: "Twitch", color: "text-[#9146FF]", bg: "bg-[#9146FF]/10", desc: "Lives" },
    { name: "YouTube", color: "text-[#FF0000]", bg: "bg-[#FF0000]/10", desc: "Vídeos" },
    { name: "TikTok", color: "text-[#00F2EA]", bg: "bg-[#00F2EA]/10", desc: "Shorts" },
    { name: "Instagram", color: "text-[#E4405F]", bg: "bg-[#E4405F]/10", desc: "Reels" },
    { name: "Kwai", color: "text-[#FF6C00]", bg: "bg-[#FF6C00]/10", desc: "Clipes" },
    { name: "Facebook", color: "text-[#1877F2]", bg: "bg-[#1877F2]/10", desc: "Gaming" },
  ];

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Hero Section with 3D and Carousel */}
      <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden">
        {/* Background Carousel */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <Carousel
            plugins={[plugin.current]}
            className="w-full h-full"
            opts={{ loop: true, align: "start" }}
          >
            <CarouselContent className="h-full ml-0">
              {carouselImages.map((image, index) => (
                <CarouselItem key={index} className="h-full pl-0 basis-full min-w-full">
                  <div className="relative w-full h-[100svh]">
                    <img
                      src={image.src}
                      alt={image.title}
                      className="absolute inset-0 w-full h-full object-cover object-center"
                      loading={index === 0 ? "eager" : "lazy"}
                      decoding={index === 0 ? "sync" : "async"}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/70 to-background" />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>

        {/* 3D Scene Overlay */}
        <Suspense fallback={null}>
          <HeroScene />
        </Suspense>

        <motion.div
          style={{ y: y1, opacity: opacity1 }}
          className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Glowing Title */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="relative"
            >
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-4 backdrop-blur-sm">
                🚀 A #1 Agência de Streamers do Brasil
              </span>
              <motion.span
                className="absolute inset-0 text-fluid-5xl md:text-fluid-6xl font-bold text-primary blur-2xl opacity-50 hidden sm:block"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                De Streamer a Creator Profissional
              </motion.span>
              <h1 className="text-fluid-4xl sm:text-fluid-5xl md:text-fluid-6xl font-bold mb-4 sm:mb-6 text-gradient-primary relative leading-tight">
                De Streamer a<br className="sm:hidden" /> Creator Profissional
              </h1>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <p className="text-fluid-base sm:text-fluid-lg md:text-fluid-xl text-foreground/90 mb-6 sm:mb-8 leading-relaxed px-2 sm:px-0 max-w-2xl mx-auto">
                Transformamos seu talento em <span className="text-primary font-semibold">negócio lucrativo</span>. 
                Parcerias com marcas, monetização estratégica e crescimento exponencial.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0"
            >
              <Button 
                variant="hero" 
                size="lg" 
                asChild 
                className="group w-full sm:w-auto"
              >
                <Link to="/vip" className="flex items-center justify-center gap-2">
                  Quero entrar na Lista VIP
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight className="w-5 h-5" />
                  </motion.span>
                </Link>
              </Button>
              <Button 
                variant="glass" 
                size="lg" 
                asChild
                className="w-full sm:w-auto"
              >
                <Link to="/como-funciona">Como Funciona</Link>
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.5 }}
          className="absolute bottom-6 sm:bottom-10 left-1/2 transform -translate-x-1/2 z-10 hidden xs:block"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 border-2 border-primary/50 rounded-full flex justify-center backdrop-blur-sm"
          >
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1 h-3 bg-primary rounded-full mt-2"
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Stats Section - Compact Bento Grid */}
      <section className="py-12 sm:py-16 bg-gradient-to-b from-background to-background/50 relative">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <h2 className="text-fluid-2xl sm:text-fluid-3xl font-bold mb-2">
              Números que <span className="text-gradient-primary">Impressionam</span>
            </h2>
            <p className="text-sm text-muted-foreground">
              Resultados reais de nossa parceria com streamers
            </p>
          </motion.div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <BentoCard className="text-center h-full py-4 sm:py-6">
                    <Icon className="w-6 h-6 sm:w-8 md:w-10 sm:h-8 md:h-10 text-primary mx-auto mb-2 sm:mb-3" />
                    <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gradient-primary mb-1">
                      {stat.prefix}
                      <AnimatedCounter end={stat.value} />
                      {stat.suffix}
                    </div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </BentoCard>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section - Compact Bento Grid */}
      <section className="py-12 sm:py-16 bg-gradient-tech relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-5 w-48 h-48 bg-primary rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-5 w-64 h-64 bg-accent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-6 sm:mb-10"
          >
            <span className="inline-block px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-medium mb-3">
              Soluções Completas
            </span>
            <h2 className="text-fluid-2xl sm:text-fluid-3xl font-bold mb-3">
              Ecossistema Completo para{" "}
              <span className="text-gradient-primary">Seu Sucesso</span>
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground px-2 sm:px-0">
              Metodologia exclusiva que já transformou +500 creators em profissionais de sucesso desde 2020
            </p>
          </motion.div>

          {/* Bento Grid Layout - Compact */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  viewport={{ once: true }}
                >
                  <Link to={feature.link} className="block h-full">
                    <BentoCard className="h-full text-center group cursor-pointer py-4 sm:py-5">
                      <motion.div
                        whileHover={{ rotate: 360, scale: 1.1 }}
                        transition={{ duration: 0.6 }}
                        className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 mb-2 sm:mb-3 group-hover:bg-primary/20 transition-all duration-300"
                      >
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                      </motion.div>
                      <h3 className="text-sm sm:text-base font-semibold mb-1 group-hover:text-primary transition-colors duration-300">{feature.title}</h3>
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {feature.description}
                      </p>
                      <span className="inline-flex items-center gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition-all duration-300">
                        Saiba mais <ArrowRight className="w-3 h-3" />
                      </span>
                    </BentoCard>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Platforms Section - Professional */}
      <section className="py-10 sm:py-14 bg-background relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-6 sm:mb-8"
          >
            <span className="inline-block px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-xs font-medium mb-3">
              Multi-plataforma
            </span>
            <h2 className="text-fluid-2xl sm:text-fluid-3xl font-bold mb-2">
              Presença em <span className="text-gradient-primary">Todas as Plataformas</span>
            </h2>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              Estratégia multiplataforma para maximizar seu alcance e diversificar sua receita
            </p>
          </motion.div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4 max-w-3xl mx-auto">
            {platforms.map((platform, index) => (
              <motion.div
                key={platform.name}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.08, y: -4 }}
                className="text-center"
              >
                <GlassCard 
                  variant="subtle" 
                  interactive
                  className={`aspect-square flex flex-col items-center justify-center p-2 sm:p-3 ${platform.bg}`}
                >
                  <span className={`text-lg sm:text-xl lg:text-2xl font-bold ${platform.color} mb-0.5`}>
                    {platform.name[0]}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{platform.desc}</span>
                </GlassCard>
                <p className="text-[10px] sm:text-xs font-medium mt-1">{platform.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <Testimonials />

      {/* Partners Section */}
      <Partners />

      {/* FAQ Section */}
      <FAQ />

      {/* CTA Section - Compact Premium Glass */}
      <section className="py-10 sm:py-14 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-accent/10 to-primary/15" />
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute top-5 left-5 w-32 h-32 bg-primary/20 rounded-full blur-3xl hidden sm:block"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2] }}
          transition={{ duration: 25, repeat: Infinity }}
          className="absolute bottom-5 right-5 w-40 h-40 bg-accent/20 rounded-full blur-3xl hidden sm:block"
        />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <GlassCard variant="glow" size="lg" className="max-w-2xl mx-auto p-6 sm:p-8">
              <span className="inline-block px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-3">
                ⏰ Vagas Limitadas
              </span>
              <motion.h2
                initial={{ scale: 0.9 }}
                whileInView={{ scale: 1 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3"
              >
                Seu Próximo Nível Começa Aqui
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="text-sm sm:text-base text-muted-foreground mb-5 max-w-lg mx-auto"
              >
                Entre para a lista VIP e receba acesso antecipado a oportunidades exclusivas de parceria
              </motion.p>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex flex-col sm:flex-row gap-3 justify-center items-center"
              >
                <Button variant="hero" size="lg" asChild>
                  <Link to="/vip" className="flex items-center gap-2">
                    Garantir Minha Vaga
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
                <Button variant="glass" size="lg" asChild>
                  <Link to="/contato">Falar com Especialista</Link>
                </Button>
              </motion.div>
            </GlassCard>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
