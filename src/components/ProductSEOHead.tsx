import { useEffect } from "react";

interface ProductSEOHeadProps {
  productName: string;
  productDescription: string;
  productImage: string | null;
  productPrice: number;
  productSlug: string;
  productType?: string;
}

const BASE_URL = "https://skystreamer.online";
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;
const SITE_NAME = "SKY BRASIL";

export const ProductSEOHead = ({
  productName,
  productDescription,
  productImage,
  productPrice,
  productSlug,
  productType = "product",
}: ProductSEOHeadProps) => {
  const canonicalUrl = `${BASE_URL}/produto/${productSlug}`;
  const finalImage = productImage || DEFAULT_IMAGE;
  const finalDescription = productDescription?.slice(0, 160) || `Conheça ${productName} na SKY BRASIL`;
  const priceFormatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(productPrice);

  useEffect(() => {
    // Update document title
    document.title = `${productName} | SKY BRASIL`;

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
    updateMeta("keywords", `${productName}, curso online, infoproduto, sky brasil, ${productType}`, true);
    updateMeta("author", "SKY BRASIL", true);
    updateMeta("robots", "index, follow", true);

    // Open Graph tags (Facebook, LinkedIn, WhatsApp)
    updateMeta("og:title", `${productName} - ${priceFormatted}`);
    updateMeta("og:description", finalDescription);
    updateMeta("og:image", finalImage);
    updateMeta("og:image:width", "1200");
    updateMeta("og:image:height", "630");
    updateMeta("og:image:alt", productName);
    updateMeta("og:url", canonicalUrl);
    updateMeta("og:type", "product");
    updateMeta("og:site_name", SITE_NAME);
    updateMeta("og:locale", "pt_BR");
    
    // Product specific Open Graph tags
    updateMeta("product:price:amount", productPrice.toString());
    updateMeta("product:price:currency", "BRL");

    // Twitter Card tags
    updateMeta("twitter:card", "summary_large_image", true);
    updateMeta("twitter:site", "@SKYBRASIL", true);
    updateMeta("twitter:creator", "@SKYBRASIL", true);
    updateMeta("twitter:title", `${productName} - ${priceFormatted}`, true);
    updateMeta("twitter:description", finalDescription, true);
    updateMeta("twitter:image", finalImage, true);
    updateMeta("twitter:image:alt", productName, true);

    // Additional SEO tags
    updateMeta("theme-color", "#ec4899", true);

    // Schema.org JSON-LD for Product
    let jsonLdScript = document.querySelector('script[data-type="product-jsonld"]');
    if (!jsonLdScript) {
      jsonLdScript = document.createElement('script');
      jsonLdScript.setAttribute('type', 'application/ld+json');
      jsonLdScript.setAttribute('data-type', 'product-jsonld');
      document.head.appendChild(jsonLdScript);
    }
    
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": productName,
      "description": finalDescription,
      "image": finalImage,
      "url": canonicalUrl,
      "brand": {
        "@type": "Brand",
        "name": "SKY BRASIL"
      },
      "offers": {
        "@type": "Offer",
        "price": productPrice,
        "priceCurrency": "BRL",
        "availability": "https://schema.org/InStock",
        "url": canonicalUrl
      }
    };
    jsonLdScript.textContent = JSON.stringify(jsonLd);

    // Cleanup function to remove JSON-LD on unmount
    return () => {
      const script = document.querySelector('script[data-type="product-jsonld"]');
      if (script) {
        script.remove();
      }
    };
  }, [productName, finalDescription, finalImage, productPrice, canonicalUrl, productType, priceFormatted]);

  return null;
};

export default ProductSEOHead;
