import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  DollarSign, Users, Zap, Gift, TrendingUp, CheckCircle, 
  Star, Award, Target, Sparkles, ArrowRight, Crown,
  Monitor, Mic, Camera, Wifi
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SEOHead from "@/components/SEOHead";

const Affiliates = () => {
  const navigate = useNavigate();

  const benefits = [
    {
      icon: DollarSign,
      title: "Comissões de 10-30%",
      description: "Ganhe comissões vitalícias por cada venda. Bronze: 10%, Silver: 15%, Gold: 20%, Diamond: 25%, Platinum: 30%."
    },
    {
      icon: Zap,
      title: "Bônus por Volume",
      description: "+5% de comissão adicional quando atingir 10 indicações no mês. Ganhe mais quanto mais indicar!"
    },
    {
      icon: Gift,
      title: "Aprovação Automática",
      description: "Cadastro gratuito com aprovação automática para o tier Bronze. Comece a ganhar imediatamente!"
    },
    {
      icon: Users,
      title: "Materiais Prontos",
      description: "Acesso a banners, templates de posts e estratégias de divulgação para suas redes sociais."
    },
    {
      icon: TrendingUp,
      title: "Tracking em Tempo Real",
      description: "Dashboard completo com estatísticas de cliques, conversões e comissões em tempo real."
    },
    {
      icon: Star,
      title: "Sistema de Tiers",
      description: "Evolua de Bronze a Platinum baseado em pontos. Quanto mais você vende, maior sua comissão!"
    },
  ];

  const tiers = [
    { name: 'Bronze', points: '0-499', commission: '10%', color: 'from-amber-600 to-amber-800' },
    { name: 'Silver', points: '500-1999', commission: '15%', color: 'from-slate-400 to-slate-600' },
    { name: 'Gold', points: '2000-4999', commission: '20%', color: 'from-yellow-400 to-yellow-600' },
    { name: 'Diamond', points: '5000-9999', commission: '25%', color: 'from-cyan-400 to-blue-600' },
    { name: 'Platinum', points: '10000+', commission: '30%', color: 'from-violet-400 to-purple-600' },
  ];

  const steps = [
    { num: "01", title: "Cadastre-se Grátis", desc: "Crie sua conta em menos de 2 minutos" },
    { num: "02", title: "Aprovação Automática", desc: "Tier Bronze aprovado instantaneamente" },
    { num: "03", title: "Pegue seu Link", desc: "Link único personalizado para cada produto" },
    { num: "04", title: "Divulgue e Ganhe", desc: "Compartilhe e receba comissões vitalícias" },
  ];

  const equipment = {
    minimal: [
      { icon: Monitor, name: 'Smartphone', desc: 'Com boa câmera' },
      { icon: Zap, name: 'Ring Light', desc: 'Iluminação básica' },
      { icon: Mic, name: 'Microfone Lapela', desc: 'Áudio limpo' },
    ],
    advanced: [
      { icon: Camera, name: 'Câmera DSLR', desc: 'Qualidade profissional' },
      { icon: Mic, name: 'Interface de Áudio', desc: 'Som de estúdio' },
      { icon: Wifi, name: 'OBS/StreamYard', desc: 'Transmissão pro' },
    ],
  };

  const niches = [
    'Reações', 'Games', 'Aulas e Mentorias', 
    'Entretenimento', 'Vendas ao Vivo', 'Lifestyle'
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Programa de Afiliados SKY - Ganhe Comissões de 10-30%"
        description="Torne-se afiliado SKY e ganhe comissões vitalícias de 10-30% promovendo nossos produtos. Aprovação automática, bônus por volume e sistema de tiers progressivos."
      />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.15),transparent_50%)]" />
        
        <div className="container relative mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-primary">Programa de Afiliados VIP</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Ganhe <span className="text-gradient-primary">Comissões Vitalícias</span>
              <br />
              de 10% a 30%
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Cadastro gratuito com aprovação automática. Evolua de Bronze a Platinum 
              e ganhe mais a cada indicação convertida. Bônus de +5% após 10 indicações/mês!
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                variant="hero" 
                size="lg" 
                className="gap-2"
                onClick={() => navigate('/auth?portal=affiliate')}
              >
                <Award className="w-5 h-5" />
                Tornar-se Afiliado Grátis
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate('/vip/dashboard')}>
                Já sou Afiliado
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-3xl mx-auto">
              {[
                { value: '500+', label: 'Afiliados Ativos' },
                { value: 'R$50K+', label: 'Pago em Comissões' },
                { value: '30%', label: 'Comissão Máxima' },
                { value: '5%', label: 'Bônus Volume' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="text-center"
                >
                  <p className="text-2xl md:text-3xl font-bold text-primary">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tiers Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Sistema de <span className="text-gradient-primary">Tiers Progressivos</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Evolua seu tier baseado em pontos (1 ponto por R$1 em comissões) e desbloqueie taxas maiores
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-5xl mx-auto">
            {tiers.map((tier, i) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="bg-card border-border h-full text-center hover:border-primary/50 transition-all">
                  <CardContent className="p-4">
                    <div className={`w-12 h-12 mx-auto rounded-full bg-gradient-to-r ${tier.color} flex items-center justify-center mb-3`}>
                      <Crown className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-bold text-lg">{tier.name}</h3>
                    <p className="text-2xl font-black text-primary my-2">{tier.commission}</p>
                    <p className="text-xs text-muted-foreground">{tier.points} pontos</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-8"
          >
            <Badge variant="secondary" className="text-sm">
              +5% bônus adicional ao atingir 10 indicações/mês
            </Badge>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Por que ser <span className="text-gradient-primary">Afiliado SKY</span>?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Benefícios exclusivos para nossos parceiros afiliados
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, i) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="bg-card border-border h-full hover:border-primary/50 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <benefit.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">{benefit.title}</h3>
                    <p className="text-muted-foreground text-sm">{benefit.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Como <span className="text-gradient-primary">Funciona</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Comece a ganhar em 4 passos simples
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="text-5xl font-black text-primary/20 mb-4">{step.num}</div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Equipment Guide */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Equipamentos <span className="text-gradient-primary">Essenciais</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Você não precisa começar grande - comece com o básico!
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="h-full">
                <CardContent className="p-6">
                  <Badge className="mb-4 bg-emerald-500/20 text-emerald-400">Setup Mínimo</Badge>
                  <div className="space-y-4">
                    {equipment.minimal.map((item) => (
                      <div key={item.name} className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                          <item.icon className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="h-full border-primary/30">
                <CardContent className="p-6">
                  <Badge className="mb-4 bg-primary/20 text-primary">Setup Avançado</Badge>
                  <div className="space-y-4">
                    {equipment.advanced.map((item) => (
                      <div key={item.name} className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <item.icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Niches */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <p className="text-muted-foreground mb-4">Lives que mais monetizam:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {niches.map((niche) => (
                <Badge key={niche} variant="outline" className="text-sm">
                  {niche}
                </Badge>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Commission Info */}
      <section className="py-20 bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <Card className="bg-card border-primary/20 overflow-hidden">
              <CardContent className="p-8 sm:p-12">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-4">
                    Comissões <span className="text-primary">Vitalícias</span>
                  </h2>
                  <div className="text-6xl font-black text-gradient-primary mb-2">10-30%</div>
                  <p className="text-muted-foreground">por venda convertida</p>
                </div>

                <ul className="space-y-4 mb-8">
                  {[
                    "10% vendas únicas (cursos, e-books)",
                    "20% assinaturas recorrentes (VIP)",
                    "+5% bônus após 10 indicações/mês",
                    "Pagamento via PIX (mínimo R$100)",
                    "Tracking em tempo real no dashboard",
                    "Materiais de marketing prontos",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="text-center">
                  <Button 
                    variant="hero" 
                    size="lg"
                    className="gap-2"
                    onClick={() => navigate('/auth?portal=affiliate')}
                  >
                    <Award className="w-5 h-5" />
                    Começar Agora - É Grátis!
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Pronto para <span className="text-gradient-primary">Ganhar Dinheiro</span>?
            </h2>
            <p className="text-muted-foreground mb-8">
              Cadastre-se gratuitamente e comece a promover nossos produtos hoje mesmo.
              Aprovação automática para tier Bronze!
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                variant="hero" 
                size="lg"
                className="gap-2"
                onClick={() => navigate('/auth?portal=affiliate')}
              >
                <Award className="w-5 h-5" />
                Tornar-se Afiliado
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate('/vendas')}>
                Ver Produtos
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Affiliates;
