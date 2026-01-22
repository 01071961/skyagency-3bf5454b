import { useState, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Share2,
  Bookmark,
  MoreVertical,
  Play,
  Eye,
  Heart,
  Smile,
  Flame,
  Frown,
  Angry,
  Sparkles,
  Flag,
  Link as LinkIcon,
  Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
import { cn } from '@/lib/utils';
import { VIPPost, useVIPReactions, useVIPBookmarks, useVIPFollow } from '@/hooks/useVIPSocial';
import { toast } from 'sonner';

// Reaction configurations
const reactions = {
  simple: [
    { type: 'like', icon: ThumbsUp, label: 'Curtir', color: 'text-blue-500' },
    { type: 'dislike', icon: ThumbsDown, label: 'Não curti', color: 'text-gray-500' },
  ],
  emoji: [
    { type: 'like', icon: ThumbsUp, label: 'Curtir', color: 'text-blue-500', emoji: '👍' },
    { type: 'heart', icon: Heart, label: 'Amei', color: 'text-red-500', emoji: '❤️' },
    { type: 'wow', icon: Sparkles, label: 'Uau', color: 'text-yellow-500', emoji: '😮' },
    { type: 'haha', icon: Smile, label: 'Haha', color: 'text-yellow-500', emoji: '😂' },
    { type: 'sad', icon: Frown, label: 'Triste', color: 'text-yellow-500', emoji: '😢' },
    { type: 'angry', icon: Angry, label: 'Grr', color: 'text-orange-500', emoji: '😠' },
  ],
  super: [
    { type: 'super_like', icon: Sparkles, label: 'Super Like', color: 'text-cyan-500', emoji: '⚡' },
    { type: 'super_heart', icon: Heart, label: 'Super Love', color: 'text-pink-500', emoji: '💖' },
    { type: 'fire', icon: Flame, label: 'Em Chamas', color: 'text-orange-500', emoji: '🔥' },
  ],
};

interface VIPPostCardProps {
  post: VIPPost;
  variant?: 'feed' | 'compact' | 'full';
  showReactionPicker?: boolean;
  isVIP?: boolean;
}

export const VIPPostCard = memo(function VIPPostCard({ 
  post, 
  variant = 'feed',
  showReactionPicker = true,
  isVIP = false,
}: VIPPostCardProps) {
  const navigate = useNavigate();
  const { addReaction } = useVIPReactions();
  const { toggleBookmark } = useVIPBookmarks();
  const { toggleFollow, isFollowing } = useVIPFollow();
  
  const [currentReaction, setCurrentReaction] = useState<string | null>(post.user_reaction || null);
  const [isBookmarked, setIsBookmarked] = useState(post.is_bookmarked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [showReactions, setShowReactions] = useState(false);

  const handleReaction = async (reactionType: string) => {
    const previousReaction = currentReaction;
    const wasLike = previousReaction === 'like' || previousReaction?.startsWith('super');
    const isLike = reactionType === 'like' || reactionType.startsWith('super');

    // Optimistic update
    setCurrentReaction(reactionType === currentReaction ? null : reactionType);
    if (wasLike && reactionType === previousReaction) {
      setLikesCount(prev => prev - 1);
    } else if (isLike && !wasLike) {
      setLikesCount(prev => prev + 1);
    }

    const newReaction = await addReaction(post.id, reactionType, previousReaction);
    setCurrentReaction(newReaction);
    setShowReactions(false);
  };

  const handleBookmark = async () => {
    const newState = await toggleBookmark(post.id, isBookmarked);
    setIsBookmarked(newState);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/vip/network/post/${post.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title || 'Post VIP Network',
          text: post.content || '',
          url,
        });
      } catch (error) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copiado!');
    }
  };

  const getReactionIcon = () => {
    if (!currentReaction) return ThumbsUp;
    const allReactions = [...reactions.simple, ...reactions.emoji, ...reactions.super];
    return allReactions.find(r => r.type === currentReaction)?.icon || ThumbsUp;
  };

  const getReactionColor = () => {
    if (!currentReaction) return 'text-muted-foreground';
    const allReactions = [...reactions.simple, ...reactions.emoji, ...reactions.super];
    return allReactions.find(r => r.type === currentReaction)?.color || 'text-muted-foreground';
  };

  const ReactionIcon = getReactionIcon();

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'bg-card rounded-xl overflow-hidden border border-border hover:border-primary/30 transition-all',
        variant === 'compact' && 'flex gap-3 p-3'
      )}
    >
      {/* Thumbnail / Media */}
      <Link to={`/vip/network/post/${post.id}`} className={cn(
        'relative group block',
        variant === 'compact' ? 'w-40 h-24 shrink-0' : 'aspect-video'
      )}>
        {post.thumbnail_url || post.media_url ? (
          <img
            src={post.thumbnail_url || post.media_url || ''}
            alt={post.title || 'Post'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <Play className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
          <Play className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Duration or Live badge */}
        {post.is_live ? (
          <Badge className="absolute bottom-2 right-2 bg-red-500 text-white border-0 animate-pulse">
            AO VIVO
          </Badge>
        ) : post.media_type === 'short' ? (
          <Badge className="absolute bottom-2 right-2 bg-pink-500 text-white border-0">
            SHORT
          </Badge>
        ) : null}

        {/* Views */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1 text-xs text-white bg-black/60 px-1.5 py-0.5 rounded">
          <Eye className="h-3 w-3" />
          {formatViews(post.views_count)}
        </div>
      </Link>

      {/* Content */}
      <div className={cn(
        'flex flex-col',
        variant === 'compact' ? 'flex-1 min-w-0' : 'p-4'
      )}>
        {/* Author & Title */}
        <div className="flex items-start gap-3">
          {variant !== 'compact' && (
            <Link to={`/vip/network/profile/${post.author_id}`}>
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage src={post.author?.avatar_url || ''} />
                <AvatarFallback>
                  {post.author?.full_name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
            </Link>
          )}
          
          <div className="flex-1 min-w-0">
            <Link to={`/vip/network/post/${post.id}`}>
              <h3 className={cn(
                'font-semibold line-clamp-2 hover:text-primary transition-colors',
                variant === 'compact' ? 'text-sm' : 'text-base'
              )}>
                {post.title || post.content?.substring(0, 100)}
              </h3>
            </Link>
            
            <div className="flex items-center gap-2 mt-1">
              <Link 
                to={`/vip/network/profile/${post.author_id}`}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {post.author?.full_name || 'Usuário'}
              </Link>
              {post.author?.is_vip && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-gradient-to-r from-pink-500 to-cyan-500 text-white border-0">
                  VIP
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <span>{formatViews(post.views_count)} visualizações</span>
              <span>•</span>
              <span>
                {formatDistanceToNow(new Date(post.created_at), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </span>
            </div>
          </div>

          {/* Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleBookmark}>
                <Bookmark className={cn('mr-2 h-4 w-4', isBookmarked && 'fill-current')} />
                {isBookmarked ? 'Remover dos salvos' : 'Salvar'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleShare}>
                <Copy className="mr-2 h-4 w-4" />
                Copiar link
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                <Flag className="mr-2 h-4 w-4" />
                Denunciar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Hashtags */}
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {post.hashtags.slice(0, 3).map((tag) => (
              <Link
                key={tag}
                to={`/vip/network/search?q=${encodeURIComponent('#' + tag)}`}
                className="text-xs text-primary hover:underline"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}

        {/* Actions */}
        {variant !== 'compact' && (
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
            {/* Reactions */}
            <div className="flex items-center gap-1">
              <Popover open={showReactions} onOpenChange={setShowReactions}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn('gap-2', getReactionColor())}
                    onMouseEnter={() => showReactionPicker && setShowReactions(true)}
                  >
                    <ReactionIcon className="h-4 w-4" />
                    <span>{likesCount}</span>
                  </Button>
                </PopoverTrigger>
                {showReactionPicker && (
                  <PopoverContent 
                    className="w-auto p-2" 
                    onMouseLeave={() => setShowReactions(false)}
                  >
                    <div className="flex flex-col gap-2">
                      {/* Simple reactions */}
                      <div className="flex gap-1">
                        {reactions.simple.map((r) => (
                          <motion.button
                            key={r.type}
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleReaction(r.type)}
                            className={cn(
                              'p-2 rounded-full hover:bg-muted transition-colors',
                              currentReaction === r.type && 'bg-muted'
                            )}
                            title={r.label}
                          >
                            <r.icon className={cn('h-5 w-5', r.color)} />
                          </motion.button>
                        ))}
                      </div>
                      
                      {/* Emoji reactions */}
                      <div className="flex gap-1">
                        {reactions.emoji.slice(1).map((r) => (
                          <motion.button
                            key={r.type}
                            whileHover={{ scale: 1.3 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleReaction(r.type)}
                            className={cn(
                              'text-xl p-1 rounded hover:bg-muted',
                              currentReaction === r.type && 'bg-muted'
                            )}
                            title={r.label}
                          >
                            {r.emoji}
                          </motion.button>
                        ))}
                      </div>

                      {/* VIP Super reactions */}
                      {isVIP && (
                        <>
                          <div className="text-[10px] text-muted-foreground text-center">
                            VIP Exclusivo
                          </div>
                          <div className="flex gap-1 justify-center">
                            {reactions.super.map((r) => (
                              <motion.button
                                key={r.type}
                                whileHover={{ scale: 1.4 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleReaction(r.type)}
                                className={cn(
                                  'text-xl p-1 rounded hover:bg-gradient-to-r hover:from-pink-500/20 hover:to-cyan-500/20',
                                  currentReaction === r.type && 'bg-gradient-to-r from-pink-500/20 to-cyan-500/20'
                                )}
                                title={r.label}
                              >
                                {r.emoji}
                              </motion.button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </PopoverContent>
                )}
              </Popover>

              <Button variant="ghost" size="sm" className="gap-2">
                <ThumbsDown className="h-4 w-4" />
              </Button>
            </div>

            {/* Comment & Share */}
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-2"
                onClick={() => navigate(`/vip/network/post/${post.id}#comments`)}
              >
                <MessageCircle className="h-4 w-4" />
                <span>{post.comments_count}</span>
              </Button>

              <Button variant="ghost" size="sm" className="gap-2" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>

              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleBookmark}
              >
                <Bookmark className={cn('h-4 w-4', isBookmarked && 'fill-current text-primary')} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
});
