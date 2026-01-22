import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  BarChart3,
  Target,
  Users,
  TrendingUp,
  Shield,
  Zap,
  Award,
} from "lucide-react";
import { useRef, lazy, Suspense, useState, useCallback, useEffect } from "react";
import Autoplay from "embla-carousel-autoplay";
import brandsHero from "@/assets/brands-hero.jpg";
import brandsAnalytics from "@/assets/brands-analytics.jpg";
import brandsPartnership from "@/assets/brands-partnership.jpg";

const BrandsCorporateScene = lazy(() => import("@/components/3d/BrandsCorporateScene"));
const BrandsAnalyticsScene = lazy(() => import("@/components/3d/BrandsAnalyticsScene"));
const BrandsPartnershipScene = lazy(() => import("@/components/3d/BrandsPartnershipScene"));

const ForBrands = () => {
  const plugin = useRef(Autoplay({ delay: 5000, stopOnInteraction: false }));
  const [currentSlide, setCurrentSlide] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });
  
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.9]);
  const textY = useTransform(scrollYProgress, [0, 0.3], [0, -100]);

  const carouselSlides = [
    { src: brandsHero, title: "Estratégia Corporativa", subtitle: "Parcerias Profissionais", Scene: BrandsCorporateScene },
    { src: brandsAnalytics, title: "Análise de Dados", subtitle: "Métricas em Tempo Real", Scene: BrandsAnalyticsScene },
    { src: brandsPartnership, title: "Conexões Autênticas", subtitle: "Resultados Comprovados", Scene: BrandsPartnershipScene },
  ];

  const carouselImages = carouselSlides;

  const differentials = [
    {
      icon: BarChart3,
      title: "Estratégia Baseada em Métricas",
      description:
        "Todas as nossas campanhas são orientadas por dados, com KPIs claros e acompanhamento em tempo real.",
    },
    {
      icon: Target,
      title: "Modelos Flexíveis",
      description:
        "Adaptamos contratos e formatos às necessidades específicas de cada marca e campanha.",
    },
    {
      icon: Users,
      title: "Seleção Rigorosa",
      description:
        "Trabalhamos apenas com creators que passam por nosso processo de curadoria e treinamento.",
    },
    {
      icon: TrendingUp,
      title: "Foco em ROI",
      description:
        "Nosso objetivo é gerar resultados mensuráveis: vendas, leads e brand awareness.",
    },
    {
      icon: Shield,
      title: "Projeto Piloto Gratuito",
      description:
        "Teste nossa metodologia sem risco financeiro antes de se comprometer com campanhas maiores.",
    },
    {
      icon: Zap,
      title: "Streamers Treinados",
      description:
        "Todos os nossos creators passam por capacitação em estratégias de conversão e brand safety.",
    },
    {
      icon: Award,
      title: "+5 Anos de Experiência",
      description:
        "Desde 2020 conectando marcas e streamers com cases de sucesso comprovados.",
    },
  ];

  const stats = [
    { value: "150+", label: "Campanhas Realizadas" },
    { value: "50+", label: "Marcas Parceiras" },
    { value: "30M+", label: "Impressões Geradas" },
    { value: "85%", label: "Taxa de Satisfação" },
  ];

  return (
    <div ref={containerRef} className="min-h-screen overflow-hidden">
      {/* Hero Section with Carousel and Parallax */}
      <motion.section 
        style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
      >
        {/* Background Carousel */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <Carousel
            plugins={[plugin.current]}
            className="w-full h-full"
            opts={{ loop: true, align: "start", duration: 40 }}
            setApi={(api) => {
              if (api) {
                api.on("select", () => {
                  setCurrentSlide(api.selectedScrollSnap());
                });
              }
            }}
          >
            <CarouselContent className="h-full ml-0">
              {carouselSlides.map((slide, index) => (
                <CarouselItem key={index} className="h-full pl-0 basis-full min-w-full">
                  <motion.div 
                    className="relative w-full h-[100svh]"
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ 
                      opacity: currentSlide === index ? 1 : 0.3,
                      scale: currentSlide === index ? 1 : 1.05
                    }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                  >
                    <img
                      src={slide.src}
                      alt={slide.title}
                      className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-1000"
                    />
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/80 to-background/95"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    />
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: currentSlide === index ? 1 : 0 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                    >
                      <Suspense fallback={null}>
                        <slide.Scene />
                      </Suspense>
                    </motion.div>
                  </motion.div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>

        <motion.div
          style={{ y: textY }}
          className="container mx-auto px-4 relative z-10 pt-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h1 className="text-5xl md:text-7xl font-bold mb-6 text-gradient-primary animate-fade-in">
                Parcerias que Geram Resultados
              </h1>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <p className="text-xl md:text-2xl text-foreground/90 mb-8 leading-relaxed">
                Conectamos sua marca com streamers de alta conversão.
                <br />
                Campanhas focadas em métricas e ROI real.
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
                className="hover-scale glow-primary"
              >
                <Link to="/contato">Fale com Nossa Equipe</Link>
              </Button>
              <Button 
                variant="secondary" 
                size="lg" 
                asChild
                className="hover-scale"
              >
                <Link to="/como-funciona">Como Trabalhamos</Link>
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
            className="w-6 h-10 border-2 border-primary/50 rounded-full flex justify-center"
          >
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1 h-3 bg-primary rounded-full mt-2"
            />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-b from-background to-background/50 relative">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05, y: -4 }}
                className="text-center"
              >
                <div className="glass-card p-5 hover:border-primary/30 transition-all">
                  <p className="text-3xl md:text-4xl font-bold text-gradient-primary mb-1">
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Differentials Section */}
      <section className="py-20 bg-gradient-tech relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-secondary rounded-full blur-3xl animate-pulse" />
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
              Nossos Diferenciais
            </h2>
            <p className="text-lg text-muted-foreground">
              Por que confiar sua marca na SKY BRASIL
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-16">
            {differentials.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="group"
                >
                  <div className="h-full glass-card p-6 hover:border-secondary/50 transition-all duration-300">
                    <motion.div
                      whileHover={{ rotate: 360, scale: 1.1 }}
                      transition={{ duration: 0.6 }}
                      className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-secondary/20 to-secondary/5 mb-4 group-hover:shadow-glow-secondary transition-all"
                    >
                      <Icon className="w-7 h-7 text-secondary" />
                    </motion.div>
                    <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Image Gallery */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-5xl mx-auto"
          >
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent>
                {carouselImages.map((image, index) => (
                  <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.3 }}
                      className="p-1"
                    >
                      <Card className="overflow-hidden border-border hover:border-secondary transition-smooth">
                        <img
                          src={image.src}
                          alt={image.title}
                          className="w-full h-64 object-cover"
                        />
                        <CardContent className="p-4 bg-card/80 backdrop-blur">
                          <h3 className="font-semibold text-lg">{image.title}</h3>
                          <p className="text-sm text-muted-foreground">{image.subtitle}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </motion.div>
        </div>
      </section>

      {/* How We Work */}
      <section className="py-20 bg-background relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto mb-20"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Como Trabalhamos
            </h2>
            <div className="space-y-6">
              {[
                {
                  step: "01",
                  title: "Briefing Detalhado",
                  description:
                    "Entendemos seus objetivos, público-alvo e KPIs esperados.",
                },
                {
                  step: "02",
                  title: "Seleção de Creators",
                  description:
                    "Escolhemos streamers alinhados com sua marca e audiência.",
                },
                {
                  step: "03",
                  title: "Planejamento da Campanha",
                  description:
                    "Criamos estratégia de conteúdo, cronograma e métricas de sucesso.",
                },
                {
                  step: "04",
                  title: "Execução & Monitoramento",
                  description:
                    "Acompanhamos cada live em tempo real e ajustamos quando necessário.",
                },
                {
                  step: "05",
                  title: "Relatório de Resultados",
                  description:
                    "Entregamos análise completa com métricas, insights e recomendações.",
                },
              ].map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ x: 10 }}
                  className="flex gap-6 items-start"
                >
                  <motion.div 
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-secondary flex items-center justify-center text-white font-bold text-xl shadow-glow-secondary"
                  >
                    {item.step}
                  </motion.div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-accent relative overflow-hidden">
        <div className="absolute inset-0 bg-background/10" />
        
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
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Vamos Criar Algo Incrível Juntos?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Entre em contato e descubra como podemos impulsionar sua marca no mundo
              do streaming
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="secondary"
                size="lg"
                className="bg-white text-accent hover:bg-white/90 hover:glow-accent"
                asChild
              >
                <Link to="/contato">Fale com Nossa Equipe</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default ForBrands;