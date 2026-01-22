import { motion } from "framer-motion";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Calendar, Clock, ArrowLeft, ArrowRight, Share2, Bookmark, User } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";

// Import blog images
import blogStreamingTips from "@/assets/blog-streaming-tips.jpg";
import blogMonetization from "@/assets/blog-monetization.jpg";
import blogBranding from "@/assets/blog-branding.jpg";
import blogPartnerships from "@/assets/blog-partnerships.jpg";
import blogTechnical from "@/assets/blog-technical.jpg";
import blogAnalytics from "@/assets/blog-analytics.jpg";

interface BlogArticle {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  category: string;
  image: string;
  author: string;
  content: string[];
}

const articles: BlogArticle[] = [
  {
    slug: "como-aumentar-engajamento-lives",
    title: "Como Aumentar o Engajamento nas suas Lives",
    excerpt: "Descubra as técnicas mais eficazes para manter sua audiência conectada e participativa durante toda a transmissão.",
    date: "15 de Março, 2024",
    readTime: "5 min",
    category: "Dicas",
    image: blogStreamingTips,
    author: "Equipe SKY BRASIL",
    content: [
      "O engajamento é a métrica mais importante para qualquer streamer que deseja crescer de forma sustentável. Não basta ter muitos viewers, é preciso que eles participem ativamente do seu conteúdo.",
      "## Por que o engajamento é tão importante?",
      "Plataformas como Twitch, YouTube e TikTok priorizam conteúdos com alto engajamento. Isso significa que quanto mais interações você tiver, maior será sua visibilidade orgânica.",
      "## Técnicas comprovadas para aumentar o engajamento:",
      "### 1. Faça perguntas diretas à audiência",
      "Invés de simplesmente jogar ou conversar, envolva sua audiência fazendo perguntas frequentes. Crie enquetes, peça opiniões e responda aos comentários em tempo real.",
      "### 2. Use alertas e overlays interativos",
      "Configurar alertas personalizados para follows, subs e doações mantém a energia da live sempre alta e incentiva outros viewers a participarem.",
      "### 3. Crie momentos memoráveis",
      "Planeje surpresas, challenges e momentos especiais que façam os viewers quererem ficar e compartilhar sua live.",
      "### 4. Mantenha uma rotina consistente",
      "Streamers com horários fixos criam hábitos em sua audiência, aumentando a taxa de retorno e participação.",
      "## Conclusão",
      "O engajamento não acontece por acaso. É resultado de planejamento, consistência e genuína conexão com sua comunidade. Aplique essas técnicas e veja sua audiência se transformar em uma comunidade ativa e engajada."
    ]
  },
  {
    slug: "estrategias-monetizacao-iniciantes",
    title: "Estratégias de Monetização para Streamers Iniciantes",
    excerpt: "Aprenda diferentes formas de monetizar seu conteúdo desde o início, sem depender apenas de doações.",
    date: "10 de Março, 2024",
    readTime: "7 min",
    category: "Monetização",
    image: blogMonetization,
    author: "Equipe SKY BRASIL",
    content: [
      "Muitos streamers iniciantes acreditam que precisam de milhares de seguidores para começar a monetizar. A verdade é que existem estratégias que funcionam desde os primeiros viewers.",
      "## Diversifique suas fontes de receita",
      "Depender apenas de doações e bits é arriscado. Quanto mais fontes de receita você tiver, mais estável será sua carreira como creator.",
      "## Estratégias de monetização para iniciantes:",
      "### 1. Programa de Afiliados",
      "Mesmo com poucos seguidores, você pode se tornar afiliado de produtos relacionados ao seu nicho. Games, periféricos e softwares oferecem comissões interessantes.",
      "### 2. Criação de conteúdo para redes sociais",
      "Transforme highlights das suas lives em conteúdo para TikTok, Reels e Shorts. Isso amplia seu alcance e abre novas possibilidades de monetização.",
      "### 3. Membership e conteúdo exclusivo",
      "Plataformas como Patreon e o próprio YouTube Membership permitem oferecer conteúdo exclusivo para apoiadores.",
      "### 4. Parcerias com marcas locais",
      "Não subestime marcas menores. Lojas de games locais, restaurantes delivery e produtos de nicho podem ser ótimos primeiros parceiros.",
      "## Como a SKY BRASIL pode ajudar",
      "Nossa agência conecta streamers de todos os tamanhos com marcas relevantes, oferecendo mentoria de negociação e gestão de parcerias.",
      "## Conclusão",
      "Monetização é um processo gradual. Comece implementando uma estratégia por vez e vá construindo sua base financeira de forma sustentável."
    ]
  },
  {
    slug: "importancia-branding-pessoal",
    title: "A Importância do Branding Pessoal no Streaming",
    excerpt: "Entenda como construir uma marca forte e autêntica que te diferencie em um mercado competitivo.",
    date: "5 de Março, 2024",
    readTime: "6 min",
    category: "Branding",
    image: blogBranding,
    author: "Equipe SKY BRASIL",
    content: [
      "Em um mercado com milhões de streamers, sua identidade visual e posicionamento são o que farão você ser lembrado. Branding não é apenas sobre logos bonitos.",
      "## O que é branding pessoal?",
      "É o conjunto de elementos que formam a percepção que as pessoas têm de você: sua identidade visual, tom de voz, valores e personalidade.",
      "## Elementos essenciais do branding para streamers:",
      "### 1. Identidade Visual Consistente",
      "Logo, cores, overlays, alertas, banners - tudo deve seguir uma linguagem visual coesa que represente sua personalidade.",
      "### 2. Tom de Voz Autêntico",
      "A forma como você se comunica deve ser natural e consistente em todas as plataformas.",
      "### 3. Proposta de Valor Clara",
      "Por que alguém deveria assistir você? O que te diferencia dos outros streamers do mesmo nicho?",
      "### 4. Experiência do Viewer",
      "Desde o momento que alguém entra na sua live até o pós-stream, cada interação deve reforçar sua marca.",
      "## Erros comuns de branding",
      "- Copiar outros streamers ao invés de ser autêntico\n- Mudar de identidade visual frequentemente\n- Não manter consistência entre plataformas",
      "## Conclusão",
      "Investir em branding desde o início economiza tempo e dinheiro no futuro. Uma marca forte atrai viewers certos, parcerias melhores e oportunidades maiores."
    ]
  },
  {
    slug: "negociar-parcerias-marcas",
    title: "Como Negociar Parcerias com Marcas",
    excerpt: "Guia completo sobre como abordar marcas, apresentar propostas e fechar acordos lucrativos.",
    date: "1 de Março, 2024",
    readTime: "8 min",
    category: "Parcerias",
    image: blogPartnerships,
    author: "Equipe SKY BRASIL",
    content: [
      "Negociar parcerias é uma habilidade essencial para qualquer creator que quer transformar streaming em carreira. Veja como fazer isso de forma profissional.",
      "## Preparação antes de abordar marcas",
      "Antes de enviar qualquer proposta, você precisa ter clareza sobre seus números, audiência e valor que pode oferecer.",
      "## Passos para uma negociação de sucesso:",
      "### 1. Conheça seus números",
      "Tenha um mídia kit atualizado com:\n- Média de viewers\n- Demographics da audiência\n- Engajamento por tipo de conteúdo\n- Cases de sucesso anteriores",
      "### 2. Pesquise as marcas certas",
      "Aborde marcas que façam sentido para sua audiência. Uma parceria autêntica gera mais resultados para ambos os lados.",
      "### 3. Crie uma proposta personalizada",
      "Nada de templates genéricos. Mostre que você conhece a marca e tem ideias específicas de como agregar valor.",
      "### 4. Defina entregas claras",
      "Especifique exatamente o que será entregue: número de menções, posts, stories, formato do conteúdo, etc.",
      "### 5. Precifique corretamente",
      "Não cobre muito baixo para \"ganhar a parceria\". Isso desvaloriza o mercado e sua própria marca.",
      "## Red flags em parcerias",
      "- Marcas que pedem exclusividade total\n- Pagamento apenas em produtos\n- Contratos muito longos sem flexibilidade",
      "## Conclusão",
      "Parcerias são relacionamentos de negócios. Trate cada negociação com profissionalismo e busque acordos que beneficiem ambas as partes."
    ]
  },
  {
    slug: "configuracao-tecnica-lives",
    title: "Configuração Técnica Essencial para Lives Profissionais",
    excerpt: "Equipamentos, software e configurações recomendadas para transmissões de alta qualidade.",
    date: "25 de Fevereiro, 2024",
    readTime: "10 min",
    category: "Técnico",
    image: blogTechnical,
    author: "Equipe SKY BRASIL",
    content: [
      "A qualidade técnica da sua live impacta diretamente na retenção de viewers. Veja como configurar um setup profissional sem gastar uma fortuna.",
      "## Equipamentos essenciais",
      "### 1. Microfone",
      "O áudio é mais importante que o vídeo. Um microfone de qualidade faz toda diferença na experiência do viewer.",
      "Recomendações:\n- Entrada: HyperX SoloCast, Blue Snowball\n- Intermediário: Audio-Technica AT2020, Elgato Wave 3\n- Profissional: Shure SM7B, Rode NT1",
      "### 2. Câmera/Webcam",
      "Uma boa iluminação é mais importante que uma câmera cara.",
      "Recomendações:\n- Entrada: Logitech C920\n- Intermediário: Elgato Facecam, Logitech Brio\n- Profissional: Sony a6400, Canon M50",
      "### 3. Iluminação",
      "Ring lights são ótimas para iniciantes. Para um setup mais profissional, considere softboxes ou key lights.",
      "## Configuração do OBS Studio",
      "- Encoder: NVENC (Nvidia) ou x264\n- Bitrate: 4500-6000 kbps para 1080p\n- Output: 1920x1080 @ 60fps\n- Audio: 48khz, 320kbps",
      "## Otimizações importantes",
      "- Use scenes e sources organizadas\n- Configure hotkeys para transições\n- Tenha um layout de emergência pronto\n- Faça testes de stream antes de ir ao vivo",
      "## Conclusão",
      "Invista gradualmente no seu setup. Priorize áudio > iluminação > câmera > periféricos."
    ]
  },
  {
    slug: "analisar-metricas-resultados",
    title: "Como Analisar Métricas e Melhorar seus Resultados",
    excerpt: "Aprenda a interpretar dados de audiência e usar insights para crescer consistentemente.",
    date: "20 de Fevereiro, 2024",
    readTime: "6 min",
    category: "Analytics",
    image: blogAnalytics,
    author: "Equipe SKY BRASIL",
    content: [
      "Dados são o melhor amigo de um creator que quer crescer de forma estratégica. Entenda quais métricas importam e como usá-las.",
      "## Métricas que realmente importam",
      "### 1. Tempo médio de visualização",
      "Mais importante que o número de viewers é quanto tempo eles ficam. Uma live de 10 viewers que ficam 2 horas é melhor que 100 viewers que saem em 5 minutos.",
      "### 2. Taxa de retorno",
      "Quantos viewers voltam nas próximas lives? Isso indica se você está construindo uma comunidade ou apenas atraindo curiosos.",
      "### 3. Engajamento por segmento",
      "Identifique quais partes da sua live geram mais interação. Pode ser um jogo específico, um tipo de conversa ou um formato de conteúdo.",
      "### 4. Crescimento de seguidores",
      "Observe a taxa de conversão de viewer para follower. Se muitos assistem mas poucos seguem, algo precisa mudar.",
      "## Ferramentas de análise",
      "- Analytics nativo da plataforma (Twitch/YouTube)\n- StreamElements/Streamlabs para dados em tempo real\n- SullyGnome para análise histórica (Twitch)\n- Social Blade para tendências de crescimento",
      "## Como usar os dados",
      "1. Analise semanalmente seus números\n2. Identifique padrões (horários, jogos, formatos)\n3. Teste mudanças baseadas em dados\n4. Mantenha o que funciona, ajuste o que não funciona",
      "## Conclusão",
      "Não deixe os números te obcecar, mas também não os ignore. Use dados como ferramenta para tomar decisões mais inteligentes sobre seu conteúdo."
    ]
  }
];

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  
  const article = articles.find(a => a.slug === slug);
  const currentIndex = articles.findIndex(a => a.slug === slug);
  const prevArticle = currentIndex > 0 ? articles[currentIndex - 1] : null;
  const nextArticle = currentIndex < articles.length - 1 ? articles[currentIndex + 1] : null;

  if (!article) {
    return (
      <div className="min-h-screen pt-24 sm:pt-32 pb-16 sm:pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl font-bold mb-4">Artigo não encontrado</h1>
          <Button onClick={() => navigate("/blog")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Blog
          </Button>
        </div>
      </div>
    );
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.excerpt,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <>
      <SEOHead
        title={`${article.title} | Blog SKY BRASIL`}
        description={article.excerpt}
        keywords={`streaming, ${article.category.toLowerCase()}, streamer, dicas, SKY BRASIL`}
        canonicalPath={`/blog/${article.slug}`}
        image={article.image}
        type="article"
      />

      <div className="min-h-screen pt-24 sm:pt-32 pb-16 sm:pb-20">
        <article className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6"
          >
            <Button variant="ghost" onClick={() => navigate("/blog")} className="group">
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Voltar ao Blog
            </Button>
          </motion.div>

          {/* Hero Image */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative h-64 sm:h-80 md:h-96 rounded-2xl overflow-hidden mb-8"
          >
            <img
              src={article.image}
              alt={article.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
            
            {/* Category Badge */}
            <div className="absolute top-4 left-4">
              <span className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                {article.category}
              </span>
            </div>
          </motion.div>

          {/* Article Header */}
          <motion.header
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-8"
          >
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              {article.title}
            </h1>
            
            <p className="text-lg text-muted-foreground mb-6">
              {article.excerpt}
            </p>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{article.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{article.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{article.readTime} de leitura</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Compartilhar
              </Button>
              <Button variant="outline" size="sm">
                <Bookmark className="w-4 h-4 mr-2" />
                Salvar
              </Button>
            </div>
          </motion.header>

          {/* Article Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="prose prose-lg prose-invert max-w-none mb-12"
          >
            {article.content.map((paragraph, index) => {
              if (paragraph.startsWith("### ")) {
                return (
                  <h3 key={index} className="text-xl font-bold text-foreground mt-6 mb-3">
                    {paragraph.replace("### ", "")}
                  </h3>
                );
              }
              if (paragraph.startsWith("## ")) {
                return (
                  <h2 key={index} className="text-2xl font-bold text-foreground mt-8 mb-4">
                    {paragraph.replace("## ", "")}
                  </h2>
                );
              }
              if (paragraph.startsWith("- ")) {
                const items = paragraph.split("\n").filter(item => item.startsWith("- "));
                return (
                  <ul key={index} className="list-disc pl-6 space-y-2 text-muted-foreground">
                    {items.map((item, i) => (
                      <li key={i}>{item.replace("- ", "")}</li>
                    ))}
                  </ul>
                );
              }
              return (
                <p key={index} className="text-muted-foreground leading-relaxed mb-4">
                  {paragraph}
                </p>
              );
            })}
          </motion.div>

          {/* Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="border-t border-border pt-8"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {prevArticle && (
                <Link to={`/blog/${prevArticle.slug}`}>
                  <GlassCard variant="elevated" interactive className="h-full p-4">
                    <div className="flex items-center gap-3">
                      <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Anterior</p>
                        <p className="font-medium text-sm line-clamp-1">{prevArticle.title}</p>
                      </div>
                    </div>
                  </GlassCard>
                </Link>
              )}
              {nextArticle && (
                <Link to={`/blog/${nextArticle.slug}`} className="sm:ml-auto">
                  <GlassCard variant="elevated" interactive className="h-full p-4">
                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Próximo</p>
                        <p className="font-medium text-sm line-clamp-1">{nextArticle.title}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </GlassCard>
                </Link>
              )}
            </div>
          </motion.div>
        </article>
      </div>
    </>
  );
};

export default BlogPost;
