import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  GraduationCap, 
  Award, 
  Users, 
  TrendingUp, 
  Star, 
  Shield,
  CheckCircle,
  ArrowRight,
  Crown,
  Sparkles,
  BookOpen,
  Target,
  Zap,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import SEOHead from '@/components/SEOHead';

const Academy = () => {
  const benefits = [
    {
      icon: BookOpen,
      title: 'Certificações Financeiras',
      description: 'Prepare-se para CPA-10, CPA-20, CEA, ANCORD, CFP e CNPI com nossos simulados exclusivos.'
    },
    {
      icon: Target,
      title: 'Metodologia Comprovada',
      description: 'Milhares de questões baseadas nas provas reais, com explicações detalhadas.'
    },
    {
      icon: TrendingUp,
      title: 'Acompanhamento de Progresso',
      description: 'Dashboard completo para monitorar seu desempenho e identificar pontos de melhoria.'
    },
    {
      icon: Award,
      title: 'Certificados Digitais',
      description: 'Receba certificados verificáveis ao concluir cursos e aprovações em simulados.'
    }
  ];

  const vipBenefits = [
    'Comissões de até 25% em todas as vendas',
    'Acesso a produtos exclusivos gratuitos',
    'Sistema MLM com 2 níveis de indicação',
    'Saques via PIX sem burocracia',
    'Materiais de divulgação prontos',
    'Suporte prioritário da equipe'
  ];

  const stats = [
    { value: '10.000+', label: 'Questões' },
    { value: '6', label: 'Certificações' },
    { value: '95%', label: 'Aprovação' },
    { value: '24/7', label: 'Acesso' }
  ];

  return (
    <>
      <SEOHead 
        title="Academia SKY Brasil - Certificações Financeiras"
        description="Prepare-se para as principais certificações do mercado financeiro: CPA-10, CPA-20, CEA, ANCORD, CFP e CNPI. Simulados, cursos e material exclusivo."
      />

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.15),transparent_50%)]" />
          
          <div className="container relative z-10 mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-4xl mx-auto"
            >
              <Badge className="mb-6 bg-primary/10 text-primary border-primary/20">
                <GraduationCap className="h-3 w-3 mr-1" />
                SKY Brasil Academy
              </Badge>
              
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                Sua Jornada para o Sucesso no Mercado Financeiro
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                A plataforma completa para você conquistar as certificações mais importantes do mercado financeiro brasileiro.
              </p>

              <div className="flex flex-wrap justify-center gap-4">
                <Button size="lg" className="gap-2" asChild>
                  <Link to="/loja">
                    <BookOpen className="h-5 w-5" />
                    Ver Cursos
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="gap-2" asChild>
                  <Link to="/vip/affiliate/register">
                    <Crown className="h-5 w-5" />
                    Seja VIP
                  </Link>
                </Button>
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-3xl mx-auto"
            >
              {stats.map((stat, index) => (
                <div 
                  key={index}
                  className="text-center p-4 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm"
                >
                  <div className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* About Platform Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <Badge variant="outline" className="mb-4">
                <Sparkles className="h-3 w-3 mr-1" />
                Nossa Plataforma
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Por que escolher a SKY Brasil Academy?
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Oferecemos a melhor experiência de aprendizado para você conquistar suas certificações.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow border-border/50 bg-card/80">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                        <benefit.icon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-semibold mb-2">{benefit.title}</h3>
                      <p className="text-sm text-muted-foreground">{benefit.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* VIP Section - Call to Action */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/10" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
          
          <div className="container relative z-10 mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <Badge className="mb-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-600 border-yellow-500/30">
                  <Crown className="h-3 w-3 mr-1" />
                  Programa VIP
                </Badge>
                
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Torne-se um Afiliado VIP e{' '}
                  <span className="text-primary">Ganhe Dinheiro</span>
                </h2>
                
                <p className="text-muted-foreground mb-8">
                  Faça parte do nosso programa de afiliados VIP e tenha acesso a benefícios exclusivos. 
                  Ganhe comissões generosas indicando nossos produtos e construa sua rede de sucesso.
                </p>

                <ul className="space-y-3 mb-8">
                  {vipBenefits.map((benefit, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      </div>
                      <span className="text-sm">{benefit}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap gap-4">
                  <Button size="lg" className="gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600" asChild>
                    <Link to="/vip/affiliate/register">
                      <Crown className="h-5 w-5" />
                      Quero Ser VIP
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link to="/afiliados">
                      Saiba Mais
                    </Link>
                  </Button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <Card className="bg-gradient-to-br from-card to-card/80 border-primary/20 shadow-xl">
                  <CardContent className="p-8">
                    <div className="text-center mb-8">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mx-auto mb-4">
                        <DollarSign className="h-10 w-10 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold mb-2">Plano de Negócios</h3>
                      <p className="text-muted-foreground text-sm">
                        Estrutura MLM com 2 níveis de comissão
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Vendas Diretas</span>
                          <Badge className="bg-green-500/20 text-green-600">até 25%</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Comissão em cada venda realizada pelo seu link
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Nível 1 (Rede)</span>
                          <Badge className="bg-blue-500/20 text-blue-600">até 5%</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Ganhe com vendas de quem você indicou
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Nível 2 (Rede)</span>
                          <Badge className="bg-purple-500/20 text-purple-600">até 5%</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Ganhe com vendas dos indicados dos seus indicados
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-border">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Potencial de ganhos:</span>
                        <span className="font-bold text-primary">Ilimitado</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="py-20 bg-gradient-to-r from-primary to-primary/80">
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
                Comece Sua Jornada Hoje
              </h2>
              <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
                Junte-se a milhares de profissionais que já conquistaram suas certificações com a SKY Brasil Academy.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button size="lg" variant="secondary" className="gap-2" asChild>
                  <Link to="/loja">
                    <BookOpen className="h-5 w-5" />
                    Explorar Cursos
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="gap-2 bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
                  <Link to="/auth">
                    <Users className="h-5 w-5" />
                    Criar Conta Grátis
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Academy;
