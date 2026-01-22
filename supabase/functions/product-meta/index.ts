import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const BASE_URL = "https://skystreamer.online";
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get("slug");
    const format = url.searchParams.get("format") || "json";

    if (!slug) {
      return new Response(
        JSON.stringify({ error: "Slug is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: product, error } = await supabase
      .from("products")
      .select("id, name, slug, description, short_description, cover_image_url, price, product_type")
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (error || !product) {
      return new Response(
        JSON.stringify({ error: "Product not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const canonicalUrl = `${BASE_URL}/produto/${product.slug}`;
    const imageUrl = product.cover_image_url || DEFAULT_IMAGE;
    const description = (product.short_description || product.description || `Conheça ${product.name} na SKY BRASIL`).slice(0, 160);
    const priceFormatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Number(product.price));

    // If requesting HTML format, return full HTML page with meta tags for crawlers
    if (format === "html") {
      const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Primary Meta Tags -->
  <title>${product.name} - ${priceFormatted} | SKY BRASIL</title>
  <meta name="title" content="${product.name} - ${priceFormatted} | SKY BRASIL">
  <meta name="description" content="${description}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="product">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:title" content="${product.name} - ${priceFormatted}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${product.name}">
  <meta property="og:site_name" content="SKY BRASIL">
  <meta property="og:locale" content="pt_BR">
  <meta property="product:price:amount" content="${product.price}">
  <meta property="product:price:currency" content="BRL">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${canonicalUrl}">
  <meta name="twitter:title" content="${product.name} - ${priceFormatted}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${imageUrl}">
  <meta name="twitter:image:alt" content="${product.name}">
  <meta name="twitter:site" content="@SKYBRASIL">
  
  <!-- WhatsApp specific -->
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:secure_url" content="${imageUrl}">
  
  <!-- Canonical -->
  <link rel="canonical" href="${canonicalUrl}">
  
  <!-- Schema.org -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "${product.name}",
    "description": "${description}",
    "image": "${imageUrl}",
    "url": "${canonicalUrl}",
    "brand": {
      "@type": "Brand",
      "name": "SKY BRASIL"
    },
    "offers": {
      "@type": "Offer",
      "price": "${product.price}",
      "priceCurrency": "BRL",
      "availability": "https://schema.org/InStock",
      "url": "${canonicalUrl}"
    }
  }
  </script>
  
  <!-- Redirect to SPA -->
  <script>
    window.location.href = "${canonicalUrl}";
  </script>
  <noscript>
    <meta http-equiv="refresh" content="0;url=${canonicalUrl}">
  </noscript>
</head>
<body>
  <h1>${product.name}</h1>
  <p>${description}</p>
  <p>Preço: ${priceFormatted}</p>
  <img src="${imageUrl}" alt="${product.name}" />
  <a href="${canonicalUrl}">Ver produto</a>
</body>
</html>`;

      return new Response(html, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    // Return JSON format for API calls
    const metaTags = {
      title: `${product.name} - ${priceFormatted} | SKY BRASIL`,
      description: description,
      image: imageUrl,
      url: canonicalUrl,
      type: "product",
      siteName: "SKY BRASIL",
      locale: "pt_BR",
      price: {
        amount: product.price,
        currency: "BRL"
      },
      twitterCard: "summary_large_image",
      shareUrl: `${Deno.env.get("SUPABASE_URL")}/functions/v1/product-meta?slug=${product.slug}&format=html`,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product.name,
        "description": description,
        "image": imageUrl,
        "url": canonicalUrl,
        "brand": {
          "@type": "Brand",
          "name": "SKY BRASIL"
        },
        "offers": {
          "@type": "Offer",
          "price": product.price,
          "priceCurrency": "BRL",
          "availability": "https://schema.org/InStock",
          "url": canonicalUrl
        }
      }
    };

    return new Response(
      JSON.stringify(metaTags),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=3600"
        } 
      }
    );
  } catch (error) {
    console.error("Error fetching product meta:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
