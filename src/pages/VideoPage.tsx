import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Heart, Share2, MessageCircle, Eye, Calendar, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { VideoPlayer } from '@/components/video';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface VideoData {
  id: string;
  title: string;
  description: string;
  storage_url: string;
  thumbnail_url: string;
  duration: number;
  views_count: number;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user_id: string;
  user?: {
    name: string;
    avatar_url: string;
  };
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  likes_count: number;
  user?: {
    name: string;
    avatar_url: string;
  };
}

export default function VideoPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [video, setVideo] = useState<VideoData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchVideo();
      fetchComments();
      recordView();
    }
  }, [id]);

  const fetchVideo = async () => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Fetch user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('user_id', data.user_id)
        .single();

      setVideo({
        ...data,
        user: profile || undefined,
      });

      // Check if liked
      if (user) {
        const { data: likeData } = await supabase
          .from('video_likes')
          .select('id')
          .eq('video_id', id)
          .eq('user_id', user.id)
          .single();
        
        setIsLiked(!!likeData);
      }
    } catch (error) {
      console.error('Error fetching video:', error);
      toast.error('Vídeo não encontrado');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('video_comments')
        .select('*')
        .eq('video_id', id)
        .is('parent_id', null)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch profiles
      const userIds = [...new Set((data || []).map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, { name: p.name, avatar_url: p.avatar_url }]));

      setComments((data || []).map(comment => ({
        ...comment,
        user: profileMap.get(comment.user_id),
      })));
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const recordView = async () => {
    try {
      await supabase
        .from('video_views')
        .insert({
          video_id: id,
          user_id: user?.id,
        });
    } catch (error) {
      // Ignore
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast.error('Faça login para curtir');
      return;
    }

    try {
      if (isLiked) {
        await supabase
          .from('video_likes')
          .delete()
          .eq('video_id', id)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('video_likes')
          .insert({ video_id: id, user_id: user.id });
      }

      setIsLiked(!isLiked);
      setVideo(prev => prev ? {
        ...prev,
        likes_count: prev.likes_count + (isLiked ? -1 : 1)
      } : null);
    } catch (error) {
      console.error('Error liking:', error);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: video?.title,
          url,
        });
      } catch {}
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copiado!');
    }
  };

  const handleComment = async () => {
    if (!user) {
      toast.error('Faça login para comentar');
      return;
    }

    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('video_comments')
        .insert({
          video_id: id,
          user_id: user.id,
          content: newComment.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      // Fetch user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('user_id', user.id)
        .single();

      setComments(prev => [{
        ...data,
        user: profile || undefined,
      }, ...prev]);
      setNewComment('');
      toast.success('Comentário adicionado!');
    } catch (error) {
      console.error('Error commenting:', error);
      toast.error('Erro ao comentar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-8 text-center">
        <p className="text-xl mb-4">Vídeo não encontrado</p>
        <Link to="/vip">
          <Button>Voltar</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl p-4 lg:p-6">
        {/* Back Button */}
        <Link to="/vip" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>

        {/* Video Player */}
        <VideoPlayer
          src={video.storage_url}
          poster={video.thumbnail_url}
          title={video.title}
          className="mb-6"
        />

        {/* Video Info */}
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">{video.title}</h1>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={video.user?.avatar_url} />
                <AvatarFallback>
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{video.user?.name || 'Usuário'}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(video.created_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {video.views_count} views
              </span>
              <span>{formatDuration(video.duration)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant={isLiked ? 'default' : 'outline'}
              onClick={handleLike}
            >
              <Heart className={`h-4 w-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
              {video.likes_count}
            </Button>
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Compartilhar
            </Button>
          </div>

          {/* Description */}
          {video.description && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="whitespace-pre-wrap">{video.description}</p>
            </div>
          )}

          {/* Comments */}
          <div className="pt-6 border-t">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Comentários ({comments.length})
            </h2>

            {/* Comment Form */}
            <div className="flex gap-3 mb-6">
              <Avatar className="h-10 w-10">
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Textarea
                  placeholder={user ? 'Adicione um comentário...' : 'Faça login para comentar'}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  disabled={!user}
                  rows={2}
                />
                <Button
                  onClick={handleComment}
                  disabled={!user || !newComment.trim() || isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Comentar
                </Button>
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.user?.avatar_url} />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm">
                      <span className="font-medium">{comment.user?.name || 'Usuário'}</span>
                      <span className="text-muted-foreground ml-2">
                        {format(new Date(comment.created_at), "d MMM", { locale: ptBR })}
                      </span>
                    </p>
                    <p className="mt-1">{comment.content}</p>
                  </div>
                </div>
              ))}

              {comments.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum comentário ainda. Seja o primeiro!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
