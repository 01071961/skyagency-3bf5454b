import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';
import { useToast } from '@/hooks/use-toast';

interface CommunityPost {
  id: string;
  user_id: string;
  title: string;
  content: string;
  course_id: string | null;
  likes_count: number;
  replies_count: number;
  is_pinned: boolean;
  is_resolved: boolean;
  created_at: string;
  updated_at: string;
  author?: {
    name: string;
    avatar_url: string | null;
  };
  course?: {
    name: string;
  };
  hasLiked?: boolean;
}

interface CommunityReply {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  is_solution: boolean;
  likes_count: number;
  created_at: string;
  author?: {
    name: string;
    avatar_url: string | null;
  };
  hasLiked?: boolean;
}

interface CommunityStats {
  totalMembers: number;
  totalPosts: number;
  activeToday: number;
}

export const useCommunity = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [stats, setStats] = useState<CommunityStats>({
    totalMembers: 0,
    totalPosts: 0,
    activeToday: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchPosts = useCallback(async (sortBy: 'recent' | 'popular' = 'recent') => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const orderColumn = sortBy === 'popular' ? 'likes_count' : 'created_at';
      
      const { data: postsData, error } = await supabase
        .from('community_posts')
        .select(`
          *,
          course:products(name)
        `)
        .order(orderColumn, { ascending: false })
        .limit(50);

      if (error) throw error;

      // Get author info for each post
      const userIds = [...new Set(postsData?.map(p => p.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));

      // Check which posts user has liked
      const { data: userLikes } = await supabase
        .from('community_likes')
        .select('post_id')
        .eq('user_id', user.id)
        .not('post_id', 'is', null);

      const likedPostIds = new Set(userLikes?.map(l => l.post_id));

      const formattedPosts = postsData?.map(post => ({
        ...post,
        author: profileMap.get(post.user_id) || { name: 'Usuário', avatar_url: null },
        course: Array.isArray(post.course) ? post.course[0] : post.course,
        hasLiked: likedPostIds.has(post.id)
      })) || [];

      setPosts(formattedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const fetchStats = useCallback(async () => {
    try {
      // Total members (profiles with enrollments)
      const { count: totalMembers } = await supabase
        .from('enrollments')
        .select('user_id', { count: 'exact', head: true });

      // Total posts
      const { count: totalPosts } = await supabase
        .from('community_posts')
        .select('*', { count: 'exact', head: true });

      // Active today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: activeToday } = await supabase
        .from('lesson_progress')
        .select('user_id', { count: 'exact', head: true })
        .gte('updated_at', today.toISOString());

      setStats({
        totalMembers: totalMembers || 0,
        totalPosts: totalPosts || 0,
        activeToday: activeToday || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  const createPost = async (title: string, content: string, courseId?: string) => {
    if (!user?.id) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar logado para publicar',
        variant: 'destructive'
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('community_posts')
        .insert({
          user_id: user.id,
          title,
          content,
          course_id: courseId || null
        });

      if (error) throw error;

      toast({
        title: 'Publicado!',
        description: 'Sua discussão foi criada com sucesso'
      });

      fetchPosts();
      return true;
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a discussão',
        variant: 'destructive'
      });
      return false;
    }
  };

  const toggleLike = async (postId: string) => {
    if (!user?.id) return;

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    try {
      if (post.hasLiked) {
        // Unlike
        await supabase
          .from('community_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', postId);
      } else {
        // Like
        await supabase
          .from('community_likes')
          .insert({
            user_id: user.id,
            post_id: postId
          });
      }

      // Update local state optimistically
      setPosts(prev => prev.map(p => 
        p.id === postId 
          ? { 
              ...p, 
              hasLiked: !p.hasLiked,
              likes_count: p.hasLiked ? p.likes_count - 1 : p.likes_count + 1
            }
          : p
      ));
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const fetchReplies = async (postId: string): Promise<CommunityReply[]> => {
    if (!user?.id) return [];

    try {
      const { data, error } = await supabase
        .from('community_replies')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get author info
      const userIds = [...new Set(data?.map(r => r.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));

      // Check liked replies
      const { data: userLikes } = await supabase
        .from('community_likes')
        .select('reply_id')
        .eq('user_id', user.id)
        .not('reply_id', 'is', null);

      const likedReplyIds = new Set(userLikes?.map(l => l.reply_id));

      return data?.map(reply => ({
        ...reply,
        author: profileMap.get(reply.user_id) || { name: 'Usuário', avatar_url: null },
        hasLiked: likedReplyIds.has(reply.id)
      })) || [];
    } catch (error) {
      console.error('Error fetching replies:', error);
      return [];
    }
  };

  const createReply = async (postId: string, content: string) => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from('community_replies')
        .insert({
          post_id: postId,
          user_id: user.id,
          content
        });

      if (error) throw error;

      toast({
        title: 'Resposta enviada!',
        description: 'Sua resposta foi publicada'
      });

      return true;
    } catch (error) {
      console.error('Error creating reply:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a resposta',
        variant: 'destructive'
      });
      return false;
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchStats();
  }, [fetchPosts, fetchStats]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('community-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_posts'
        },
        () => {
          fetchPosts();
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPosts, fetchStats]);

  return {
    posts,
    stats,
    isLoading,
    fetchPosts,
    createPost,
    toggleLike,
    fetchReplies,
    createReply,
    refetch: () => {
      fetchPosts();
      fetchStats();
    }
  };
};
