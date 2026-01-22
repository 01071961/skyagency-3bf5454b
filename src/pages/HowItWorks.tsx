import { motion, useScroll, useTransform } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
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
} from "lucide-react";
import { useRef } from "react";
import Autoplay from "embla-carousel-autoplay";
import howItWorksHero from "@/assets/how-it-works-hero.jpg";
import processOnboarding from "@/assets/process-onboarding.jpg";
import processLaunch from "@/assets/process-launch.jpg";

const HowItWorks = () => {
  const plugin = useRef(Autoplay({ delay: 3500, stopOnInteraction: false }));
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 300], [0, -50]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

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
    <div className="min-h-screen overflow-hidden">
      {/* Hero Section with Carousel */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Carousel */}
        <div className="absolute inset-0">
          <Carousel
            plugins={[plugin.current]}
            className="w-full h-full"
            opts={{
              loop: true,
            }}
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
                    <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/80 to-background/95" />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>

        <motion.div
          style={{ y, opacity }}
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
                Como Funciona
              </h1>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <p className="text-xl md:text-2xl text-foreground/90 mb-8 leading-relaxed">
                Do cadastro às primeiras campanhas, veja o passo a passo para se tornar
                um Streamer SKY BRASIL
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
      </section>

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

          <div className="max-w-4xl mx-auto space-y-8 mb-16">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isEven = index % 2 === 0;

              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className={`flex flex-col md:flex-row gap-6 items-center ${
                    isEven ? "" : "md:flex-row-reverse"
                  }`}
                >
                  {/* Icon */}
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className="flex-shrink-0"
                  >
                    <div className="w-24 h-24 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow-primary">
                      <Icon className="w-12 h-12 text-white" />
                    </div>
                  </motion.div>

                  {/* Content */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="flex-1 bg-card/50 backdrop-blur border-border hover:border-primary transition-smooth hover:glow-primary">
                      <CardContent className="p-8">
                        <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          {step.description}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
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
                      <Card className="overflow-hidden border-border hover:border-primary transition-smooth">
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

      {/* Bottom CTA */}
      <section className="py-20 bg-background relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <Card className="bg-gradient-tech p-12 max-w-3xl mx-auto border-border hover:border-primary transition-smooth">
              <h2 className="text-3xl font-bold mb-4">Simples e Transparente</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Nosso processo é estruturado para garantir que você tenha todo o
                suporte necessário em cada etapa da sua jornada como creator
                profissional.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.a
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  href="/vip"
                  className="inline-flex items-center justify-center px-8 py-3 rounded-md bg-gradient-primary text-white font-semibold hover:shadow-glow-primary transition-smooth"
                >
                  Começar Agora
                </motion.a>
                <motion.a
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  href="/contato"
                  className="inline-flex items-center justify-center px-8 py-3 rounded-md bg-secondary text-secondary-foreground font-semibold hover:bg-secondary/80 transition-smooth"
                >
                  Tirar Dúvidas
                </motion.a>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HowItWorks;