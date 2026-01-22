import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, ArrowRight } from "lucide-react";

const Blog = () => {
  const articles = [
    {
      title: "Como Aumentar o Engajamento nas suas Lives",
      excerpt:
        "Descubra as técnicas mais eficazes para manter sua audiência conectada e participativa durante toda a transmissão.",
      date: "15 de Março, 2024",
      readTime: "5 min",
      category: "Dicas",
      image: "primary",
    },
    {
      title: "Estratégias de Monetização para Streamers Iniciantes",
      excerpt:
        "Aprenda diferentes formas de monetizar seu conteúdo desde o início, sem depender apenas de doações.",
      date: "10 de Março, 2024",
      readTime: "7 min",
      category: "Monetização",
      image: "secondary",
    },
    {
      title: "A Importância do Branding Pessoal no Streaming",
      excerpt:
        "Entenda como construir uma marca forte e autêntica que te diferencie em um mercado competitivo.",
      date: "5 de Março, 2024",
      readTime: "6 min",
      category: "Branding",
      image: "accent",
    },
    {
      title: "Como Negociar Parcerias com Marcas",
      excerpt:
        "Guia completo sobre como abordar marcas, apresentar propostas e fechar acordos lucrativos.",
      date: "1 de Março, 2024",
      readTime: "8 min",
      category: "Parcerias",
      image: "primary",
    },
    {
      title: "Configuração Técnica Essencial para Lives Profissionais",
      excerpt:
        "Equipamentos, software e configurações recomendadas para transmissões de alta qualidade.",
      date: "25 de Fevereiro, 2024",
      readTime: "10 min",
      category: "Técnico",
      image: "secondary",
    },
    {
      title: "Como Analisar Métricas e Melhorar seus Resultados",
      excerpt:
        "Aprenda a interpretar dados de audiência e usar insights para crescer consistentemente.",
      date: "20 de Fevereiro, 2024",
      readTime: "6 min",
      category: "Analytics",
      image: "accent",
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
            <span className="text-gradient-primary">Blog</span> SKY BRASIL
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Dicas, estratégias e insights para streamers que querem crescer e
            profissionalizar sua carreira
          </p>
        </motion.div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article, index) => (
            <motion.div
              key={article.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full bg-card/50 backdrop-blur border-border hover:border-primary transition-smooth hover:glow-primary group overflow-hidden">
                {/* Image Placeholder */}
                <div
                  className={`h-48 bg-gradient-${article.image} relative overflow-hidden`}
                >
                  <div className="absolute inset-0 bg-background/20" />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-full bg-background/80 backdrop-blur text-xs font-semibold">
                      {article.category}
                    </span>
                  </div>
                </div>

                <CardContent className="p-6">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      <span>{article.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span>{article.readTime}</span>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-smooth">
                    {article.title}
                  </h3>
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    {article.excerpt}
                  </p>

                  <button className="text-primary font-semibold inline-flex items-center gap-2 group-hover:gap-3 transition-smooth">
                    Ler mais
                    <ArrowRight size={16} />
                  </button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Newsletter CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-20"
        >
          <Card className="bg-gradient-primary p-12 text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Receba Novos Artigos
            </h2>
            <p className="text-lg text-white/90 mb-8">
              Inscreva-se para receber dicas exclusivas direto no seu email
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Seu melhor email"
                className="flex-1 px-4 py-3 rounded-md bg-white/10 backdrop-blur border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <button className="px-8 py-3 rounded-md bg-white text-primary font-semibold hover:bg-white/90 transition-smooth">
                Inscrever
              </button>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Blog;
