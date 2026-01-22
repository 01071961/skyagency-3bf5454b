import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  ThumbsUp,
  Share2,
  Maximize2,
  ExternalLink,
  Eye,
  Clock,
  ChevronDown,
  ChevronUp,
  Send,
  Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface YouTubeEmbedPlayerProps {
  videoUrl: string;
  title?: string;
  description?: string;
  postId?: string;
  authorName?: string;
  authorAvatar?: string;
  createdAt?: string;
  viewCount?: number;
  likeCount?: number;
  onLike?: () => void;
  isLiked?: boolean;
  showComments?: boolean;
}

interface Comment {
  id: string;
  content: string;
  author_id: string;
  created_at: string;
  author?: {
    name: string;
    avatar_url: string;
  };
}

export function YouTubeEmbedPlayer({
  videoUrl,
  title,
  description,
  postId,
  authorName,
  authorAvatar,
  createdAt,
  viewCount,
  likeCount = 0,
  onLike,
  isLiked = false,
  showComments = true,
}: YouTubeEmbedPlayerProps) {
  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);

  // Extract video ID
  const getVideoId = (url: string): string | null => {
    const watchMatch = url.match(/youtube\.com\/watch\?v=([^&]+)/);
    const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
    const embedMatch = url.match(/youtube\.com\/embed\/([^?&]+)/);
    const shortsMatch = url.match(/youtube\.com\/shorts\/([^?&]+)/);
    const liveMatch = url.match(/youtube\.com\/live\/([^?&]+)/);
    return watchMatch?.[1] || shortMatch?.[1] || embedMatch?.[1] || shortsMatch?.[1] || liveMatch?.[1] || null;
  };

  const videoId = getVideoId(videoUrl);
  const isShort = videoUrl.includes('/shorts/');

  // Load comments
  useEffect(() => {
    if (postId && showComments) {
      loadComments();
    }
  }, [postId, showComments]);

  const loadComments = async () => {
    if (!postId) return;
    
    setLoadingComments(true);
    try {
      const { data, error } = await supabase
        .from('affiliate_post_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      if (data && data.length > 0) {
        // Fetch author info
        const authorIds = [...new Set(data.map(c => c.author_id))];
        const { data: affiliates } = await supabase
          .from('vip_affiliates')
          .select('id, user_id')
          .in('id', authorIds);

        const userIds = affiliates?.map(a => a.user_id).filter(Boolean) || [];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, name, avatar_url')
          .in('user_id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
        const affiliateMap = new Map(affiliates?.map(a => [a.id, a.user_id]) || []);

        const commentsWithAuthors = data.map(comment => ({
          ...comment,
          author: {
            name: profileMap.get(affiliateMap.get(comment.author_id) || '')?.name || 'Membro VIP',
            avatar_url: profileMap.get(affiliateMap.get(comment.author_id) || '')?.avatar_url || '',
          }
        }));

        setComments(commentsWithAuthors);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !postId) return;

    setSubmittingComment(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Faça login para comentar');
        return;
      }

      const { data: affiliate } = await supabase
        .from('vip_affiliates')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!affiliate) {
        toast.error('Perfil de afiliado não encontrado');
        return;
      }

      const { error } = await supabase
        .from('affiliate_post_comments')
        .insert({
          post_id: postId,
          author_id: affiliate.id,
          content: newComment.trim(),
        });

      if (error) throw error;

      toast.success('Comentário adicionado!');
      setNewComment('');
      loadComments();
    } catch (error: any) {
      console.error('Error adding comment:', error);
      toast.error('Erro ao adicionar comentário');
    } finally {
      setSubmittingComment(false);
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(videoUrl);
    toast.success('Link copiado!');
  };

  if (!videoId) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-4 text-center text-muted-foreground">
          URL de vídeo inválida
        </CardContent>
      </Card>
    );
  }

  const displayedComments = showAllComments ? comments : comments.slice(0, 3);

  return (
    <Card className="overflow-hidden bg-card/80 backdrop-blur border-border/50">
      {/* Video Player */}
      <div className={`relative bg-black ${isShort ? 'aspect-[9/16] max-h-[500px] mx-auto' : 'aspect-video'}`}>
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
          title={title || 'YouTube Video'}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>

      <CardContent className="p-4 space-y-4">
        {/* Video Info */}
        <div className="space-y-2">
          {title && (
            <h3 className="font-semibold text-lg text-foreground line-clamp-2">
              {title}
            </h3>
          )}
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            {viewCount !== undefined && (
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {viewCount.toLocaleString()} visualizações
              </span>
            )}
            {createdAt && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: ptBR })}
              </span>
            )}
            {isShort && (
              <Badge variant="outline" className="border-purple-500/30 text-purple-400">
                📱 Short
              </Badge>
            )}
          </div>
        </div>

        {/* Author Info */}
        {authorName && (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={authorAvatar} />
              <AvatarFallback>{authorName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-foreground">{authorName}</p>
              <p className="text-xs text-muted-foreground">Membro VIP</p>
            </div>
          </div>
        )}

        {/* Description */}
        {description && (
          <div className="relative">
            <p className={`text-sm text-muted-foreground ${!expanded ? 'line-clamp-2' : ''}`}>
              {description}
            </p>
            {description.length > 100 && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 h-auto p-0 text-primary hover:text-primary/80"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? (
                  <span className="flex items-center gap-1">
                    <ChevronUp className="h-4 w-4" />
                    Mostrar menos
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <ChevronDown className="h-4 w-4" />
                    Mostrar mais
                  </span>
                )}
              </Button>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={isLiked ? 'default' : 'outline'}
            size="sm"
            onClick={onLike}
            className="gap-2"
          >
            <ThumbsUp className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
            {likeCount > 0 ? likeCount : 'Curtir'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAllComments(!showAllComments)}
            className="gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            {comments.length > 0 ? comments.length : 'Comentar'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={copyShareLink}
            className="gap-2"
          >
            <Share2 className="h-4 w-4" />
            Compartilhar
          </Button>

          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="ghost" size="icon" aria-label="Abrir no YouTube">
              <ExternalLink className="h-4 w-4" />
              <span className="sr-only">Abrir</span>
            </Button>
          </a>
        </div>

        {/* Comments Section */}
        {showComments && postId && (
          <AnimatePresence>
            {(showAllComments || comments.length > 0) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                <Separator />
                
                {/* Add Comment */}
                <div className="flex gap-3">
                  <Input
                    placeholder="Adicione um comentário..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                    className="flex-1"
                  />
                  <Button
                    size="icon"
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || submittingComment}
                  >
                    {submittingComment ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Comments List */}
                {loadingComments ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : displayedComments.length > 0 ? (
                  <ScrollArea className="max-h-[300px]">
                    <div className="space-y-4">
                      {displayedComments.map((comment) => (
                        <motion.div
                          key={comment.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex gap-3"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={comment.author?.avatar_url} />
                            <AvatarFallback>
                              {comment.author?.name?.charAt(0) || 'V'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {comment.author?.name || 'Membro VIP'}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ptBR })}
                              </span>
                            </div>
                            <p className="text-sm text-foreground mt-1">
                              {comment.content}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum comentário ainda. Seja o primeiro!
                  </p>
                )}

                {comments.length > 3 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => setShowAllComments(!showAllComments)}
                  >
                    {showAllComments ? (
                      <span className="flex items-center gap-1">
                        <ChevronUp className="h-4 w-4" />
                        Mostrar menos
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <ChevronDown className="h-4 w-4" />
                        Ver mais {comments.length - 3} comentários
                      </span>
                    )}
                  </Button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </CardContent>
    </Card>
  );
}
