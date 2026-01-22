import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const META_SYSTEM_USER_TOKEN = Deno.env.get('META_SYSTEM_USER_TOKEN');
    const FACEBOOK_PAGE_ID = Deno.env.get('FACEBOOK_PAGE_ID');
    const INSTAGRAM_ACCOUNT_ID = Deno.env.get('INSTAGRAM_ACCOUNT_ID');

    if (!META_SYSTEM_USER_TOKEN) {
      console.error('Missing Meta configuration');
      return new Response(
        JSON.stringify({ error: 'Configuração Meta não encontrada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing scheduled posts...');

    // Get all pending scheduled posts
    const { data: allPosts, error: fetchError } = await supabase
      .from('admin_audit_log')
      .select('*')
      .eq('action', 'scheduled_post')
      .order('created_at', { ascending: true })
      .limit(50);

    if (fetchError) {
      console.error('Error fetching scheduled posts:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar posts agendados' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter posts that are due and not yet published
    const now = new Date();
    const scheduledPosts = (allPosts || []).filter(post => {
      const details = post.details as any;
      if (!details) return false;
      
      // Skip if already published
      if (details.published_at) return false;
      
      // Check if scheduled time has passed
      const scheduledAt = details.scheduled_at ? new Date(details.scheduled_at) : null;
      if (!scheduledAt) return false;
      
      return scheduledAt <= now;
    }).slice(0, 10);

    if (scheduledPosts.length === 0) {
      console.log('No scheduled posts to process');
      return new Response(
        JSON.stringify({ message: 'Nenhum post agendado para processar', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${scheduledPosts.length} scheduled posts to process`);

    const results: any[] = [];

    for (const post of scheduledPosts) {
      const details = post.details as any;
      const { platform, content, mediaUrl, mediaType } = details;

      console.log(`Publishing to ${platform}: ${content?.substring(0, 50)}...`);

      try {
        let publishResult: any = null;

        if (platform === 'facebook' && FACEBOOK_PAGE_ID) {
          // Publish to Facebook
          if (mediaUrl && (mediaType === 'image' || mediaType === 'video')) {
            // Photo/Video post
            const endpoint = mediaType === 'video' ? 'videos' : 'photos';
            const mediaParam = mediaType === 'video' ? 'file_url' : 'url';
            
            const fbResponse = await fetch(
              `https://graph.facebook.com/v18.0/${FACEBOOK_PAGE_ID}/${endpoint}`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${META_SYSTEM_USER_TOKEN}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  [mediaParam]: mediaUrl,
                  caption: content || '',
                  published: true,
                }),
              }
            );
            publishResult = await fbResponse.json();
          } else {
            // Text post
            const fbResponse = await fetch(
              `https://graph.facebook.com/v18.0/${FACEBOOK_PAGE_ID}/feed`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${META_SYSTEM_USER_TOKEN}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  message: content,
                  published: true,
                }),
              }
            );
            publishResult = await fbResponse.json();
          }
        } else if (platform === 'instagram' && INSTAGRAM_ACCOUNT_ID) {
          // Instagram requires media
          if (mediaUrl) {
            // Step 1: Create media container
            const containerEndpoint = mediaType === 'video' 
              ? `https://graph.facebook.com/v18.0/${INSTAGRAM_ACCOUNT_ID}/media?media_type=REELS&video_url=${encodeURIComponent(mediaUrl)}&caption=${encodeURIComponent(content || '')}`
              : `https://graph.facebook.com/v18.0/${INSTAGRAM_ACCOUNT_ID}/media?image_url=${encodeURIComponent(mediaUrl)}&caption=${encodeURIComponent(content || '')}`;
            
            const containerResponse = await fetch(containerEndpoint, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${META_SYSTEM_USER_TOKEN}`,
              },
            });
            const containerData = await containerResponse.json();
            
            if (containerData.id) {
              // Step 2: Publish the container
              const publishResponse = await fetch(
                `https://graph.facebook.com/v18.0/${INSTAGRAM_ACCOUNT_ID}/media_publish`,
                {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${META_SYSTEM_USER_TOKEN}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    creation_id: containerData.id,
                  }),
                }
              );
              publishResult = await publishResponse.json();
            } else {
              publishResult = containerData;
            }
          } else {
            publishResult = { error: { message: 'Instagram requer mídia (imagem ou vídeo)' } };
          }
        }

        if (publishResult?.error) {
          console.error(`Error publishing to ${platform}:`, publishResult.error);
          results.push({
            post_id: post.id,
            platform,
            success: false,
            error: publishResult.error.message,
          });
        } else {
          console.log(`Successfully published to ${platform}:`, publishResult);
          
          // Update the scheduled post as published
          await supabase
            .from('admin_audit_log')
            .update({
              details: {
                ...details,
                published_at: new Date().toISOString(),
                post_id: publishResult?.id || publishResult?.post_id,
              },
            })
            .eq('id', post.id);

          results.push({
            post_id: post.id,
            platform,
            success: true,
            published_id: publishResult?.id || publishResult?.post_id,
          });
        }
      } catch (postError: any) {
        console.error(`Error processing post ${post.id}:`, postError);
        results.push({
          post_id: post.id,
          platform,
          success: false,
          error: postError.message,
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`Processed ${results.length} posts: ${successCount} success, ${failCount} failed`);

    return new Response(
      JSON.stringify({
        message: `Processados ${results.length} posts`,
        processed: results.length,
        success: successCount,
        failed: failCount,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error processing scheduled posts:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
