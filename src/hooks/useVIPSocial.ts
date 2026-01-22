import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';
import { toast } from 'sonner';

export interface VIPPost {
  id: string;
  author_id: string;
  content: string | null;
  media_type: 'text' | 'image' | 'video' | 'short' | 'live';
  media_url: string | null;
  youtube_video_id: string | null;
  thumbnail_url: string | null;
  title: string | null;
  hashtags: string[] | null;
  views_count: number;
  likes_count: number;
  dislikes_count: number;
  comments_count: number;
  shares_count: number;
  is_live: boolean;
  live_started_at: string | null;
  live_ended_at: string | null;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    is_vip?: boolean;
  };
  user_reaction?: string | null;
  is_bookmarked?: boolean;
}

export interface VIPComment {
  id: string;
  post_id: string;
  author_id: string;
  parent_id: string | null;
  content: string;
  likes_count: number;
  replies_count: number;
  is_pinned: boolean;
  created_at: string;
  author?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    is_vip?: boolean;
  };
  replies?: VIPComment[];
}

export interface VIPUser {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  is_vip?: boolean;
  followers_count?: number;
  following_count?: number;
  posts_count?: number;
  is_following?: boolean;
}

// Hook for fetching feed posts
export function useVIPFeed(filter: 'all' | 'following' | 'shorts' | 'live' = 'all') {
  const [posts, setPosts] = useState<VIPPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const { user } = useAuth();
  const PAGE_SIZE = 10;

  const fetchPosts = useCallback(async (offset = 0) => {
    try {
      let query = supabase
        .from('vip_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (filter === 'shorts') {
        query = query.eq('media_type', 'short');
      } else if (filter === 'live') {
        query = query.eq('is_live', true);
      } else if (filter === 'following' && user) {
        const { data: followingIds } = await supabase
          .from('vip_follows')
          .select('following_id')
          .eq('follower_id', user.id);
        
        if (followingIds && followingIds.length > 0) {
          query = query.in('author_id', followingIds.map(f => f.following_id));
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      // Get author profiles
      if (data && data.length > 0) {
        const authorIds = [...new Set(data.map(p => p.author_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, name, avatar_url')
          .in('user_id', authorIds);

        const profilesMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

        // Get user reactions and bookmarks
        let reactionsMap = new Map();
        let bookmarksSet = new Set<string>();

        if (user) {
          const postIds = data.map(p => p.id);
          
          const [reactionsResult, bookmarksResult] = await Promise.all([
            supabase
              .from('vip_reactions')
              .select('post_id, reaction_type')
              .eq('user_id', user.id)
              .in('post_id', postIds),
            supabase
              .from('vip_bookmarks')
              .select('post_id')
              .eq('user_id', user.id)
              .in('post_id', postIds)
          ]);

          reactionsMap = new Map(
            reactionsResult.data?.map(r => [r.post_id, r.reaction_type]) || []
          );
          bookmarksSet = new Set(
            bookmarksResult.data?.map(b => b.post_id) || []
          );
        }

        const postsWithAuthors = data.map(post => {
          const profile = profilesMap.get(post.author_id);
          return {
            ...post,
            media_type: post.media_type as VIPPost['media_type'],
            author: profile ? {
              id: profile.user_id,
              full_name: profile.name,
              avatar_url: profile.avatar_url,
            } : undefined,
            user_reaction: reactionsMap.get(post.id) || null,
            is_bookmarked: bookmarksSet.has(post.id),
          };
        }) as VIPPost[];

        if (offset === 0) {
          setPosts(postsWithAuthors);
        } else {
          setPosts(prev => [...prev, ...postsWithAuthors]);
        }

        setHasMore(data.length === PAGE_SIZE);
      } else {
        if (offset === 0) {
          setPosts([]);
        }
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Erro ao carregar posts');
    } finally {
      setLoading(false);
    }
  }, [filter, user]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchPosts(posts.length);
    }
  }, [loading, hasMore, posts.length, fetchPosts]);

  useEffect(() => {
    setLoading(true);
    setPosts([]);
    fetchPosts(0);
  }, [filter, fetchPosts]);

  // Real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('vip-posts-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vip_posts' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setPosts(prev => [payload.new as VIPPost, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setPosts(prev => prev.map(p => 
              p.id === payload.new.id ? { ...p, ...payload.new } : p
            ));
          } else if (payload.eventType === 'DELETE') {
            setPosts(prev => prev.filter(p => p.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { posts, loading, hasMore, loadMore, refetch: () => fetchPosts(0) };
}

// Hook for reactions
export function useVIPReactions() {
  const { user } = useAuth();

  const addReaction = useCallback(async (
    postId: string,
    reactionType: string,
    currentReaction: string | null
  ) => {
    if (!user) {
      toast.error('Faça login para reagir');
      return null;
    }

    try {
      // Remove existing reaction if any
      if (currentReaction) {
        await supabase
          .from('vip_reactions')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', postId);
      }

      // Add new reaction if different from current
      if (reactionType !== currentReaction) {
        await supabase
          .from('vip_reactions')
          .insert({
            user_id: user.id,
            post_id: postId,
            reaction_type: reactionType
          });
        
        return reactionType;
      }

      return null;
    } catch (error) {
      console.error('Error adding reaction:', error);
      toast.error('Erro ao reagir');
      return currentReaction;
    }
  }, [user]);

  return { addReaction };
}

// Hook for follows
export function useVIPFollow() {
  const { user } = useAuth();
  const [following, setFollowing] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      supabase
        .from('vip_follows')
        .select('following_id')
        .eq('follower_id', user.id)
        .then(({ data }) => {
          if (data) {
            setFollowing(new Set(data.map(f => f.following_id)));
          }
        });
    }
  }, [user]);

  const toggleFollow = useCallback(async (targetUserId: string) => {
    if (!user) {
      toast.error('Faça login para seguir');
      return;
    }

    const isCurrentlyFollowing = following.has(targetUserId);

    try {
      if (isCurrentlyFollowing) {
        await supabase
          .from('vip_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId);
        
        setFollowing(prev => {
          const newSet = new Set(prev);
          newSet.delete(targetUserId);
          return newSet;
        });
        toast.success('Deixou de seguir');
      } else {
        await supabase
          .from('vip_follows')
          .insert({
            follower_id: user.id,
            following_id: targetUserId
          });
        
        setFollowing(prev => new Set(prev).add(targetUserId));
        toast.success('Seguindo!');
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error('Erro ao seguir usuário');
    }
  }, [user, following]);

  const isFollowing = useCallback((userId: string) => following.has(userId), [following]);

  return { toggleFollow, isFollowing };
}

// Hook for comments
export function useVIPComments(postId: string) {
  const [comments, setComments] = useState<VIPComment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchComments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('vip_comments')
        .select('*')
        .eq('post_id', postId)
        .is('parent_id', null)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        setComments([]);
        setLoading(false);
        return;
      }

      // Get all author IDs including from future replies
      const commentIds = data.map(c => c.id);
      const { data: allReplies } = await supabase
        .from('vip_comments')
        .select('*')
        .in('parent_id', commentIds)
        .order('created_at', { ascending: true });

      // Get all unique author IDs
      const allComments = [...data, ...(allReplies || [])];
      const authorIds = [...new Set(allComments.map(c => c.author_id))];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, avatar_url')
        .in('user_id', authorIds);

      const profilesMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Build comments with authors and replies
      const commentsWithReplies: VIPComment[] = data.map(comment => {
        const profile = profilesMap.get(comment.author_id);
        const replies = (allReplies || [])
          .filter(r => r.parent_id === comment.id)
          .map(reply => {
            const replyProfile = profilesMap.get(reply.author_id);
            return {
              ...reply,
              author: replyProfile ? {
                id: replyProfile.user_id,
                full_name: replyProfile.name,
                avatar_url: replyProfile.avatar_url,
              } : undefined,
            };
          });

        return {
          ...comment,
          author: profile ? {
            id: profile.user_id,
            full_name: profile.name,
            avatar_url: profile.avatar_url,
          } : undefined,
          replies,
        };
      });

      setComments(commentsWithReplies);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  const addComment = useCallback(async (content: string, parentId?: string) => {
    if (!user) {
      toast.error('Faça login para comentar');
      return;
    }

    try {
      const { error } = await supabase
        .from('vip_comments')
        .insert({
          post_id: postId,
          author_id: user.id,
          parent_id: parentId || null,
          content
        });

      if (error) throw error;

      toast.success('Comentário adicionado!');
      fetchComments();
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Erro ao comentar');
    }
  }, [user, postId, fetchComments]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Real-time comments
  useEffect(() => {
    const channel = supabase
      .channel(`comments-${postId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vip_comments', filter: `post_id=eq.${postId}` },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, fetchComments]);

  return { comments, loading, addComment, refetch: fetchComments };
}

// Hook for bookmarks
export function useVIPBookmarks() {
  const { user } = useAuth();

  const toggleBookmark = useCallback(async (postId: string, isCurrentlyBookmarked: boolean) => {
    if (!user) {
      toast.error('Faça login para salvar');
      return !isCurrentlyBookmarked;
    }

    try {
      if (isCurrentlyBookmarked) {
        await supabase
          .from('vip_bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', postId);
        toast.success('Removido dos salvos');
      } else {
        await supabase
          .from('vip_bookmarks')
          .insert({
            user_id: user.id,
            post_id: postId
          });
        toast.success('Salvo!');
      }

      return !isCurrentlyBookmarked;
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      toast.error('Erro ao salvar');
      return isCurrentlyBookmarked;
    }
  }, [user]);

  return { toggleBookmark };
}

// Hook for live chat
export function useVIPLiveChat(postId: string) {
  const [messages, setMessages] = useState<any[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('vip_live_chat')
        .select(`
          *,
          author:profiles!vip_live_chat_author_id_fkey(id, full_name, avatar_url)
        `)
        .eq('post_id', postId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
        .limit(100);

      setMessages(data || []);
    };

    fetchMessages();

    const channel = supabase
      .channel(`live-chat-${postId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'vip_live_chat', filter: `post_id=eq.${postId}` },
        (payload) => {
          setMessages(prev => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId]);

  const sendMessage = useCallback(async (content: string) => {
    if (!user) {
      toast.error('Faça login para enviar mensagens');
      return;
    }

    try {
      await supabase
        .from('vip_live_chat')
        .insert({
          post_id: postId,
          author_id: user.id,
          content
        });
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erro ao enviar mensagem');
    }
  }, [user, postId]);

  return { messages, sendMessage };
}

// Hook for creating posts
export function useCreatePost() {
  const { user } = useAuth();

  const createPost = useCallback(async (data: {
    content?: string;
    media_type: 'text' | 'image' | 'video' | 'short' | 'live';
    media_url?: string;
    youtube_video_id?: string;
    thumbnail_url?: string;
    title?: string;
    hashtags?: string[];
  }) => {
    if (!user) {
      toast.error('Faça login para postar');
      return null;
    }

    try {
      const { data: post, error } = await supabase
        .from('vip_posts')
        .insert({
          author_id: user.id,
          ...data
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Post criado com sucesso!');
      return post;
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Erro ao criar post');
      return null;
    }
  }, [user]);

  return { createPost };
}
