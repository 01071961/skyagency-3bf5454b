import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

interface YouTubeRequest {
  action: 'search' | 'video-details' | 'channel' | 'playlists' | 'playlist-items' | 'live-broadcasts' | 'trending';
  query?: string;
  videoId?: string;
  channelId?: string;
  playlistId?: string;
  maxResults?: number;
  pageToken?: string;
  regionCode?: string;
  type?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');
    
    if (!YOUTUBE_API_KEY) {
      console.error('YOUTUBE_API_KEY is not configured');
      throw new Error('YouTube API key not configured');
    }

    const body: YouTubeRequest = await req.json();
    const { action, query, videoId, channelId, playlistId, maxResults = 10, pageToken, regionCode = 'BR', type = 'video' } = body;

    console.log(`YouTube API request: action=${action}, query=${query}, videoId=${videoId}`);

    let endpoint = '';
    let params = new URLSearchParams({ key: YOUTUBE_API_KEY });

    switch (action) {
      case 'search':
        if (!query) throw new Error('Query is required for search');
        endpoint = '/search';
        params.append('part', 'snippet');
        params.append('q', query);
        params.append('maxResults', maxResults.toString());
        params.append('type', type);
        params.append('regionCode', regionCode);
        if (pageToken) params.append('pageToken', pageToken);
        break;

      case 'video-details':
        if (!videoId) throw new Error('Video ID is required');
        endpoint = '/videos';
        params.append('part', 'snippet,contentDetails,statistics,liveStreamingDetails');
        params.append('id', videoId);
        break;

      case 'channel':
        if (!channelId) throw new Error('Channel ID is required');
        endpoint = '/channels';
        params.append('part', 'snippet,contentDetails,statistics,brandingSettings');
        params.append('id', channelId);
        break;

      case 'playlists':
        endpoint = '/playlists';
        params.append('part', 'snippet,contentDetails');
        if (channelId) {
          params.append('channelId', channelId);
        }
        params.append('maxResults', maxResults.toString());
        if (pageToken) params.append('pageToken', pageToken);
        break;

      case 'playlist-items':
        if (!playlistId) throw new Error('Playlist ID is required');
        endpoint = '/playlistItems';
        params.append('part', 'snippet,contentDetails');
        params.append('playlistId', playlistId);
        params.append('maxResults', maxResults.toString());
        if (pageToken) params.append('pageToken', pageToken);
        break;

      case 'live-broadcasts':
        endpoint = '/search';
        params.append('part', 'snippet');
        params.append('eventType', 'live');
        params.append('type', 'video');
        params.append('maxResults', maxResults.toString());
        params.append('regionCode', regionCode);
        if (query) params.append('q', query);
        if (pageToken) params.append('pageToken', pageToken);
        break;

      case 'trending':
        endpoint = '/videos';
        params.append('part', 'snippet,contentDetails,statistics');
        params.append('chart', 'mostPopular');
        params.append('regionCode', regionCode);
        params.append('maxResults', maxResults.toString());
        if (pageToken) params.append('pageToken', pageToken);
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    const url = `${YOUTUBE_API_BASE}${endpoint}?${params.toString()}`;
    console.log(`Fetching YouTube API: ${endpoint}`);

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      console.error('YouTube API error:', data);
      throw new Error(data.error?.message || 'YouTube API request failed');
    }

    console.log(`YouTube API success: ${data.items?.length || 0} items returned`);

    return new Response(JSON.stringify({
      success: true,
      data,
      pageInfo: data.pageInfo,
      nextPageToken: data.nextPageToken,
      prevPageToken: data.prevPageToken,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('YouTube API error:', errorMessage);
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
