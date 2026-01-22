import { motion } from "framer-motion";
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
} from "lucide-react";

const About = () => {
  const features = [
    {
      icon: Target,
      title: "Acesso a Marcas",
      description:
        "Conectamos você diretamente com as melhores marcas do mercado, criando parcerias estratégicas e lucrativas.",
    },
    {
      icon: TrendingUp,
      title: "Monetizar seu Conteúdo",
      description:
        "Transforme suas lives em fonte de renda sustentável com estratégias comprovadas de monetização.",
    },
    {
      icon: Sparkles,
      title: "Treinamento Especializado",
      description:
        "Aprenda estratégias de alta conversão com nossos experts em marketing de influência e streaming.",
    },
    {
      icon: Shield,
      title: "Estratégia Personalizada",
      description:
        "Criamos um plano sob medida para seu crescimento, respeitando seu estilo e público.",
    },
    {
      icon: BarChart3,
      title: "Suporte OBS",
      description:
        "Configuração técnica completa para suas lives, incluindo overlays, alerts e otimização.",
    },
    {
      icon: Award,
      title: "Identidade Visual",
      description:
        "Branding profissional completo para se destacar e criar uma marca forte e memorável.",
    },
    {
      icon: Users,
      title: "Comunidade Exclusiva",
      description:
        "Rede de creators para networking, trocas de experiências e crescimento conjunto.",
    },
    {
      icon: Zap,
      title: "Mentoria de Conteúdo",
      description:
        "Orientação contínua para melhorar suas lives, engajamento e resultados.",
    },
  ];

  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Por que escolher a{" "}
            <span className="text-gradient-primary">Sky Brasil</span>?
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Nós não só representamos – te transformamos em um criador estratégico.
            Desde 2020, ajudamos streamers a crescer, monetizar e se posicionar de
            forma profissional no mercado digital.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full bg-card/50 backdrop-blur border-border hover:border-primary transition-smooth hover:glow-primary group">
                  <CardContent className="p-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 group-hover:bg-primary/20 transition-smooth">
                      <Icon className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Mission Statement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-20 text-center max-w-4xl mx-auto"
        >
          <Card className="bg-gradient-primary p-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Nossa Missão
            </h2>
            <p className="text-lg text-white/90 leading-relaxed">
              Transformar streamers em creators profissionais, criando pontes entre
              talento e oportunidade. Acreditamos que conteúdo de qualidade merece
              remuneração justa e sustentável. Nossa experiência desde 2020 nos
              posiciona como líderes em gestão de creators no Brasil.
            </p>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default About;
