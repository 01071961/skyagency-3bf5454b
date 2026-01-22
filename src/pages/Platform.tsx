import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, Suspense, lazy } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Smartphone,
  Database,
  Video,
  Gift,
  Sparkles,
  Shield,
  TrendingUp,
  Users,
  DollarSign,
  Zap,
  Code,
  Rocket,
  BarChart3,
  Lock,
  Globe,
  MessageSquare,
  Star,
  CheckCircle2,
  Play,
  Diamond,
  Cpu,
  Layers,
} from "lucide-react";
import { Link } from "react-router-dom";

// Lazy load 3D components for performance
const PlatformScene = lazy(() => 
  import("@/components/3d/PlatformScene").then(m => ({ default: m.PlatformScene }))
);
const DiamondConstellation = lazy(() => 
  import("@/components/3d/DiamondConstellation").then(m => ({ default: m.DiamondConstellation }))
);

const Platform = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });
  
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);
  
  const [activeTab, setActiveTab] = useState("estrutura");

  const estruturaInicial = [
    {
      title: "Frontend (App e Site)",
      icon: Smartphone,
      items: [
        "Interface de vídeos curtos",
        "Interface de lives",
        "Página de perfil",
        "Loja de diamantes",
        "Efeitos e presentes personalizados",
      ],
    },
    {
      title: "Backend",
      icon: Database,
      items: [
        "Sistema de upload e streaming de vídeo",
        "Banco de dados de usuários, vídeos, presentes e diamantes",
        "Sistema de autenticação (login, cadastro, segurança)",
        "Painel de administração",
      ],
    },
  ];

  const funcionalidades = [
    {
      icon: Video,
      title: "Vídeos Curtos",
      items: ["Upload e edição", "Feed personalizado", "Curtidas, comentários e compartilhamentos"],
    },
    {
      icon: MessageSquare,
      title: "Lives",
      items: ["Transmissão em tempo real", "Chat ao vivo", "Envio de presentes"],
    },
    {
      icon: Gift,
      title: "Presentes Virtuais",
      items: [
        "Catálogo de presentes (design exclusivo)",
        "Conversão em diamantes",
        "Ranking de usuários",
      ],
    },
    {
      icon: Sparkles,
      title: "Efeitos Visuais",
      items: [
        "Biblioteca de filtros e efeitos",
        "Ferramenta de criação e personalização",
      ],
    },
  ];

  const sistemaDiamantes = [
    {
      icon: DollarSign,
      title: "Compra de Diamantes",
      description: "Integração com meios de pagamento e loja própria com revenda",
    },
    {
      icon: Star,
      title: "Uso de Diamantes",
      description: "Envio de presentes, acesso a conteúdos exclusivos e monetização para criadores",
    },
    {
      icon: TrendingUp,
      title: "Revenda Própria",
      description: "Painel de revendedores, controle de estoque e comissão, sistema antifraude",
    },
  ];

  const tecnologias = [
    { categoria: "Frontend", tech: "React Native (Mobile) + React.js/Next.js (Web)", descricao: "Interface responsiva e performática" },
    { categoria: "Backend", tech: "Node.js + Express/NestJS", descricao: "APIs robustas e escaláveis" },
    { categoria: "Banco de Dados", tech: "PostgreSQL + MongoDB + Redis", descricao: "Dados estruturados, flexíveis e cache rápido" },
    { categoria: "Streaming", tech: "AWS MediaConvert, Mux, Cloudflare Stream", descricao: "Entrega de vídeo de alta qualidade" },
    { categoria: "Armazenamento", tech: "Amazon S3 / Firebase Storage", descricao: "Armazenamento escalável de arquivos" },
    { categoria: "Infraestrutura", tech: "Docker + Kubernetes + AWS/GCP", descricao: "Microserviços e escalabilidade automática" },
  ];

  const roadmap = [
    { fase: "Fase 1", titulo: "Planejamento e Protótipo", duracao: "Semanas 1-4", items: ["Pesquisa de mercado e benchmarking", "Definição de funcionalidades essenciais", "Criação de wireframes e protótipos", "Escolha de tecnologias e arquitetura"] },
    { fase: "Fase 2", titulo: "Desenvolvimento do MVP", duracao: "Semanas 5-12", items: ["Backend: autenticação, upload de vídeos, streaming básico", "Frontend: feed de vídeos, perfil, editor simples", "Lives: transmissão básica e chat ao vivo", "Sistema de diamantes e presentes virtuais"] },
    { fase: "Fase 3", titulo: "Lançamento Beta e Expansão", duracao: "Semanas 13-20", items: ["Lançamento beta com influenciadores", "Efeitos visuais e filtros personalizados", "Loja de diamantes com pagamentos", "Painel administrativo completo"] },
    { fase: "Fase 4", titulo: "Lançamento Oficial e Escala", duracao: "Semanas 21-24", items: ["Campanhas de marketing e afiliados", "Algoritmo de recomendação", "CDN e otimização global", "Monitoramento e suporte 24h"] },
  ];

  const diferenciais = [
    "Sistema próprio de revenda de diamantes",
    "Efeitos personalizados e exclusivos",
    "Monetização direta para criadores regionais",
    "Ecossistema de microempreendedores",
    "Foco em criadores locais da América Latina",
    "Maior controle e transparência para usuários",
  ];

  const seguranca = [
    { icon: Lock, title: "Proteção de Dados", desc: "Criptografia AES-256, TLS/SSL e autenticação 2FA" },
    { icon: Shield, title: "Moderação de Conteúdo", desc: "IA + equipe humana para filtrar conteúdo impróprio" },
    { icon: CheckCircle2, title: "Segurança de Pagamentos", desc: "Integração com gateways confiáveis e tokenização" },
    { icon: Globe, title: "Escalabilidade", desc: "Microserviços, CDN e infraestrutura em nuvem" },
  ];

  return (
    <div ref={containerRef} className="min-h-screen relative overflow-hidden">
      {/* Hero Section with 3D Scene */}
      <motion.section 
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative min-h-screen flex items-center justify-center"
      >
        {/* 3D Background */}
        <div className="absolute inset-0 z-0">
          <Suspense fallback={
            <div className="w-full h-full bg-gradient-to-b from-background via-background/95 to-muted animate-pulse" />
          }>
            <PlatformScene className="w-full h-full" />
          </Suspense>
        </div>
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-background z-10" />
        
        {/* Hero Content */}
        <div className="relative z-20 container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <Diamond className="w-8 h-8 text-primary animate-pulse" />
              <span className="text-primary font-semibold tracking-wider uppercase text-sm">
                Plataforma de Streaming
              </span>
              <Diamond className="w-8 h-8 text-primary animate-pulse" />
            </div>
            
            <h1 className="text-5xl md:text-8xl font-bold mb-6 tracking-tight">
              <span className="text-gradient-primary">SKY</span>{" "}
              <span className="text-foreground">Platform</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
              Uma plataforma revolucionária de vídeos curtos e lives com sistema próprio
              de diamantes e monetização descentralizada.
            </p>
            
            {/* Stats Row */}
            <div className="flex flex-wrap justify-center gap-8 mb-12">
              {[
                { value: "500+", label: "Streamers" },
                { value: "R$2M+", label: "Receita" },
                { value: "150+", label: "Marcas" },
                { value: "98%", label: "Satisfação" },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-3xl md:text-4xl font-bold text-gradient-primary">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="group relative overflow-hidden bg-gradient-to-r from-primary to-purple-600 hover:shadow-lg hover:shadow-primary/30 transition-all" asChild>
                <Link to="/vip">
                  <span className="relative z-10 flex items-center gap-2">
                    <Rocket className="w-5 h-5" />
                    Entrar na Lista VIP
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-primary/50 hover:bg-primary/10" asChild>
                <Link to="/streamers">
                  <Play className="w-5 h-5 mr-2" />
                  Saiba Mais
                </Link>
              </Button>
            </div>
          </motion.div>
          
          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-6 h-10 border-2 border-primary/50 rounded-full flex justify-center"
            >
              <motion.div
                animate={{ y: [0, 12, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-1.5 h-3 bg-primary rounded-full mt-2"
              />
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Differentials Section */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Por que <span className="text-gradient-primary">SKY</span>?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Diferenciais que fazem da SKY a melhor escolha para criadores de conteúdo.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {diferenciais.map((diff, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="p-4 rounded-xl bg-card/50 backdrop-blur border border-border hover:border-primary/50 transition-all cursor-default group"
              >
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-primary group-hover:animate-pulse" />
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    {diff}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Diamond System with 3D Visualization */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Sistema de <span className="text-gradient-primary">Diamantes</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Uma economia virtual completa para monetização de criadores.
            </p>
          </motion.div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* 3D Diamond Constellation */}
            <div className="h-[400px] relative order-2 lg:order-1">
              <Suspense fallback={
                <div className="w-full h-full flex items-center justify-center">
                  <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              }>
                <DiamondConstellation className="w-full h-full" />
              </Suspense>
              
              {/* Labels */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4 flex-wrap justify-center">
                {['Bronze', 'Prata', 'Ouro', 'Platina', 'Diamante'].map((tier, i) => (
                  <span key={tier} className="px-3 py-1 bg-card/80 backdrop-blur rounded-full text-xs border border-border">
                    {tier}
                  </span>
                ))}
              </div>
            </div>
            
            {/* Diamond Features */}
            <div className="space-y-6 order-1 lg:order-2">
              {sistemaDiamantes.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.15 }}
                  >
                    <Card className="bg-card/50 backdrop-blur border-border hover:border-primary/50 transition-all group">
                      <CardContent className="p-6 flex items-start gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Icon className="w-7 h-7 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                          <p className="text-muted-foreground">{item.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Tabs Section */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/10 to-transparent" />
        <div className="container mx-auto px-4 relative z-10">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-3xl mx-auto grid-cols-2 md:grid-cols-4 mb-12 bg-card/50 backdrop-blur">
              <TabsTrigger value="estrutura" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Layers className="w-4 h-4 mr-2" />
                Estrutura
              </TabsTrigger>
              <TabsTrigger value="funcionalidades" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Cpu className="w-4 h-4 mr-2" />
                Funções
              </TabsTrigger>
              <TabsTrigger value="tecnologias" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Code className="w-4 h-4 mr-2" />
                Tech
              </TabsTrigger>
              <TabsTrigger value="roadmap" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Rocket className="w-4 h-4 mr-2" />
                Roadmap
              </TabsTrigger>
            </TabsList>

            {/* Estrutura */}
            <TabsContent value="estrutura" className="space-y-12">
              <div className="grid md:grid-cols-2 gap-8">
                {estruturaInicial.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="h-full bg-card/50 backdrop-blur border-border hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all">
                        <CardHeader>
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/30">
                              <Icon className="w-6 h-6 text-white" />
                            </div>
                            <CardTitle className="text-2xl">{item.title}</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-3">
                            {item.items.map((subItem, i) => (
                              <li key={i} className="flex items-start gap-3 group">
                                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                                <span className="text-muted-foreground group-hover:text-foreground transition-colors">{subItem}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>

              {/* Security */}
              <div className="mt-16">
                <h2 className="text-3xl font-bold text-center mb-12">
                  Segurança e <span className="text-gradient-primary">Escalabilidade</span>
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {seguranca.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <motion.div
                        key={item.title}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ y: -5 }}
                      >
                        <Card className="h-full bg-card/50 backdrop-blur border-border text-center hover:border-primary/50 transition-all">
                          <CardContent className="p-6">
                            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                              <Icon className="w-6 h-6 text-primary" />
                            </div>
                            <h3 className="font-bold mb-2">{item.title}</h3>
                            <p className="text-sm text-muted-foreground">{item.desc}</p>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            {/* Funcionalidades */}
            <TabsContent value="funcionalidades" className="space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                {funcionalidades.map((func, index) => {
                  const Icon = func.icon;
                  return (
                    <motion.div
                      key={func.title}
                      initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="h-full bg-card/50 backdrop-blur border-border hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all">
                        <CardHeader>
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/30">
                              <Icon className="w-7 h-7 text-white" />
                            </div>
                            <CardTitle className="text-2xl">{func.title}</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-3">
                            {func.items.map((item, i) => (
                              <li key={i} className="flex items-start gap-3 group">
                                <Zap className="w-5 h-5 text-primary flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                                <span className="text-muted-foreground group-hover:text-foreground transition-colors">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>

              {/* Admin Panel */}
              <Card className="mt-12 bg-card/50 backdrop-blur border-border overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
                <CardHeader className="relative">
                  <CardTitle className="text-3xl flex items-center gap-3">
                    <BarChart3 className="w-8 h-8 text-primary" />
                    Painel Administrativo
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <div className="grid md:grid-cols-2 gap-6">
                    {[
                      { icon: Users, title: "Gerenciamento de Usuários", desc: "Controle completo sobre perfis, banimentos, verificações e histórico de atividades." },
                      { icon: Shield, title: "Moderação de Conteúdo", desc: "Sistema automatizado + humano para filtrar denúncias e conteúdo impróprio." },
                      { icon: BarChart3, title: "Métricas e Relatórios", desc: "Indicadores em tempo real, crescimento, engajamento e receita por canal." },
                      { icon: DollarSign, title: "Gestão de Diamantes", desc: "Controle de estoque, histórico de vendas e aprovação de revendedores." },
                    ].map((item, index) => {
                      const Icon = item.icon;
                      return (
                        <motion.div 
                          key={item.title}
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: index * 0.1 }}
                          className="group"
                        >
                          <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                            <Icon className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                            {item.title}
                          </h4>
                          <p className="text-muted-foreground">{item.desc}</p>
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tecnologias */}
            <TabsContent value="tecnologias" className="space-y-6">
              {tecnologias.map((tech, index) => (
                <motion.div
                  key={tech.categoria}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-card/50 backdrop-blur border-border hover:border-primary/50 transition-all overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardContent className="p-6 relative">
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex-shrink-0">
                          <span className="inline-block px-4 py-2 bg-gradient-to-r from-primary to-purple-600 text-white rounded-lg font-bold shadow-lg shadow-primary/30">
                            {tech.categoria}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg mb-1">{tech.tech}</h3>
                          <p className="text-muted-foreground">{tech.descricao}</p>
                        </div>
                        <Code className="w-8 h-8 text-primary flex-shrink-0 group-hover:rotate-12 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </TabsContent>

            {/* Roadmap */}
            <TabsContent value="roadmap" className="space-y-8">
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-purple-500 to-secondary hidden md:block" />
                
                {roadmap.map((fase, index) => (
                  <motion.div
                    key={fase.fase}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.15 }}
                    className="relative pl-0 md:pl-20 mb-8"
                  >
                    {/* Timeline dot */}
                    <div className="absolute left-6 top-6 w-4 h-4 bg-primary rounded-full hidden md:block shadow-lg shadow-primary/50">
                      <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-30" />
                    </div>
                    
                    <Card className="bg-card/50 backdrop-blur border-border hover:border-primary/50 transition-all overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-purple-500 to-secondary" />
                      <CardHeader>
                        <div className="flex flex-wrap items-center gap-4">
                          <span className="px-4 py-2 bg-gradient-to-r from-primary to-purple-600 text-white rounded-lg font-bold text-lg shadow-lg shadow-primary/30">
                            {fase.fase}
                          </span>
                          <div>
                            <CardTitle className="text-2xl">{fase.titulo}</CardTitle>
                            <span className="text-sm text-muted-foreground">{fase.duracao}</span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ul className="grid md:grid-cols-2 gap-3">
                          {fase.items.map((item, i) => (
                            <li key={i} className="flex items-start gap-3 group">
                              <Rocket className="w-5 h-5 text-primary flex-shrink-0 mt-0.5 group-hover:translate-x-1 transition-transform" />
                              <span className="text-muted-foreground group-hover:text-foreground transition-colors">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px] animate-pulse" />
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              Pronto para <span className="text-gradient-primary">Transformar</span> sua Carreira?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Junte-se aos criadores que já estão revolucionando o mercado de streaming.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-purple-600 hover:shadow-xl hover:shadow-primary/30 transition-all" asChild>
                <Link to="/vip">
                  <Rocket className="w-5 h-5 mr-2" />
                  Entrar na Lista VIP Agora
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-primary/50 hover:bg-primary/10" asChild>
                <Link to="/contato">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Falar com Especialista
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Platform;
