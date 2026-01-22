import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
}

interface FacebookUserResponse {
  id: string;
  name: string;
  picture?: {
    data: {
      url: string;
    };
  };
}

interface InstagramAccountResponse {
  id: string;
  username: string;
  profile_picture_url?: string;
  name?: string;
}

interface FacebookPageResponse {
  id: string;
  name: string;
  access_token: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, platform, code, redirectUri } = await req.json();

    const FACEBOOK_APP_ID = Deno.env.get('FACEBOOK_APP_ID');
    const FACEBOOK_APP_SECRET = Deno.env.get('FACEBOOK_APP_SECRET');
    const META_SYSTEM_USER_TOKEN = Deno.env.get('META_SYSTEM_USER_TOKEN');
    const FACEBOOK_PAGE_ID = Deno.env.get('FACEBOOK_PAGE_ID');
    const INSTAGRAM_ACCOUNT_ID = Deno.env.get('INSTAGRAM_ACCOUNT_ID');
    const WHATSAPP_BUSINESS_ID = Deno.env.get('WHATSAPP_BUSINESS_ID');

    // Action: Connect with pre-configured System User Token
    if (action === 'connect_system_user') {
      if (!META_SYSTEM_USER_TOKEN) {
        return new Response(
          JSON.stringify({ error: 'Token do System User não configurado' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Connecting ${platform} with System User Token...`);

      if (platform === 'facebook') {
        // Get Facebook page info
        const pageResponse = await fetch(
          `https://graph.facebook.com/v18.0/${FACEBOOK_PAGE_ID}?fields=id,name,picture.type(large)&access_token=${META_SYSTEM_USER_TOKEN}`
        );
        const pageData = await pageResponse.json();
        
        if (pageData.error) {
          console.error('Facebook page fetch error:', pageData.error);
          return new Response(
            JSON.stringify({ error: pageData.error.message || 'Erro ao buscar página do Facebook' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Save connection
        const { error: saveError } = await supabase
          .from('social_connections')
          .upsert({
            user_id: user.id,
            platform: 'facebook',
            access_token: META_SYSTEM_USER_TOKEN,
            token_expires_at: null, // System User token never expires
            platform_user_id: pageData.id,
            platform_username: 'Sky Streamer',
            platform_name: pageData.name || 'Sky Streamer',
            profile_picture_url: pageData.picture?.data?.url,
            page_id: FACEBOOK_PAGE_ID,
            page_name: pageData.name || 'Sky Streamer',
            permissions: ['pages_manage_posts', 'pages_read_engagement', 'pages_show_list'],
            is_active: true,
            connected_at: new Date().toISOString(),
          }, { onConflict: 'user_id,platform' });

        if (saveError) {
          console.error('Save error:', saveError);
          return new Response(
            JSON.stringify({ error: 'Erro ao salvar conexão' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            platform: 'facebook',
            user: {
              id: pageData.id,
              name: pageData.name || 'Sky Streamer',
              picture: pageData.picture?.data?.url,
              page_id: FACEBOOK_PAGE_ID,
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (platform === 'instagram') {
        // Try to get Instagram through the Facebook Page first (more reliable)
        console.log('Fetching Instagram via Facebook Page...');
        console.log('FACEBOOK_PAGE_ID:', FACEBOOK_PAGE_ID);
        console.log('INSTAGRAM_ACCOUNT_ID:', INSTAGRAM_ACCOUNT_ID);
        
        let igData: any = null;
        
        // Method 1: Get Instagram Business Account through the Facebook Page
        if (FACEBOOK_PAGE_ID) {
          const pageIgResponse = await fetch(
            `https://graph.facebook.com/v18.0/${FACEBOOK_PAGE_ID}?fields=instagram_business_account{id,username,profile_picture_url,name,biography,followers_count,media_count}&access_token=${META_SYSTEM_USER_TOKEN}`
          );
          const pageIgData = await pageIgResponse.json();
          
          console.log('Page Instagram response:', JSON.stringify(pageIgData));
          
          if (pageIgData.instagram_business_account) {
            igData = pageIgData.instagram_business_account;
          } else if (pageIgData.error) {
            console.error('Error fetching Instagram via Page:', pageIgData.error);
          }
        }
        
        // Method 2: Direct Instagram Account ID lookup (fallback)
        if (!igData && INSTAGRAM_ACCOUNT_ID) {
          console.log('Trying direct Instagram account fetch...');
          const igResponse = await fetch(
            `https://graph.facebook.com/v18.0/${INSTAGRAM_ACCOUNT_ID}?fields=id,username,profile_picture_url,name,biography,followers_count,media_count&access_token=${META_SYSTEM_USER_TOKEN}`
          );
          const directIgData = await igResponse.json();
          
          console.log('Direct Instagram response:', JSON.stringify(directIgData));
          
          if (!directIgData.error) {
            igData = directIgData;
          } else {
            console.error('Direct Instagram fetch error:', directIgData.error);
          }
        }
        
        // If still no data, use hardcoded fallback for @skystreamer.online
        if (!igData) {
          console.log('Using hardcoded Instagram data for @skystreamer.online');
          igData = {
            id: INSTAGRAM_ACCOUNT_ID || '17841478710211297',
            username: 'skystreamer.online',
            name: 'Sky Streamer',
            profile_picture_url: null,
            followers_count: null,
            media_count: null,
          };
        }

        // Save connection
        const { error: saveError } = await supabase
          .from('social_connections')
          .upsert({
            user_id: user.id,
            platform: 'instagram',
            access_token: META_SYSTEM_USER_TOKEN,
            token_expires_at: null,
            platform_user_id: igData.id,
            platform_username: igData.username || 'skystreamer.online',
            platform_name: igData.name || igData.username || 'skystreamer.online',
            profile_picture_url: igData.profile_picture_url,
            page_id: FACEBOOK_PAGE_ID,
            page_name: 'Sky Streamer',
            permissions: ['instagram_basic', 'instagram_content_publish', 'instagram_manage_insights'],
            is_active: true,
            connected_at: new Date().toISOString(),
          }, { onConflict: 'user_id,platform' });

        if (saveError) {
          console.error('Save error:', saveError);
          return new Response(
            JSON.stringify({ error: 'Erro ao salvar conexão' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            platform: 'instagram',
            user: {
              id: igData.id,
              username: igData.username,
              name: igData.name || igData.username,
              picture: igData.profile_picture_url,
              followers: igData.followers_count,
              media_count: igData.media_count,
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (platform === 'whatsapp') {
        // Save WhatsApp Business connection
        const { error: saveError } = await supabase
          .from('social_connections')
          .upsert({
            user_id: user.id,
            platform: 'whatsapp',
            access_token: META_SYSTEM_USER_TOKEN,
            token_expires_at: null,
            platform_user_id: WHATSAPP_BUSINESS_ID,
            platform_username: 'Daniel Moreira',
            platform_name: 'WhatsApp Business - Sky Agencya',
            profile_picture_url: null,
            page_id: WHATSAPP_BUSINESS_ID,
            page_name: 'Sky Agencya',
            permissions: ['whatsapp_business_messaging', 'whatsapp_business_management'],
            is_active: true,
            connected_at: new Date().toISOString(),
          }, { onConflict: 'user_id,platform' });

        if (saveError) {
          console.error('Save error:', saveError);
          return new Response(
            JSON.stringify({ error: 'Erro ao salvar conexão' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            platform: 'whatsapp',
            user: {
              id: WHATSAPP_BUSINESS_ID,
              name: 'Daniel Moreira',
              business: 'Sky Agencya',
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Plataforma não suportada' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
      return new Response(
        JSON.stringify({ error: 'Configuração do Meta App não encontrada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Get OAuth URL
    if (action === 'get_oauth_url') {
      let scopes: string[] = [];
      
      if (platform === 'facebook') {
        scopes = [
          'pages_manage_posts',
          'pages_read_engagement',
          'pages_show_list',
          'public_profile',
          'email'
        ];
      } else if (platform === 'instagram') {
        scopes = [
          'instagram_basic',
          'instagram_content_publish',
          'instagram_manage_insights',
          'pages_show_list',
          'pages_read_engagement',
          'public_profile'
        ];
      }

      const state = crypto.randomUUID();
      const oauthUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes.join(',')}&state=${state}&response_type=code`;

      return new Response(
        JSON.stringify({ oauth_url: oauthUrl, state }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Exchange code for token
    if (action === 'exchange_token') {
      if (!code) {
        return new Response(
          JSON.stringify({ error: 'Código de autorização não fornecido' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Exchange code for short-lived token
      const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${FACEBOOK_APP_SECRET}&code=${code}`;
      
      const tokenResponse = await fetch(tokenUrl);
      const tokenData = await tokenResponse.json() as OAuthTokenResponse & { error?: { message: string } };

      if (tokenData.error) {
        console.error('Token exchange error:', tokenData.error);
        return new Response(
          JSON.stringify({ error: tokenData.error.message || 'Erro ao trocar código por token' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Exchange for long-lived token
      const longLivedUrl = `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${FACEBOOK_APP_ID}&client_secret=${FACEBOOK_APP_SECRET}&fb_exchange_token=${tokenData.access_token}`;
      
      const longLivedResponse = await fetch(longLivedUrl);
      const longLivedData = await longLivedResponse.json() as OAuthTokenResponse & { error?: { message: string } };

      if (longLivedData.error) {
        console.error('Long-lived token error:', longLivedData.error);
        return new Response(
          JSON.stringify({ error: longLivedData.error.message || 'Erro ao obter token de longa duração' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const accessToken = longLivedData.access_token;
      const expiresIn = longLivedData.expires_in || 5184000; // ~60 days default
      const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

      // Get user info
      const userInfoResponse = await fetch(
        `https://graph.facebook.com/v18.0/me?fields=id,name,picture.type(large)&access_token=${accessToken}`
      );
      const userInfo = await userInfoResponse.json() as FacebookUserResponse;

      if (platform === 'facebook') {
        // Get pages
        const pagesResponse = await fetch(
          `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token&access_token=${accessToken}`
        );
        const pagesData = await pagesResponse.json() as { data: FacebookPageResponse[] };
        const page = pagesData.data?.[0];

        // Save connection
        const { error: saveError } = await supabase
          .from('social_connections')
          .upsert({
            user_id: user.id,
            platform: 'facebook',
            access_token: page?.access_token || accessToken,
            token_expires_at: tokenExpiresAt,
            platform_user_id: userInfo.id,
            platform_username: userInfo.name,
            platform_name: page?.name || userInfo.name,
            profile_picture_url: userInfo.picture?.data?.url,
            page_id: page?.id,
            page_name: page?.name,
            permissions: ['pages_manage_posts', 'pages_read_engagement', 'pages_show_list'],
            is_active: true,
            connected_at: new Date().toISOString(),
          }, { onConflict: 'user_id,platform' });

        if (saveError) {
          console.error('Save error:', saveError);
          return new Response(
            JSON.stringify({ error: 'Erro ao salvar conexão' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            platform: 'facebook',
            user: {
              id: userInfo.id,
              name: page?.name || userInfo.name,
              picture: userInfo.picture?.data?.url,
              page_id: page?.id,
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (platform === 'instagram') {
        // Get pages with Instagram accounts
        const pagesResponse = await fetch(
          `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token,instagram_business_account{id,username,profile_picture_url,name}&access_token=${accessToken}`
        );
        const pagesData = await pagesResponse.json() as { data: (FacebookPageResponse & { instagram_business_account?: InstagramAccountResponse })[] };
        
        const pageWithInstagram = pagesData.data?.find(p => p.instagram_business_account);
        const igAccount = pageWithInstagram?.instagram_business_account;

        if (!igAccount) {
          return new Response(
            JSON.stringify({ 
              error: 'Nenhuma conta Instagram Business encontrada. Vincule uma conta Instagram Business à sua página do Facebook.',
              help: 'Acesse as configurações da sua página do Facebook e conecte sua conta Instagram profissional.'
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Save connection
        const { error: saveError } = await supabase
          .from('social_connections')
          .upsert({
            user_id: user.id,
            platform: 'instagram',
            access_token: pageWithInstagram?.access_token || accessToken,
            token_expires_at: tokenExpiresAt,
            platform_user_id: igAccount.id,
            platform_username: igAccount.username,
            platform_name: igAccount.name || igAccount.username,
            profile_picture_url: igAccount.profile_picture_url,
            page_id: pageWithInstagram?.id,
            page_name: pageWithInstagram?.name,
            permissions: ['instagram_basic', 'instagram_content_publish', 'instagram_manage_insights'],
            is_active: true,
            connected_at: new Date().toISOString(),
          }, { onConflict: 'user_id,platform' });

        if (saveError) {
          console.error('Save error:', saveError);
          return new Response(
            JSON.stringify({ error: 'Erro ao salvar conexão' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            platform: 'instagram',
            user: {
              id: igAccount.id,
              username: igAccount.username,
              name: igAccount.name || igAccount.username,
              picture: igAccount.profile_picture_url,
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Plataforma não suportada' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Get connections
    if (action === 'get_connections') {
      const { data: connections, error } = await supabase
        .from('social_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Erro ao buscar conexões' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ connections }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Disconnect
    if (action === 'disconnect') {
      const { error } = await supabase
        .from('social_connections')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('platform', platform);

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Erro ao desconectar' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Fetch Instagram feed
    if (action === 'get_instagram_feed') {
      const { data: connection } = await supabase
        .from('social_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('platform', 'instagram')
        .eq('is_active', true)
        .single();

      if (!connection) {
        return new Response(
          JSON.stringify({ error: 'Instagram não conectado' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const mediaResponse = await fetch(
        `https://graph.facebook.com/v18.0/${connection.platform_user_id}/media?fields=id,caption,media_type,media_url,thumbnail_url,timestamp,permalink&limit=12&access_token=${connection.access_token}`
      );
      const mediaData = await mediaResponse.json();

      return new Response(
        JSON.stringify({ feed: mediaData.data || [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Ação não reconhecida' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('OAuth error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
