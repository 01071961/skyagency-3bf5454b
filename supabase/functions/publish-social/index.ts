import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PublishRequest {
  platform: "facebook" | "instagram" | "both";
  content: string;
  mediaUrl?: string;
  mediaType?: "image" | "video";
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const META_TOKEN = Deno.env.get("META_SYSTEM_USER_TOKEN");
    const FACEBOOK_PAGE_ID = Deno.env.get("FACEBOOK_PAGE_ID");
    const INSTAGRAM_ACCOUNT_ID = Deno.env.get("INSTAGRAM_ACCOUNT_ID");

    if (!META_TOKEN) {
      throw new Error("META_SYSTEM_USER_TOKEN not configured");
    }

    const { platform, content, mediaUrl, mediaType } = await req.json() as PublishRequest;

    console.log(`[publish-social] Publishing to ${platform}:`, { content: content.substring(0, 50) + "...", mediaUrl, mediaType });

    const results: { facebook?: any; instagram?: any } = {};

    // Publish to Facebook
    if ((platform === "facebook" || platform === "both") && FACEBOOK_PAGE_ID) {
      try {
        let facebookResult;

        if (mediaUrl && mediaType === "image") {
          // Post with photo
          const photoResponse = await fetch(
            `https://graph.facebook.com/v21.0/${FACEBOOK_PAGE_ID}/photos`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                url: mediaUrl,
                caption: content,
                access_token: META_TOKEN,
              }),
            }
          );
          facebookResult = await photoResponse.json();
        } else if (mediaUrl && mediaType === "video") {
          // Post with video
          const videoResponse = await fetch(
            `https://graph.facebook.com/v21.0/${FACEBOOK_PAGE_ID}/videos`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                file_url: mediaUrl,
                description: content,
                access_token: META_TOKEN,
              }),
            }
          );
          facebookResult = await videoResponse.json();
        } else {
          // Text-only post
          const postResponse = await fetch(
            `https://graph.facebook.com/v21.0/${FACEBOOK_PAGE_ID}/feed`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                message: content,
                access_token: META_TOKEN,
              }),
            }
          );
          facebookResult = await postResponse.json();
        }

        if (facebookResult.error) {
          console.error("[publish-social] Facebook error:", facebookResult.error);
          results.facebook = { success: false, error: facebookResult.error.message };
        } else {
          console.log("[publish-social] Facebook success:", facebookResult);
          results.facebook = { success: true, postId: facebookResult.id || facebookResult.post_id };
        }
      } catch (fbError) {
        console.error("[publish-social] Facebook exception:", fbError);
        results.facebook = { success: false, error: String(fbError) };
      }
    }

    // Publish to Instagram
    if ((platform === "instagram" || platform === "both") && INSTAGRAM_ACCOUNT_ID) {
      try {
        let instagramResult;

        if (mediaUrl) {
          // Instagram requires media - create container first
          const containerResponse = await fetch(
            `https://graph.facebook.com/v21.0/${INSTAGRAM_ACCOUNT_ID}/media`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                image_url: mediaType === "image" ? mediaUrl : undefined,
                video_url: mediaType === "video" ? mediaUrl : undefined,
                media_type: mediaType === "video" ? "REELS" : undefined,
                caption: content,
                access_token: META_TOKEN,
              }),
            }
          );
          const containerData = await containerResponse.json();

          if (containerData.error) {
            throw new Error(containerData.error.message);
          }

          // Publish the container
          const publishResponse = await fetch(
            `https://graph.facebook.com/v21.0/${INSTAGRAM_ACCOUNT_ID}/media_publish`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                creation_id: containerData.id,
                access_token: META_TOKEN,
              }),
            }
          );
          instagramResult = await publishResponse.json();

          if (instagramResult.error) {
            console.error("[publish-social] Instagram publish error:", instagramResult.error);
            results.instagram = { success: false, error: instagramResult.error.message };
          } else {
            console.log("[publish-social] Instagram success:", instagramResult);
            results.instagram = { success: true, postId: instagramResult.id };
          }
        } else {
          // Instagram requires media, can't post text-only
          results.instagram = { 
            success: false, 
            error: "Instagram requires an image or video. Text-only posts are not supported." 
          };
        }
      } catch (igError) {
        console.error("[publish-social] Instagram exception:", igError);
        results.instagram = { success: false, error: String(igError) };
      }
    }

    // Determine overall success
    const allSuccess = 
      (!results.facebook || results.facebook.success) && 
      (!results.instagram || results.instagram.success);

    return new Response(
      JSON.stringify({
        success: allSuccess,
        results,
        message: allSuccess 
          ? "Publicado com sucesso!" 
          : "Algumas publicações falharam. Verifique os detalhes.",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: allSuccess ? 200 : 207,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[publish-social] Error:", errorMessage);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage || "Erro ao publicar" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
