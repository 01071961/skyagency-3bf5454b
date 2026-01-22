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
  Handshake,
  DollarSign,
  Video,
  Palette,
  MessageCircle,
} from "lucide-react";
import { useRef } from "react";
import Autoplay from "embla-carousel-autoplay";
import streamersHero from "@/assets/streamers-hero.jpg";
import streamersSuccess from "@/assets/streamers-success.jpg";
import streamersTraining from "@/assets/streamers-training.jpg";

const ForStreamers = () => {
  const plugin = useRef(Autoplay({ delay: 3500, stopOnInteraction: false }));
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 300], [0, -50]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

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
                Venha ser um Streamer SKY
              </h1>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <p className="text-xl md:text-2xl text-foreground/90 mb-8 leading-relaxed">
                Treinamos você para se tornar um creator de alta conversão para marcas,
                com carreira sustentável e crescimento consistente.
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
                <Link to="/vip">Quero Ser Streamer</Link>
              </Button>
              <Button 
                variant="secondary" 
                size="lg" 
                asChild
                className="hover-scale"
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
      </section>

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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -10 }}
                >
                  <Card className="h-full bg-card/50 backdrop-blur border-border hover:border-primary transition-smooth hover:glow-primary group">
                    <CardContent className="p-6">
                      <motion.div
                        whileHover={{ rotate: 360, scale: 1.1 }}
                        transition={{ duration: 0.6 }}
                        className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 group-hover:bg-primary/20 transition-smooth"
                      >
                        <Icon className="w-8 h-8 text-primary" />
                      </motion.div>
                      <h3 className="text-xl font-semibold mb-3">{benefit.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {benefit.description}
                      </p>
                    </CardContent>
                  </Card>
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
            <div className="space-y-6">
              {[
                {
                  step: "01",
                  title: "Inscrição",
                  description:
                    "Preencha o formulário e conte sobre seu canal, audiência e objetivos.",
                },
                {
                  step: "02",
                  title: "Avaliação",
                  description:
                    "Nossa equipe analisa seu perfil e potencial de crescimento.",
                },
                {
                  step: "03",
                  title: "Onboarding",
                  description:
                    "Reunião inicial para alinhar expectativas e criar seu plano personalizado.",
                },
                {
                  step: "04",
                  title: "Treinamento",
                  description:
                    "Acesso à nossa plataforma de cursos e mentoria individual.",
                },
                {
                  step: "05",
                  title: "Primeiras Campanhas",
                  description:
                    "Começamos a conectar você com marcas alinhadas ao seu conteúdo.",
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
                    className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-xl shadow-glow-primary"
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