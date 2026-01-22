import { motion, useScroll, useTransform } from "framer-motion";
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
  UserPlus,
  CheckCircle,
  Sparkles,
  Target,
  BarChart3,
  Zap,
} from "lucide-react";
import { useRef } from "react";
import Autoplay from "embla-carousel-autoplay";
import { HowItWorksHeroScene } from "@/components/3d/HowItWorksHeroScene";
import howItWorksHero from "@/assets/how-it-works-hero.jpg";
import processOnboarding from "@/assets/process-onboarding.jpg";
import processLaunch from "@/assets/process-launch.jpg";

const HowItWorks = () => {
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
    { src: howItWorksHero, title: "Jornada de Crescimento", subtitle: "Do Iniciante ao Profissional" },
    { src: processOnboarding, title: "Processo de Inscrição", subtitle: "Rápido e Simples" },
    { src: processLaunch, title: "Lançamento de Sucesso", subtitle: "Alce Voo com a SKY" },
  ];

  const steps = [
    {
      icon: UserPlus,
      title: "1. Inscrição",
      description:
        "Preencha nosso formulário detalhado contando sobre você, seu canal, audiência e objetivos profissionais.",
      color: "primary",
    },
    {
      icon: CheckCircle,
      title: "2. Onboarding",
      description:
        "Nossa equipe analisa seu perfil e agenda uma reunião para conhecer você melhor e alinhar expectativas.",
      color: "secondary",
    },
    {
      icon: Sparkles,
      title: "3. Treinamento e Identidade",
      description:
        "Acesso completo à nossa plataforma de cursos, desenvolvimento de branding e configuração técnica.",
      color: "accent",
    },
    {
      icon: Target,
      title: "4. Conexão com Marcas",
      description:
        "Começamos a conectar você com marcas alinhadas ao seu conteúdo e audiência para campanhas estratégicas.",
      color: "primary",
    },
    {
      icon: BarChart3,
      title: "5. Execução de Campanhas + Relatórios",
      description:
        "Você executa as campanhas com nosso suporte, e nós fornecemos relatórios detalhados de performance e resultados.",
      color: "secondary",
    },
  ];

  return (
    <div ref={containerRef} className="min-h-screen overflow-hidden">
      {/* Hero Section with 3D WebGL Effects and Parallax */}
      <motion.section 
        style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
      >
        <HowItWorksHeroScene />
        
        {/* Background Carousel with modern styling */}
        <div className="absolute inset-0 w-full h-full overflow-hidden opacity-30">
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
                Processo Estruturado
              </Badge>
              <h1 className="text-6xl md:text-8xl font-bold mb-8 drop-shadow-glow animate-fade-in">
                Como <span className="text-gradient-primary">Funciona</span>
              </h1>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <p className="text-xl md:text-3xl text-foreground/90 mb-8 leading-relaxed drop-shadow-lg">
                Do cadastro às primeiras campanhas, veja o passo a passo para se tornar
                um Streamer <span className="text-gradient-secondary font-bold">SKY BRASIL</span>
              </p>
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

      {/* Timeline Section */}
      <section className="py-20 bg-gradient-tech relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
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
              Seu Caminho para o Sucesso
            </h2>
            <p className="text-lg text-muted-foreground">
              Processo estruturado e transparente para sua jornada profissional
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto space-y-6 mb-16">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isEven = index % 2 === 0;

              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, x: isEven ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className={`flex flex-col md:flex-row gap-4 items-center ${
                    isEven ? "" : "md:flex-row-reverse"
                  }`}
                >
                  {/* Icon */}
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className="flex-shrink-0"
                  >
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-glow-primary">
                      <Icon className="w-8 h-8 md:w-10 md:h-10 text-white" />
                    </div>
                  </motion.div>

                  {/* Content */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                    className="flex-1"
                  >
                    <div className="glass-card p-5 md:p-6 hover:border-primary/30 transition-all">
                      <h3 className="text-lg md:text-xl font-bold mb-2">{step.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </motion.div>
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
              <h3 className="text-3xl font-bold mb-2">Jornada Visual</h3>
              <p className="text-muted-foreground">Conheça as etapas do processo</p>
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
                            Etapa {index + 1}
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

      {/* Bottom CTA */}
      <section className="py-16 md:py-20 bg-background relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="glass-card p-8 md:p-10 max-w-3xl mx-auto hover:border-primary/30 transition-all">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">Simples e Transparente</h2>
              <p className="text-sm md:text-base text-muted-foreground mb-6 max-w-xl mx-auto">
                Nosso processo é estruturado para garantir todo o suporte necessário em cada etapa da sua jornada como creator profissional.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <motion.a
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  href="/vip"
                  className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-semibold text-sm shadow-glow-primary transition-all"
                >
                  Começar Agora
                </motion.a>
                <motion.a
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  href="/contato"
                  className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-muted hover:bg-muted/80 font-semibold text-sm transition-all"
                >
                  Tirar Dúvidas
                </motion.a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HowItWorks;