import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Target,
  TrendingUp,
  Users,
  Award,
  Sparkles,
  Shield,
  BarChart3,
  Zap,
  ArrowRight,
  CheckCircle,
  Crown,
  Calendar,
  Globe,
} from "lucide-react";

const About = () => {
  const features = [
    {
      icon: Target,
      title: "Acesso a Marcas",
      description: "Conectamos você diretamente com as melhores marcas do mercado, criando parcerias estratégicas e lucrativas.",
      color: "primary",
    },
    {
      icon: TrendingUp,
      title: "Monetizar seu Conteúdo",
      description: "Transforme suas lives em fonte de renda sustentável com estratégias comprovadas de monetização.",
      color: "secondary",
    },
    {
      icon: Sparkles,
      title: "Treinamento Especializado",
      description: "Aprenda estratégias de alta conversão com nossos experts em marketing de influência e streaming.",
      color: "accent",
    },
    {
      icon: Shield,
      title: "Estratégia Personalizada",
      description: "Criamos um plano sob medida para seu crescimento, respeitando seu estilo e público.",
      color: "primary",
    },
    {
      icon: BarChart3,
      title: "Suporte OBS",
      description: "Configuração técnica completa para suas lives, incluindo overlays, alerts e otimização.",
      color: "secondary",
    },
    {
      icon: Award,
      title: "Identidade Visual",
      description: "Branding profissional completo para se destacar e criar uma marca forte e memorável.",
      color: "accent",
    },
    {
      icon: Users,
      title: "Comunidade Exclusiva",
      description: "Rede de creators para networking, trocas de experiências e crescimento conjunto.",
      color: "primary",
    },
    {
      icon: Zap,
      title: "Mentoria de Conteúdo",
      description: "Orientação contínua para melhorar suas lives, engajamento e resultados.",
      color: "secondary",
    },
  ];

  const stats = [
    { value: "500+", label: "Creators Atendidos", icon: Users },
    { value: "2020", label: "Desde", icon: Calendar },
    { value: "50+", label: "Marcas Parceiras", icon: Globe },
    { value: "98%", label: "Satisfação", icon: Award },
  ];

  const timeline = [
    { year: "2020", title: "Fundação", desc: "Início da SKY BRASIL com foco em streamers" },
    { year: "2021", title: "Expansão", desc: "Parcerias com grandes marcas do mercado" },
    { year: "2022", title: "Plataforma", desc: "Lançamento da plataforma própria" },
    { year: "2023", title: "VIP", desc: "Programa VIP para creators de elite" },
    { year: "2024", title: "Inovação", desc: "IA e ferramentas avançadas" },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <div className="relative pt-32 pb-20">
        <div className="container mx-auto px-4">
          {/* Hero Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto mb-20"
          >
            {/* Glass Badge */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-background/30 backdrop-blur-xl border border-white/10 shadow-lg mb-8"
            >
              <Crown className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-sm font-medium text-gradient-primary">Sobre Nós</span>
            </motion.div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Por que escolher a{" "}
              <span className="text-gradient-primary">Sky Brasil</span>?
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed mb-8">
              Nós não só representamos – te transformamos em um criador estratégico.
              Desde 2020, ajudamos streamers a crescer, monetizar e se posicionar de
              forma profissional no mercado digital.
            </p>
            
            <div className="flex flex-wrap gap-4 justify-center">
              <Button variant="glow" size="lg" asChild>
                <Link to="/vip">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Entrar para Lista VIP
                </Link>
              </Button>
              <Button variant="glass" size="lg" asChild>
                <Link to="/contato">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Fale Conosco
                </Link>
              </Button>
            </div>
          </motion.div>

          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-20"
          >
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="p-6 rounded-2xl bg-background/40 backdrop-blur-xl border border-white/10 text-center group hover:border-primary/30 transition-all"
                >
                  <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-3xl font-bold text-gradient-primary mb-1">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Features Grid - Premium Cards */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mb-20"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Nossos <span className="text-gradient-primary">Diferenciais</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Oferecemos soluções completas para transformar sua carreira de creator
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 + index * 0.05 }}
                    whileHover={{ y: -8 }}
                    className="group"
                  >
                    <Card className="h-full bg-background/40 backdrop-blur-xl border-white/10 hover:border-primary/40 transition-all duration-500 overflow-hidden">
                      <CardContent className="p-6 relative">
                        {/* Gradient hover effect */}
                        <div className={`absolute inset-0 bg-gradient-to-br from-${feature.color}/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                        
                        <div className={`relative inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-${feature.color}/10 border border-${feature.color}/20 mb-4 group-hover:scale-110 transition-transform duration-300`}>
                          <Icon className={`w-7 h-7 text-${feature.color}`} />
                        </div>
                        <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {feature.description}
                        </p>
                        
                        <div className="mt-4 pt-4 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link to="/contato" className="inline-flex items-center text-sm text-primary hover:underline">
                            Saiba mais
                            <ArrowRight className="w-3 h-3 ml-1" />
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Timeline Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Nossa <span className="text-gradient-primary">Jornada</span>
              </h2>
              <p className="text-muted-foreground">Anos de dedicação ao mercado de creators</p>
            </div>
            
            <div className="relative max-w-4xl mx-auto">
              {/* Timeline line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 via-secondary/50 to-accent/50 hidden md:block" />
              
              <div className="space-y-8">
                {timeline.map((item, index) => (
                  <motion.div
                    key={item.year}
                    initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center gap-4 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                  >
                    <div className={`flex-1 ${index % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}>
                      <div className="p-5 rounded-2xl bg-background/40 backdrop-blur-xl border border-white/10 hover:border-primary/30 transition-colors inline-block">
                        <div className="text-2xl font-bold text-gradient-primary mb-1">{item.year}</div>
                        <div className="font-semibold mb-1">{item.title}</div>
                        <div className="text-sm text-muted-foreground">{item.desc}</div>
                      </div>
                    </div>
                    
                    <div className="w-4 h-4 rounded-full bg-primary border-4 border-background shadow-glow-primary hidden md:block z-10" />
                    
                    <div className="flex-1 hidden md:block" />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Mission Statement */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            <div className="relative overflow-hidden rounded-3xl">
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-accent opacity-90" />
              
              {/* Glass overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
              
              {/* Content */}
              <div className="relative p-10 md:p-14 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center"
                >
                  <Target className="w-8 h-8 text-white" />
                </motion.div>
                
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                  Nossa Missão
                </h2>
                <p className="text-lg text-white/90 leading-relaxed mb-8 max-w-2xl mx-auto">
                  Transformar streamers em creators profissionais, criando pontes entre
                  talento e oportunidade. Acreditamos que conteúdo de qualidade merece
                  remuneração justa e sustentável.
                </p>
                
                <div className="flex flex-wrap justify-center gap-4 mb-8">
                  {["Inovação", "Transparência", "Resultados", "Comunidade"].map((value) => (
                    <div key={value} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm">
                      <CheckCircle className="w-4 h-4 text-white" />
                      <span className="text-sm text-white font-medium">{value}</span>
                    </div>
                  ))}
                </div>
                
                <Button variant="glass" size="lg" asChild className="bg-white/20 hover:bg-white/30 text-white border-white/20">
                  <Link to="/streamers">
                    Conheça nossas soluções
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default About;
