import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  viewCount?: string;
  likeCount?: string;
  duration?: string;
  isLive?: boolean;
  liveConcurrentViewers?: string;
}

export interface YouTubeChannel {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  subscriberCount: string;
  videoCount: string;
  viewCount: string;
  bannerUrl?: string;
}

export interface YouTubePlaylist {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
  itemCount: number;
  publishedAt: string;
}

interface YouTubeSearchResult {
  videos: YouTubeVideo[];
  nextPageToken?: string;
  totalResults?: number;
}

export function useYouTubeAPI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const makeRequest = useCallback(async (action: string, params: Record<string, any> = {}) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('youtube-api', {
        body: { action, ...params },
      });

      if (fnError) throw fnError;
      if (!data.success) throw new Error(data.error);

      return data;
    } catch (err: any) {
      const message = err.message || 'Erro ao conectar com YouTube';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const searchVideos = useCallback(async (query: string, maxResults = 10, pageToken?: string): Promise<YouTubeSearchResult | null> => {
    const result = await makeRequest('search', { query, maxResults, pageToken, type: 'video' });
    
    if (!result?.data?.items) return null;

    const videos: YouTubeVideo[] = result.data.items.map((item: any) => ({
      id: item.id.videoId || item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url,
      channelId: item.snippet.channelId,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      isLive: item.snippet.liveBroadcastContent === 'live',
    }));

    return {
      videos,
      nextPageToken: result.nextPageToken,
      totalResults: result.pageInfo?.totalResults,
    };
  }, [makeRequest]);

  const getVideoDetails = useCallback(async (videoId: string): Promise<YouTubeVideo | null> => {
    const result = await makeRequest('video-details', { videoId });
    
    if (!result?.data?.items?.[0]) return null;

    const item = result.data.items[0];
    return {
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl: item.snippet.thumbnails?.maxres?.url || item.snippet.thumbnails?.high?.url,
      channelId: item.snippet.channelId,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      viewCount: item.statistics?.viewCount,
      likeCount: item.statistics?.likeCount,
      duration: item.contentDetails?.duration,
      isLive: item.snippet.liveBroadcastContent === 'live',
      liveConcurrentViewers: item.liveStreamingDetails?.concurrentViewers,
    };
  }, [makeRequest]);

  const getChannelInfo = useCallback(async (channelId: string): Promise<YouTubeChannel | null> => {
    const result = await makeRequest('channel', { channelId });
    
    if (!result?.data?.items?.[0]) return null;

    const item = result.data.items[0];
    return {
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl: item.snippet.thumbnails?.high?.url,
      subscriberCount: item.statistics?.subscriberCount,
      videoCount: item.statistics?.videoCount,
      viewCount: item.statistics?.viewCount,
      bannerUrl: item.brandingSettings?.image?.bannerExternalUrl,
    };
  }, [makeRequest]);

  const getLiveBroadcasts = useCallback(async (query?: string, maxResults = 10, pageToken?: string): Promise<YouTubeSearchResult | null> => {
    const result = await makeRequest('live-broadcasts', { query, maxResults, pageToken });
    
    if (!result?.data?.items) return null;

    const videos: YouTubeVideo[] = result.data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url,
      channelId: item.snippet.channelId,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      isLive: true,
    }));

    return {
      videos,
      nextPageToken: result.nextPageToken,
      totalResults: result.pageInfo?.totalResults,
    };
  }, [makeRequest]);

  const getTrendingVideos = useCallback(async (maxResults = 10, pageToken?: string): Promise<YouTubeSearchResult | null> => {
    const result = await makeRequest('trending', { maxResults, pageToken });
    
    if (!result?.data?.items) return null;

    const videos: YouTubeVideo[] = result.data.items.map((item: any) => ({
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl: item.snippet.thumbnails?.high?.url,
      channelId: item.snippet.channelId,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      viewCount: item.statistics?.viewCount,
      likeCount: item.statistics?.likeCount,
      duration: item.contentDetails?.duration,
    }));

    return {
      videos,
      nextPageToken: result.nextPageToken,
      totalResults: result.pageInfo?.totalResults,
    };
  }, [makeRequest]);

  const getPlaylists = useCallback(async (channelId: string, maxResults = 10, pageToken?: string): Promise<{ playlists: YouTubePlaylist[]; nextPageToken?: string } | null> => {
    const result = await makeRequest('playlists', { channelId, maxResults, pageToken });
    
    if (!result?.data?.items) return null;

    const playlists: YouTubePlaylist[] = result.data.items.map((item: any) => ({
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url,
      channelTitle: item.snippet.channelTitle,
      itemCount: item.contentDetails?.itemCount || 0,
      publishedAt: item.snippet.publishedAt,
    }));

    return {
      playlists,
      nextPageToken: result.nextPageToken,
    };
  }, [makeRequest]);

  const getPlaylistItems = useCallback(async (playlistId: string, maxResults = 20, pageToken?: string): Promise<YouTubeSearchResult | null> => {
    const result = await makeRequest('playlist-items', { playlistId, maxResults, pageToken });
    
    if (!result?.data?.items) return null;

    const videos: YouTubeVideo[] = result.data.items.map((item: any) => ({
      id: item.contentDetails?.videoId || item.snippet.resourceId?.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url,
      channelId: item.snippet.channelId,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
    }));

    return {
      videos,
      nextPageToken: result.nextPageToken,
      totalResults: result.pageInfo?.totalResults,
    };
  }, [makeRequest]);

  return {
    loading,
    error,
    searchVideos,
    getVideoDetails,
    getChannelInfo,
    getLiveBroadcasts,
    getTrendingVideos,
    getPlaylists,
    getPlaylistItems,
  };
}
