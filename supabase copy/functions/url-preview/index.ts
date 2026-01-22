import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function pickMeta(html: string, property: string): string | null {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    "i"
  );
  const m = html.match(re);
  return m?.[1] ?? null;
}

function safeUrl(url: string) {
  // Basic SSRF protections: allow only http/https, block localhost + private ranges.
  const u = new URL(url);
  if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("URL inválida");

  const host = u.hostname.toLowerCase();
  const blockedHosts = ["localhost", "127.0.0.1", "0.0.0.0", "::1"];
  if (blockedHosts.includes(host)) throw new Error("URL não permitida");

  // Block obvious private ranges
  const isIPv4 = /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host);
  if (isIPv4) {
    const [a, b] = host.split(".").map((n) => Number(n));
    if (a === 10) throw new Error("URL não permitida");
    if (a === 172 && b >= 16 && b <= 31) throw new Error("URL não permitida");
    if (a === 192 && b === 168) throw new Error("URL não permitida");
    if (a === 169 && b === 254) throw new Error("URL não permitida");
  }

  return u;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") throw new Error("url é obrigatório");

    const u = safeUrl(url);

    console.log(`[url-preview] fetching: ${u.toString()}`);

    const res = await fetch(u.toString(), {
      headers: {
        "User-Agent": "LovableCloudLinkPreview/1.0",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    const contentType = res.headers.get("content-type") || "";
    if (!res.ok) {
      return new Response(
        JSON.stringify({ ok: false, url: u.toString(), status: res.status }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // If it's an image/video, just return minimal preview
    if (!contentType.includes("text/html")) {
      return new Response(
        JSON.stringify({
          ok: true,
          url: u.toString(),
          title: u.hostname,
          description: contentType,
          image: contentType.startsWith("image/") ? u.toString() : null,
          siteName: u.hostname,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const html = await res.text();

    const title =
      pickMeta(html, "og:title") ||
      pickMeta(html, "twitter:title") ||
      html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ||
      u.hostname;

    const description =
      pickMeta(html, "og:description") ||
      pickMeta(html, "twitter:description") ||
      pickMeta(html, "description") ||
      null;

    const imageRaw = pickMeta(html, "og:image") || pickMeta(html, "twitter:image") || null;

    let image: string | null = null;
    try {
      if (imageRaw) image = new URL(imageRaw, u).toString();
    } catch {
      image = null;
    }

    const siteName = pickMeta(html, "og:site_name") || u.hostname;

    return new Response(
      JSON.stringify({ ok: true, url: u.toString(), title, description, image, siteName }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (e) {
    console.error("[url-preview] error", e);
    return new Response(
      JSON.stringify({ ok: false, error: e instanceof Error ? e.message : "Erro" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  }
});
