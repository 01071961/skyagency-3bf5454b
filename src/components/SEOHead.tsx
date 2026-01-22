import { useEffect } from "react";
import { useLocation } from "react-router-dom";

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  type?: "website" | "article" | "product";
  keywords?: string;
  canonicalPath?: string;
}

const BASE_URL = "https://skystreamer.online";
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;
const SITE_NAME = "SKY BRASIL";

const pageData: Record<string, { title: string; description: string; keywords: string }> = {
  "/": {
    title: "SKY BRASIL — Transformando Lives em Negócios",
    description: "Transformamos streamers em parceiros de alta conversão para marcas. Treinamento, monetização e estratégia focada em resultados. Desde 2020 ajudando criadores a crescer.",
    keywords: "streaming, monetização, marcas, parcerias, twitch, youtube, tiktok, influencer, creator, live, agência de streamers",
  },
  "/sobre": {
    title: "Sobre a SKY BRASIL — Nossa História e Missão",
    description: "Conheça a SKY BRASIL, agência especializada em transformar streamers em profissionais de alta performance. Nossa missão é criar negócios sustentáveis para criadores de conteúdo.",
    keywords: "sobre, história, missão, agência, streamers, creators, brasil, sky brasil",
  },
  "/streamers": {
    title: "Para Streamers — Monetize seu Conteúdo | SKY BRASIL",
    description: "Quer monetizar suas lives? A SKY BRASIL oferece treinamento especializado, acesso a marcas e estratégias personalizadas para streamers crescerem de forma sustentável.",
    keywords: "streamers, monetização, twitch, youtube, obs studio, treinamento, mentoria, crescimento, parcerias",
  },
  "/empresas": {
    title: "Para Empresas — Parcerias com Streamers | SKY BRASIL",
    description: "Conecte sua marca com streamers de alta conversão. A SKY BRASIL oferece parcerias estratégicas com criadores de conteúdo para maximizar seu alcance e ROI.",
    keywords: "empresas, marcas, parcerias, influencer marketing, roi, streamers, campanhas, publicidade",
  },
  "/como-funciona": {
    title: "Como Funciona — Processo de Parceria | SKY BRASIL",
    description: "Descubra como funciona o processo de parceria com a SKY BRASIL. Do cadastro ao sucesso, acompanhamos cada passo da sua jornada como streamer profissional.",
    keywords: "como funciona, processo, parceria, cadastro, onboarding, streamers, agência",
  },
  "/plataforma": {
    title: "Plataforma SKY — Dashboard e Ferramentas | SKY BRASIL",
    description: "Conheça a plataforma SKY com dashboard completo, analytics, gestão de lives, sistema de diamantes e ferramentas exclusivas para streamers.",
    keywords: "plataforma, dashboard, analytics, lives, diamantes, ferramentas, streamers, gestão",
  },
  "/blog": {
    title: "Blog — Dicas e Novidades para Streamers | SKY BRASIL",
    description: "Acompanhe as últimas novidades, dicas e estratégias para streamers no blog da SKY BRASIL. Conteúdo exclusivo para crescer sua carreira.",
    keywords: "blog, dicas, novidades, streamers, estratégias, conteúdo, artigos, tutoriais",
  },
  "/contato": {
    title: "Contato — Fale Conosco | SKY BRASIL",
    description: "Entre em contato com a SKY BRASIL. Estamos prontos para ajudar streamers e empresas a alcançarem seus objetivos. WhatsApp, email e formulário disponíveis.",
    keywords: "contato, fale conosco, whatsapp, email, suporte, atendimento, sky brasil",
  },
  "/vip": {
    title: "Lista VIP — Acesso Exclusivo | SKY BRASIL",
    description: "Entre na lista VIP da SKY BRASIL e tenha acesso exclusivo a oportunidades, treinamentos e parcerias antes de todos. Vagas limitadas!",
    keywords: "vip, lista vip, exclusivo, oportunidades, parcerias, treinamentos, streamers",
  },
  "/vendas": {
    title: "Loja — Produtos e Serviços | SKY BRASIL",
    description: "Confira os produtos e serviços exclusivos da SKY BRASIL. Pacotes de monetização, treinamentos premium e muito mais para impulsionar sua carreira.",
    keywords: "loja, produtos, serviços, pacotes, premium, treinamentos, monetização, streamers",
  },
  "/checkout": {
    title: "Checkout — Finalizar Compra | SKY BRASIL",
    description: "Finalize sua compra de forma segura na SKY BRASIL. Pagamento via PIX, cartão de crédito e boleto disponíveis.",
    keywords: "checkout, pagamento, compra, pix, cartão, boleto, seguro",
  },
  "/auth": {
    title: "Login — Acesse sua Conta | SKY BRASIL",
    description: "Faça login ou crie sua conta na SKY BRASIL para acessar recursos exclusivos e gerenciar sua parceria.",
    keywords: "login, cadastro, conta, acesso, autenticação, sky brasil",
  },
};

export const SEOHead = ({
  title,
  description,
  image = DEFAULT_IMAGE,
  type = "website",
  keywords,
  canonicalPath,
}: SEOHeadProps) => {
  const location = useLocation();
  const currentPath = canonicalPath || location.pathname;
  const pageInfo = pageData[currentPath] || pageData["/"];
  
  const finalTitle = title || pageInfo.title;
  const finalDescription = description || pageInfo.description;
  const finalKeywords = keywords || pageInfo.keywords;
  const canonicalUrl = `${BASE_URL}${currentPath}`;

  useEffect(() => {
    // Update document title
    document.title = finalTitle;

    // Helper function to update or create meta tags
    const updateMeta = (property: string, content: string, isName = false) => {
      const attr = isName ? "name" : "property";
      let element = document.querySelector(`meta[${attr}="${property}"]`);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attr, property);
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };

    // Update canonical link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", canonicalUrl);

    // Basic SEO meta tags
    updateMeta("description", finalDescription, true);
    updateMeta("keywords", finalKeywords, true);
    updateMeta("author", "SKY BRASIL", true);
    updateMeta("robots", "index, follow", true);

    // Open Graph tags (Facebook, LinkedIn)
    updateMeta("og:title", finalTitle);
    updateMeta("og:description", finalDescription);
    updateMeta("og:image", image);
    updateMeta("og:url", canonicalUrl);
    updateMeta("og:type", type);
    updateMeta("og:site_name", SITE_NAME);
    updateMeta("og:locale", "pt_BR");

    // Twitter Card tags
    updateMeta("twitter:card", "summary_large_image", true);
    updateMeta("twitter:site", "@SKYBRASIL", true);
    updateMeta("twitter:creator", "@SKYBRASIL", true);
    updateMeta("twitter:title", finalTitle, true);
    updateMeta("twitter:description", finalDescription, true);
    updateMeta("twitter:image", image, true);

    // Additional SEO tags
    updateMeta("theme-color", "#ec4899", true);
    updateMeta("msapplication-TileColor", "#ec4899", true);

  }, [finalTitle, finalDescription, finalKeywords, image, canonicalUrl, type]);

  return null; // This component only manages head meta tags
};

export default SEOHead;
