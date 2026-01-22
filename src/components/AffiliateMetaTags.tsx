import { useEffect } from "react";
import { useSearchParams, useLocation } from "react-router-dom";

const BASE_URL = "https://skystreamer.online";
const AFFILIATE_IMAGE = `${BASE_URL}/affiliate-share.jpg`;

/**
 * Component to handle special meta tags when page is accessed via affiliate referral link
 * This ensures shared affiliate links show custom image and description
 */
export const AffiliateMetaTags = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const refCode = searchParams.get('ref');

  useEffect(() => {
    if (!refCode) return;

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

    // Override meta tags for affiliate links
    const affiliateTitle = "🎁 Convite Especial SKY BRASIL — Ganhe Bônus de Boas-Vindas!";
    const affiliateDescription = "Você foi convidado para a SKY BRASIL! Cadastre-se agora e ganhe 10 pontos de bônus. Transforme seu talento em negócio com a maior agência de streamers do Brasil.";

    // Update document title
    document.title = affiliateTitle;

    // Update Open Graph tags for social sharing
    updateMeta("og:title", affiliateTitle);
    updateMeta("og:description", affiliateDescription);
    updateMeta("og:image", AFFILIATE_IMAGE);
    updateMeta("og:image:width", "1200");
    updateMeta("og:image:height", "630");
    updateMeta("og:url", `${BASE_URL}${location.pathname}?ref=${refCode}`);
    updateMeta("og:type", "website");

    // Update Twitter Card tags
    updateMeta("twitter:card", "summary_large_image", true);
    updateMeta("twitter:title", affiliateTitle, true);
    updateMeta("twitter:description", affiliateDescription, true);
    updateMeta("twitter:image", AFFILIATE_IMAGE, true);

    // Standard meta description
    updateMeta("description", affiliateDescription, true);

    // Cleanup: Restore original meta when unmounting or when ref is removed
    return () => {
      // Meta tags will be restored by SEOHead component on next route
    };
  }, [refCode, location.pathname]);

  return null;
};

export default AffiliateMetaTags;
