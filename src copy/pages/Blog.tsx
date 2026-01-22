import { motion } from "framer-motion";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Link } from "react-router-dom";

// Import blog images
import blogStreamingTips from "@/assets/blog-streaming-tips.jpg";
import blogMonetization from "@/assets/blog-monetization.jpg";
import blogBranding from "@/assets/blog-branding.jpg";
import blogPartnerships from "@/assets/blog-partnerships.jpg";
import blogTechnical from "@/assets/blog-technical.jpg";
import blogAnalytics from "@/assets/blog-analytics.jpg";

const Blog = () => {
  const articles = [
    {
      slug: "como-aumentar-engajamento-lives",
      title: "Como Aumentar o Engajamento nas suas Lives",
      excerpt:
        "Descubra as técnicas mais eficazes para manter sua audiência conectada e participativa durante toda a transmissão.",
      date: "15 de Março, 2024",
      readTime: "5 min",
      category: "Dicas",
      image: blogStreamingTips,
    },
    {
      slug: "estrategias-monetizacao-iniciantes",
      title: "Estratégias de Monetização para Streamers Iniciantes",
      excerpt:
        "Aprenda diferentes formas de monetizar seu conteúdo desde o início, sem depender apenas de doações.",
      date: "10 de Março, 2024",
      readTime: "7 min",
      category: "Monetização",
      image: blogMonetization,
    },
    {
      slug: "importancia-branding-pessoal",
      title: "A Importância do Branding Pessoal no Streaming",
      excerpt:
        "Entenda como construir uma marca forte e autêntica que te diferencie em um mercado competitivo.",
      date: "5 de Março, 2024",
      readTime: "6 min",
      category: "Branding",
      image: blogBranding,
    },
    {
      slug: "negociar-parcerias-marcas",
      title: "Como Negociar Parcerias com Marcas",
      excerpt:
        "Guia completo sobre como abordar marcas, apresentar propostas e fechar acordos lucrativos.",
      date: "1 de Março, 2024",
      readTime: "8 min",
      category: "Parcerias",
      image: blogPartnerships,
    },
    {
      slug: "configuracao-tecnica-lives",
      title: "Configuração Técnica Essencial para Lives Profissionais",
      excerpt:
        "Equipamentos, software e configurações recomendadas para transmissões de alta qualidade.",
      date: "25 de Fevereiro, 2024",
      readTime: "10 min",
      category: "Técnico",
      image: blogTechnical,
    },
    {
      slug: "analisar-metricas-resultados",
      title: "Como Analisar Métricas e Melhorar seus Resultados",
      excerpt:
        "Aprenda a interpretar dados de audiência e usar insights para crescer consistentemente.",
      date: "20 de Fevereiro, 2024",
      readTime: "6 min",
      category: "Analytics",
      image: blogAnalytics,
    },
  ];

  return (
    <div className="min-h-screen pt-24 sm:pt-32 pb-16 sm:pb-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-12 sm:mb-16"
        >
          <h1 className="text-fluid-4xl sm:text-fluid-5xl md:text-fluid-6xl font-bold mb-4 sm:mb-6">
            <span className="text-gradient-primary">Blog</span> SKY BRASIL
          </h1>
          <p className="text-fluid-base sm:text-fluid-lg text-muted-foreground leading-relaxed px-2 sm:px-0">
            Dicas, estratégias e insights para streamers que querem crescer e
            profissionalizar sua carreira
          </p>
        </motion.div>

        {/* Articles Grid - Responsive bento-style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {articles.map((article, index) => (
            <motion.article
              key={article.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <GlassCard 
                variant="elevated" 
                interactive 
                className="h-full overflow-hidden flex flex-col"
              >
                {/* Featured Image */}
                <div className="relative h-48 sm:h-56 overflow-hidden">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                  
                  {/* Category badge */}
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1.5 rounded-full bg-glass-dark backdrop-blur-md text-xs font-semibold text-white border border-white/20">
                      {article.category}
                    </span>
                  </div>
                  
                  {/* Title overlay on image */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-primary transition-colors duration-300 line-clamp-2">
                      {article.title}
                    </h3>
                  </div>
                </div>

                <CardContent className="p-4 sm:p-6 flex-1 flex flex-col">
                  {/* Meta info */}
                  <div className="flex items-center gap-4 text-xs sm:text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{article.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{article.readTime}</span>
                    </div>
                  </div>

                  {/* Excerpt */}
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed flex-1 line-clamp-3">
                    {article.excerpt}
                  </p>

                  {/* Read more link */}
                  <Link 
                    to={`/blog/${article.slug}`}
                    className="text-primary font-semibold inline-flex items-center gap-2 group-hover:gap-3 transition-all duration-300 text-sm"
                  >
                    Ler mais
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </CardContent>
              </GlassCard>
            </motion.article>
          ))}
        </div>

        {/* Newsletter CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-16 sm:mt-20"
        >
          <GlassCard 
            variant="gradient" 
            className="p-8 sm:p-12 text-center max-w-3xl mx-auto relative overflow-hidden"
          >
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 animate-gradient-x" />
            
            <div className="relative z-10">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
                Receba Novos Artigos
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8">
                Inscreva-se para receber dicas exclusivas direto no seu email
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Seu melhor email"
                  className="flex-1 px-4 py-3 rounded-xl bg-glass-dark backdrop-blur-md border border-white/20 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
                <Button variant="hero" size="lg" className="sm:w-auto">
                  Inscrever
                </Button>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
};

export default Blog;
