import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Send,
  ThumbsUp,
  Flame,
  Star,
  PartyPopper,
  Bookmark,
  Link as LinkIcon,
  Trash2,
  UserPlus,
  Check,
  Pencil,
  X,
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { LinkPreviewCard } from '@/components/vip/LinkPreviewCard';
import { extractFirstUrl, getGoogleDrivePreviewUrl, getYouTubeEmbedUrl, isYouTubeUrl } from '@/lib/url';

// Emoji reactions config
const REACTIONS = [
  { emoji: '👍', name: 'like', icon: ThumbsUp },
  { emoji: '❤️', name: 'love', icon: Heart },
  { emoji: '🔥', name: 'fire', icon: Flame },
  { emoji: '⭐', name: 'star', icon: Star },
  { emoji: '🎉', name: 'celebrate', icon: PartyPopper },
];

const tierColors: Record<string, string> = {
  bronze: 'bg-amber-500',
  silver: 'bg-slate-400',
  gold: 'bg-yellow-500',
  diamond: 'bg-cyan-500',
  platinum: 'bg-violet-500',
};

interface Author {
  id: string;
  tier: string;
  profile: {
    name: string;
    avatar_url: string;
  };
}

interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  image_url?: string;
  likes_count: number;
  comments_count: number;
  is_pinned: boolean;
  created_at: string;
  author_id: string;
  author?: Author;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  author?: Author;
}

interface SocialPostCardProps {
  post: Post;
  currentAffiliateId: string | null;
  onLike: (postId: string) => void;
  onComment: (postId: string, content: string) => void;
  onDelete: (postId: string) => void;
  onEdit?: (postId: string, title: string, content: string) => void;
  onFollow?: (affiliateId: string) => void;
  isFollowing?: boolean;
  isLiked: boolean;
}

