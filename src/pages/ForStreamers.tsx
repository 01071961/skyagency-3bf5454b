import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Handshake,
  DollarSign,
  Video,
  Palette,
  MessageCircle,
  Zap,
} from "lucide-react";
import { useRef } from "react";
import Autoplay from "embla-carousel-autoplay";
import { StreamersHeroScene } from "@/components/3d/StreamersHeroScene";
import streamersHero from "@/assets/streamers-hero.jpg";
import streamersSuccess from "@/assets/streamers-success.jpg";
import streamersTraining from "@/assets/streamers-training.jpg";

const ForStreamers = () => {
  const plugin = useRef(Autoplay({ delay: 3500, stopOnInteraction: false }));
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });
  
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.9]);
  const textY = useTransform(scrollYProgress, [0, 0.3], [0, -100]);

  const carouselImages = [
    { src: streamersHero, title: "Setup Profissional", subtitle: "Tecnologia de Ponta" },
    { src: streamersSuccess, title: "Sucesso Garantido", subtitle: "Celebre suas Conquistas" },
    { src: streamersTraining, title: "Treinamento Especializado", subtitle: "Mentoria Contínua" },
  ];

  const benefits = [
    {
      icon: Handshake,
      title: "Gestão de Parcerias",
      description:
        "Cuidamos de todas as negociações e contratos com marcas, para você focar no que faz de melhor: criar conteúdo.",
    },
    {
      icon: DollarSign,
      title: "Monetização Inteligente",
      description:
        "Estratégias comprovadas para maximizar seus ganhos através de parcerias, patrocínios e campanhas.",
    },
    {
      icon: Video,
      title: "Treinamento de Live",
      description:
        "Aprenda técnicas avançadas de engajamento, retenção de audiência e conversão durante suas transmissões.",
    },
    {
      icon: Palette,
      title: "Branding Pessoal",
      description:
        "Desenvolvemos sua identidade visual completa: logo, overlays, emotes e todo material necessário.",
    },
    {
      icon: MessageCircle,
      title: "Mentoria Contínua",
      description:
        "Acompanhamento semanal com nossa equipe para analisar resultados e ajustar estratégias.",
    },
  ];

  return (
    <div ref={containerRef} className="min-h-screen overflow-hidden">
      {/* Hero Section with Advanced 3D WebGL Effects and Parallax */}
      <motion.section 
        style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
      >
        <StreamersHeroScene />
        
        {/* Background Carousel with modern styling */}
        <div className="absolute inset-0 w-full h-full overflow-hidden opacity-25">
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
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/85 to-background/95" />
                  </div>
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
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Badge className="mb-6 bg-primary/20 text-primary border-primary animate-pulse">
                <Zap className="w-3 h-3 mr-1" />
                Seja um Creator de Sucesso
              </Badge>
              <h1 className="text-6xl md:text-8xl font-bold mb-8 drop-shadow-glow animate-fade-in">
                Venha ser um <span className="text-gradient-primary">Streamer SKY</span>
              </h1>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <p className="text-xl md:text-3xl text-foreground/90 mb-10 leading-relaxed drop-shadow-lg">
                Treinamos você para se tornar um creator de <span className="text-gradient-secondary font-bold">alta conversão</span> para marcas,
                com carreira sustentável e crescimento consistente.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button 
                variant="hero" 
                size="lg" 
                asChild 
                className="hover-scale glow-primary text-lg px-8"
              >
                <Link to="/vip">Quero Ser Streamer</Link>
              </Button>
              <Button 
                variant="secondary" 
                size="lg" 
                asChild
                className="hover-scale text-lg px-8"
              >
                <Link to="/como-funciona">Saiba Mais</Link>
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

      {/* Benefits Section */}
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
              O Que Oferecemos
            </h2>
            <p className="text-lg text-muted-foreground">
              Tudo que você precisa para se tornar um streamer profissional de sucesso
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-16">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="group"
                >
                  <div className="h-full glass-card p-6 hover:border-primary/50 transition-all duration-300">
                    <motion.div
                      whileHover={{ rotate: 360, scale: 1.1 }}
                      transition={{ duration: 0.6 }}
                      className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 mb-4 group-hover:shadow-glow-primary transition-all"
                    >
                      <Icon className="w-7 h-7 text-primary" />
                    </motion.div>
                    <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Modern Image Gallery */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-5xl mx-auto"
          >
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold mb-2">Jornada de Sucesso</h3>
              <p className="text-muted-foreground">Veja como transformamos creators em profissionais</p>
            </div>
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
                      whileHover={{ scale: 1.05, y: -5 }}
                      transition={{ duration: 0.3 }}
                      className="p-1"
                    >
                      <Card className="group overflow-hidden border-border/50 hover:border-primary hover:shadow-glow-primary transition-smooth">
                        <div className="relative overflow-hidden">
                          <img
                            src={image.src}
                            alt={image.title}
                            className="w-full h-64 object-cover group-hover:scale-110 transition-smooth"
                          />
                          <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-20 transition-smooth" />
                          <Badge className="absolute top-4 right-4 bg-accent/90 backdrop-blur">
                            Benefício {index + 1}
                          </Badge>
                        </div>
                        <CardContent className="p-5 bg-card/90 backdrop-blur">
                          <h3 className="font-bold text-lg mb-1 text-gradient-primary">{image.title}</h3>
                          <p className="text-sm text-muted-foreground">{image.subtitle}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-2" />
              <CarouselNext className="right-2" />
            </Carousel>
          </motion.div>
        </div>
      </section>

      {/* Process Section */}
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
              Como Funciona o Processo
            </h2>
            <div className="space-y-4">
              {[
                { step: "01", title: "Inscrição", description: "Preencha o formulário e conte sobre seu canal, audiência e objetivos." },
                { step: "02", title: "Avaliação", description: "Nossa equipe analisa seu perfil e potencial de crescimento." },
                { step: "03", title: "Onboarding", description: "Reunião inicial para alinhar expectativas e criar seu plano personalizado." },
                { step: "04", title: "Treinamento", description: "Acesso à nossa plataforma de cursos e mentoria individual." },
                { step: "05", title: "Primeiras Campanhas", description: "Conectamos você com marcas alinhadas ao seu conteúdo." },
              ].map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex gap-4 items-start glass-card p-4 hover:border-primary/30 transition-all"
                >
                  <motion.div 
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm shadow-glow-primary"
                  >
                    {item.step}
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-primary relative overflow-hidden">
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
              Pronto para Decolar sua Carreira?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Entre para a lista VIP e seja um dos próximos streamers SKY BRASIL
            </p>
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
                <Link to="/vip">Quero Ser Streamer Agora</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default ForStreamers;