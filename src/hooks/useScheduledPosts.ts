import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ScheduledPost {
  id: string;
  user_id: string;
  platform: 'facebook' | 'instagram' | 'both';
  content: string;
  media_url: string | null;
  media_type: 'image' | 'video';
  scheduled_at: string;
  published_at: string | null;
  status: 'pending' | 'published' | 'failed' | 'cancelled';
  error_message: string | null;
  facebook_post_id: string | null;
  instagram_post_id: string | null;
  created_at: string;
}

interface CreatePostInput {
  platform: 'facebook' | 'instagram' | 'both';
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  scheduledAt: string;
}

export const useScheduledPosts = () => {
  const { toast } = useToast();
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('scheduled_posts')
        .select('*')
        .order('scheduled_at', { ascending: true });

      if (error) throw error;
      setPosts((data || []) as ScheduledPost[]);
    } catch (error) {
      console.error('Error fetching scheduled posts:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createPost = async (input: CreatePostInput): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { data, error } = await supabase
        .from('scheduled_posts')
        .insert({
          user_id: user.id,
          platform: input.platform,
          content: input.content,
          media_url: input.mediaUrl || null,
          media_type: input.mediaType || 'image',
          scheduled_at: input.scheduledAt,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Post agendado!',
        description: `Agendado para ${new Date(input.scheduledAt).toLocaleString('pt-BR')}`
      });

      fetchPosts();
      return data.id;
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível agendar o post',
        variant: 'destructive'
      });
      return null;
    }
  };

  const publishNow = async (postId: string): Promise<boolean> => {
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) throw new Error('Post não encontrado');

      const { data, error } = await supabase.functions.invoke('publish-social', {
        body: {
          platform: post.platform,
          content: post.content,
          mediaUrl: post.media_url,
          mediaType: post.media_type
        }
      });

      if (error) throw error;

      if (data?.success) {
        await supabase
          .from('scheduled_posts')
          .update({
            status: 'published',
            published_at: new Date().toISOString(),
            facebook_post_id: data.results?.facebook?.postId,
            instagram_post_id: data.results?.instagram?.postId
          })
          .eq('id', postId);

        toast({
          title: 'Publicado com sucesso!',
          description: `Post publicado em ${post.platform === 'both' ? 'Facebook e Instagram' : post.platform}`
        });

        fetchPosts();
        return true;
      } else {
        const errorMsg = data?.results?.facebook?.error || data?.results?.instagram?.error || 'Erro desconhecido';
        
        await supabase
          .from('scheduled_posts')
          .update({
            status: 'failed',
            error_message: errorMsg
          })
          .eq('id', postId);

        toast({
          title: 'Falha na publicação',
          description: errorMsg,
          variant: 'destructive'
        });

        fetchPosts();
        return false;
      }
    } catch (error) {
      console.error('Error publishing:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível publicar o post',
        variant: 'destructive'
      });
      return false;
    }
  };

  const deletePost = async (postId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('scheduled_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      toast({
        title: 'Post removido',
        description: 'O post agendado foi removido'
      });

      fetchPosts();
      return true;
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o post',
        variant: 'destructive'
      });
      return false;
    }
  };

  const cancelPost = async (postId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('scheduled_posts')
        .update({ status: 'cancelled' })
        .eq('id', postId);

      if (error) throw error;

      toast({
        title: 'Post cancelado',
        description: 'O agendamento foi cancelado'
      });

      fetchPosts();
      return true;
    } catch (error) {
      console.error('Error canceling post:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('scheduled-posts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scheduled_posts'
        },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPosts]);

  return {
    posts,
    isLoading,
    createPost,
    publishNow,
    deletePost,
    cancelPost,
    refetch: fetchPosts,
    pendingCount: posts.filter(p => p.status === 'pending').length,
    publishedCount: posts.filter(p => p.status === 'published').length,
    failedCount: posts.filter(p => p.status === 'failed').length
  };
};