export function SocialPostCard({
  post,
  currentAffiliateId,
  onLike,
  onComment,
  onDelete,
  onEdit,
  onFollow,
  isFollowing = false,
  isLiked,
}: SocialPostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showReactions, setShowReactions] = useState(false);
  const [selectedReaction, setSelectedReaction] = useState<string | null>(isLiked ? 'like' : null);
  const [localLikesCount, setLocalLikesCount] = useState(post.likes_count || 0);
  const [loadingComments, setLoadingComments] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title || '');
  const [editContent, setEditContent] = useState(post.content || '');

  const tier = post.author?.tier || 'bronze';
  const isAuthor = currentAffiliateId === post.author_id;

  const firstUrl = useMemo(() => extractFirstUrl(post.content), [post.content]);
  const youtubeEmbedUrl = useMemo(() => (firstUrl && isYouTubeUrl(firstUrl) ? getYouTubeEmbedUrl(firstUrl) : null), [firstUrl]);
  const drivePreviewUrl = useMemo(() => (firstUrl ? getGoogleDrivePreviewUrl(firstUrl) : null), [firstUrl]);

  const loadComments = useCallback(async () => {
    if (loadingComments) return;
    setLoadingComments(true);
    
    try {
      const { data } = await supabase
        .from('affiliate_post_comments')
        .select('*')
        .eq('post_id', post.id)
        .order('created_at', { ascending: true })
        .limit(10);

      if (!data || data.length === 0) {
        setComments([]);
        setLoadingComments(false);
        return;
      }

      // Batch fetch authors
      const authorIds = [...new Set(data.map(c => c.author_id).filter(Boolean))];
      const { data: affiliatesData } = await supabase
        .from('vip_affiliates')
        .select('id, tier, user_id')
        .in('id', authorIds);

      const affiliatesMap = new Map(affiliatesData?.map(a => [a.id, a]) || []);
      
      const userIds = [...new Set(affiliatesData?.map(a => a.user_id).filter(Boolean) || [])];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, name, avatar_url')
        .in('user_id', userIds);
      
      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);

      const commentsWithAuthors: Comment[] = data.map(comment => {
        const affiliate = affiliatesMap.get(comment.author_id);
        const profile = affiliate ? profilesMap.get(affiliate.user_id) : null;
        
        return {
          ...comment,
          author: affiliate ? {
            id: affiliate.id,
            tier: affiliate.tier,
            profile: profile || { name: 'Afiliado', avatar_url: '' }
          } : undefined
        };
      });
      
      setComments(commentsWithAuthors);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoadingComments(false);
    }
  }, [post.id, loadingComments]);

  useEffect(() => {
    if (showComments && comments.length === 0 && !loadingComments) {
      loadComments();
    }
  }, [showComments, comments.length, loadingComments, loadComments]);


  const handleReaction = (reaction: string) => {
    if (selectedReaction === reaction) {
      setSelectedReaction(null);
      setLocalLikesCount(prev => Math.max(0, prev - 1));
    } else {
      if (!selectedReaction) {
        setLocalLikesCount(prev => prev + 1);
      }
      setSelectedReaction(reaction);
    }
    onLike(post.id);
    setShowReactions(false);
  };

  const handleSubmitComment = () => {
    if (newComment.trim()) {
      onComment(post.id, newComment);
      setNewComment('');
      loadComments();
    }
  };

  const handleShare = () => {
    const postUrl = `${window.location.origin}/vip/network/blog?post=${post.id}`;
    navigator.clipboard.writeText(postUrl);
    toast.success('Link copiado! Compartilhe com seus amigos');
  };

  const reactionIcon = selectedReaction 
    ? REACTIONS.find(r => r.name === selectedReaction)?.emoji 
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`overflow-hidden bg-card/80 backdrop-blur border-border/50 hover:border-primary/30 transition-all ${post.is_pinned ? 'ring-1 ring-primary/30' : ''}`}>
        {post.is_pinned && (
          <div className="bg-primary/10 px-4 py-1.5 text-xs text-primary font-medium flex items-center gap-2">
            📌 Post Fixado
          </div>
        )}
        
        <CardContent className="p-4">
          {/* Author Header */}
          <div className="flex items-start justify-between mb-4">
            <Link 
              to={`/vip/network/profile/${post.author?.id}`}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <Avatar className="h-12 w-12 ring-2 ring-offset-2 ring-offset-background ring-primary/20">
                <AvatarImage src={post.author?.profile.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                  {post.author?.profile.name?.charAt(0) || 'A'}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground hover:text-primary transition-colors">
                    {post.author?.profile.name || 'Afiliado'}
                  </span>
                  <Badge className={`${tierColors[tier]} text-white text-[10px] px-1.5`}>
                    {tier.charAt(0).toUpperCase() + tier.slice(1)}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              {!isAuthor && post.author_id && onFollow && (
                <Button
                  variant={isFollowing ? "secondary" : "outline"}
                  size="sm"
                  className="h-8"
                  onClick={() => onFollow(post.author_id)}
                >
                  {isFollowing ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Seguindo
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Seguir
                    </>
                  )}
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/vip/network/blog?post=${post.id}`);
                      toast.success('Link copiado!');
                    }}
                  >
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Copiar Link
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Bookmark className="h-4 w-4 mr-2" />
                    Salvar
                  </DropdownMenuItem>
                  {isAuthor && (
                    <>
                      <DropdownMenuItem onClick={() => setIsEditing(true)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => onDelete(post.id)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-3">
            {isEditing ? (
              <div className="space-y-3">
                <Input
                  placeholder="Título (opcional)"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="bg-muted/30"
                />
                <Textarea
                  placeholder="O que você está pensando?"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="bg-muted/30 min-h-[100px]"
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsEditing(false);
                      setEditTitle(post.title || '');
                      setEditContent(post.content || '');
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      if (onEdit && editContent.trim()) {
                        onEdit(post.id, editTitle, editContent);
                        setIsEditing(false);
                      }
                    }}
                    disabled={!editContent.trim()}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Salvar
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {post.title && (
                  <h3 className="font-semibold text-lg">{post.title}</h3>
                )}
                <p className="text-foreground/90 whitespace-pre-wrap">{post.content}</p>
              </>
            )}
            
            {!isEditing && post.image_url && (
              <motion.img
                src={post.image_url}
                alt={post.title}
                className="w-full rounded-xl max-h-[500px] object-cover cursor-pointer"
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
                loading="lazy"
              />
            )}

            {youtubeEmbedUrl && (
              <div className="overflow-hidden rounded-xl border border-border/50 bg-muted/20">
                <div className="aspect-video">
                  <iframe
                    src={youtubeEmbedUrl}
                    title={`Vídeo incorporado: ${post.title || 'YouTube'}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full"
                  />
                </div>
              </div>
            )}

            {drivePreviewUrl && (
              <div className="overflow-hidden rounded-xl border border-border/50 bg-muted/20">
                <div className="aspect-video">
                  <iframe
                    src={drivePreviewUrl}
                    title={`Arquivo do Drive: ${post.title || 'Google Drive'}`}
                    className="h-full w-full"
                    allow="autoplay"
                  />
                </div>
              </div>
            )}

            {!isEditing && firstUrl && !youtubeEmbedUrl && !drivePreviewUrl && <LinkPreviewCard url={firstUrl} />}
          </div>

          {/* Stats Bar */}
          <div className="flex items-center justify-between py-3 mt-4 border-t border-border/50 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              {localLikesCount > 0 && (
                <>
                  <span className="text-lg">👍❤️🔥</span>
                  <span>{localLikesCount}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button 
                className="hover:underline"
                onClick={() => setShowComments(!showComments)}
              >
                {post.comments_count || 0} comentários
              </button>
            </div>
          </div>

          {/* Actions Bar */}
          <div className="flex items-center justify-between pt-3 border-t border-border/50">
            {/* Like with reactions */}
            <Popover open={showReactions} onOpenChange={setShowReactions}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`flex-1 gap-2 ${selectedReaction ? 'text-primary' : ''}`}
                  onMouseEnter={() => setShowReactions(true)}
                  onClick={() => handleReaction('like')}
                >
                  {reactionIcon ? (
                    <span className="text-lg">{reactionIcon}</span>
                  ) : (
                    <ThumbsUp className="h-4 w-4" />
                  )}
                  {selectedReaction ? 'Curtido' : 'Curtir'}
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-auto p-2" 
                side="top"
                onMouseLeave={() => setShowReactions(false)}
              >
                <div className="flex gap-1">
                  {REACTIONS.map((reaction) => (
                    <motion.button
                      key={reaction.name}
                      className={`text-2xl p-1.5 rounded-full hover:bg-muted/50 transition-colors ${
                        selectedReaction === reaction.name ? 'bg-primary/20' : ''
                      }`}
                      onClick={() => handleReaction(reaction.name)}
                      whileHover={{ scale: 1.3 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {reaction.emoji}
                    </motion.button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Button
              variant="ghost"
              size="sm"
              className="flex-1 gap-2"
              onClick={() => setShowComments(!showComments)}
            >
              <MessageCircle className="h-4 w-4" />
              Comentar
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="flex-1 gap-2"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
              Compartilhar
            </Button>
          </div>

          {/* Comments Section */}
          <AnimatePresence>
            {showComments && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-4 space-y-4 border-t border-border/50 mt-4">
                  {/* Comment Input */}
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/20 text-primary text-xs">
                        EU
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 flex gap-2">
                      <Input
                        placeholder="Escreva um comentário..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
                        className="bg-muted/30"
                      />
                      <Button 
                        size="icon" 
                        onClick={handleSubmitComment}
                        disabled={!newComment.trim()}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Comments List */}
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {comments.map((comment) => (
                      <motion.div
                        key={comment.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex gap-3"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={comment.author?.profile.avatar_url} />
                          <AvatarFallback className="bg-muted text-xs">
                            {comment.author?.profile.name?.charAt(0) || 'A'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 bg-muted/30 rounded-xl px-3 py-2">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">
                              {comment.author?.profile.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ptBR })}
                            </span>
                          </div>
                          <p className="text-sm text-foreground/90">{comment.content}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
