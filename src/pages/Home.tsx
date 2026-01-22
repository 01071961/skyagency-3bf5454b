import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useState, useEffect, useRef, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  const plugin = useRef(
    Autoplay({ delay: 4000, stopOnInteraction: false })
  );
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 300], [0, -50]);
  const opacity1 = useTransform(scrollY, [0, 300], [1, 0]);

  const carouselImages = [
    { src: heroCarousel1, title: "Setup Profissional", subtitle: "Tecnologia de Ponta" },
    { src: heroCarousel2, title: "Sucesso Garantido", subtitle: "Celebre suas Conquistas" },
    { src: heroCarousel3, title: "Crescimento Exponencial", subtitle: "Dados e Estratégia" },
  ];

  const features = [
    {
      icon: Target,
      title: "Acesso a Marcas",
      description: "Conectamos você com as melhores marcas do mercado",
      link: "/para-empresas",
    },
    {
      icon: TrendingUp,
      title: "Monetizar seu Conteúdo",
      description: "Transforme suas lives em fonte de renda sustentável",
      link: "/para-streamers",
    },
    {
      icon: Sparkles,
      title: "Treinamento Especializado",
      description: "Aprenda estratégias de alta conversão com experts",
      link: "/para-streamers",
    },
    {
      icon: Shield,
      title: "Estratégia Personalizada",
      description: "Plano sob medida para seu crescimento",
      link: "/como-funciona",
    },
    {
      icon: BarChart3,
      title: "Suporte OBS",
      description: "Configuração técnica completa para suas lives",
      link: "/para-streamers",
    },
    {
      icon: Award,
      title: "Identidade Visual",
      description: "Branding profissional para se destacar",
      link: "/para-streamers",
    },
    {
      icon: Users,
      title: "Comunidade Exclusiva",
      description: "Rede de creators para networking e trocas",
      link: "/vip",
    },
    {
      icon: Zap,
      title: "Mentoria de Conteúdo",
      description: "Orientação contínua para melhorar suas lives",
      link: "/contato",
    },
  ];

  const stats = [
    { icon: Users, value: 500, label: "Streamers Ativos" },
    { icon: DollarSign, value: 2000000, label: "Em Receita Gerada", prefix: "R$" },
    { icon: Rocket, value: 150, label: "Marcas Conectadas" },
    { icon: Star, value: 98, label: "Taxa de Satisfação", suffix: "%" },
  ];

  const platforms = [
    { name: "Twitch", color: "text-[#9146FF]" },
    { name: "YouTube", color: "text-[#FF0000]" },
    { name: "TikTok", color: "text-[#00F2EA]" },
    { name: "Instagram", color: "text-[#E4405F]" },
  ];

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Hero Section with 3D and Carousel */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Carousel */}
        <div className="absolute inset-0">
          <Carousel
            plugins={[plugin.current]}
            className="w-full h-full"
            opts={{ loop: true }}
          >
            <CarouselContent className="h-screen">
              {carouselImages.map((image, index) => (
                <CarouselItem key={index} className="h-screen">
                  <div className="relative w-full h-full">
                    <img
                      src={image.src}
                      alt={image.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/80 to-background" />
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
          className="container mx-auto px-4 relative z-10"
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
              <motion.span
                className="absolute inset-0 text-5xl md:text-7xl font-bold text-primary blur-2xl opacity-50"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                Transformando Lives em Negócios
              </motion.span>
              <h1 className="text-5xl md:text-7xl font-bold mb-6 text-gradient-primary relative">
                Transformando Lives em Negócios
              </h1>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <p className="text-xl md:text-2xl text-foreground/90 mb-8 leading-relaxed">
                Transformamos Streamers em Parceiros de Alta Conversão para Marcas.
                <br />
                <span className="text-primary font-semibold">Criando Negócios Sustentáveis.</span>
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button 
                variant="hero" 
                size="lg" 
                asChild 
                className="hover-scale glow-primary group"
              >
                <Link to="/vip" className="flex items-center gap-2">
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
                variant="secondary" 
                size="lg" 
                asChild
                className="hover-scale backdrop-blur-sm"
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
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-10"
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

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-b from-background to-background/50 relative">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.05 }}
                  className="text-center"
                >
                  <Card className="bg-card/50 backdrop-blur border-border hover:border-primary transition-smooth hover:glow-primary">
                    <CardContent className="p-6">
                      <Icon className="w-12 h-12 text-primary mx-auto mb-4" />
                      <div className="text-4xl font-bold text-gradient-primary mb-2">
                        {stat.prefix}
                        <AnimatedCounter end={stat.value} />
                        {stat.suffix}
                      </div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-gradient-tech relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Por que escolher a{" "}
              <span className="text-gradient-primary">Sky Brasil</span> como sua
              agência?
            </h2>
            <p className="text-lg text-muted-foreground">
              Nós não só representamos – te transformamos em um criador estratégico.
              Desde 2020, ajudamos streamers a crescer, monetizar e se posicionar de
              forma profissional.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -10 }}
                >
                  <Link to={feature.link}>
                    <Card className="h-full bg-card/50 backdrop-blur border-border hover:border-primary transition-smooth hover:glow-primary group cursor-pointer">
                      <CardContent className="p-6 text-center">
                        <motion.div
                          whileHover={{ rotate: 360, scale: 1.1 }}
                          transition={{ duration: 0.6 }}
                          className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 group-hover:bg-primary/20 transition-smooth"
                        >
                          <Icon className="w-8 h-8 text-primary" />
                        </motion.div>
                        <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-smooth">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          {feature.description}
                        </p>
                        <span className="inline-flex items-center gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition-smooth">
                          Saiba mais <ArrowRight className="w-3 h-3" />
                        </span>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Platforms Section */}
      <section className="py-20 bg-background relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4">Onde Você Pode Brilhar</h2>
            <p className="text-lg text-muted-foreground">
              Apoiamos streamers nas principais plataformas do mercado
            </p>
          </motion.div>

          <div className="flex flex-wrap justify-center gap-8">
            {platforms.map((platform, index) => (
              <motion.div
                key={platform.name}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.2, rotate: 5 }}
                className="text-center"
              >
                <div className="w-24 h-24 rounded-full bg-card border-2 border-border flex items-center justify-center mb-3 hover:border-primary transition-smooth hover:glow-primary">
                  <span className={`text-3xl font-bold ${platform.color}`}>
                    {platform.name[0]}
                  </span>
                </div>
                <p className="text-sm font-medium">{platform.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-background/10" />
        
        {/* Animated Background Elements */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute top-10 left-10 w-64 h-64 bg-white/5 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
          }}
          transition={{ duration: 25, repeat: Infinity }}
          className="absolute bottom-10 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl"
        />

        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <motion.h2
              initial={{ scale: 0.9 }}
              whileInView={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-bold mb-6 text-white"
            >
              Pronto para Transformar sua Carreira?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-xl text-white/90 mb-8 max-w-2xl mx-auto"
            >
              Junte-se aos streamers que estão construindo negócios sustentáveis com
              a SKY BRASIL
            </motion.p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="secondary"
                size="lg"
                className="bg-white text-primary hover:bg-white/90 hover:glow-accent"
                asChild
              >
                <Link to="/vip">Entrar na Lista VIP Agora</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
