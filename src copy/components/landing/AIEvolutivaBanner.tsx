import { motion } from "framer-motion";
import { 
  Brain, 
  MessageSquare, 
  TrendingUp, 
  Shield, 
  Zap,
  Users,
  Target,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const features = [
  {
    icon: Brain,
    title: "Aprende com Cada Conversa",
    description: "Nossa IA evolui com base no feedback real dos usuários, melhorando continuamente suas respostas.",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: Target,
    title: "Conversão Inteligente",
    description: "Detecta intenção de compra e apresenta soluções no momento certo, sem ser invasiva.",
    color: "from-green-500 to-emerald-500"
  },
  {
    icon: Users,
    title: "Escalação Suave",
    description: "Quando necessário, transfere para um humano sem perder o contexto da conversa.",
    color: "from-purple-500 to-pink-500"
  },
  {
    icon: Shield,
    title: "Controle Total",
    description: "Administradores podem ajustar comportamentos, desativar modos e supervisionar em tempo real.",
    color: "from-orange-500 to-red-500"
  }
];

const stats = [
  { value: "70%+", label: "Resoluções Automáticas" },
  { value: "4", label: "Modos Adaptativos" },
  { value: "24/7", label: "Disponibilidade" },
  { value: "∞", label: "Aprendizado Contínuo" }
];

export function AIEvolutivaBanner() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Tecnologia Exclusiva</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            IA que <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Aprende e Evolui</span>
            <br />com Seus Clientes
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Enquanto outros chats só respondem, o nosso aprende quais respostas funcionam, 
            ajusta o comportamento e ajuda a converter — tudo sem perder controle.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16"
        >
          {stats.map((stat, index) => (
            <div 
              key={index}
              className="text-center p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50"
            >
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-300"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="relative">
            {/* Timeline */}
            <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-primary via-secondary to-primary/20" />
            
            <div className="space-y-8">
              {[
                { 
                  phase: "Fase 1", 
                  title: "Suporte Confiável",
                  description: "Resolve problemas reais, identifica limitações e escala quando necessário.",
                  status: "active"
                },
                { 
                  phase: "Fase 2", 
                  title: "IA Adaptativa",
                  description: "Prioriza respostas bem avaliadas e ajusta tom baseado no perfil do usuário.",
                  status: "progress"
                },
                { 
                  phase: "Fase 3", 
                  title: "Conversão Contextual",
                  description: "Detecta intenção de compra e apresenta ofertas no momento certo.",
                  status: "planned"
                },
                { 
                  phase: "Fase 4", 
                  title: "Marketing Inteligente",
                  description: "Sugere campanhas personalizadas e reativa usuários inativos.",
                  status: "planned"
                }
              ].map((phase, index) => (
                <div key={index} className="flex gap-6">
                  <div className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center text-sm font-bold ${
                    phase.status === 'active' 
                      ? 'bg-primary text-primary-foreground' 
                      : phase.status === 'progress'
                        ? 'bg-secondary text-secondary-foreground'
                        : 'bg-muted text-muted-foreground'
                  }`}>
                    {phase.phase}
                  </div>
                  <div className="flex-1 pt-3">
                    <h4 className="text-lg font-semibold mb-1">{phase.title}</h4>
                    <p className="text-muted-foreground">{phase.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="inline-flex flex-col sm:flex-row gap-4">
            <Button size="lg" asChild>
              <Link to="/contato">
                <MessageSquare className="mr-2 h-5 w-5" />
                Experimente Agora
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/como-funciona">
                <Zap className="mr-2 h-5 w-5" />
                Como Funciona
              </Link>
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mt-4">
            ✓ Não é chatbot engessado &nbsp;•&nbsp; ✓ Não é IA descontrolada &nbsp;•&nbsp; ✓ Evolução contínua e segura
          </p>
        </motion.div>
      </div>
    </section>
  );
}
