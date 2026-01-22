import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Expand,
  Users,
  Radio,
  Trash2,
  Square,
  Pencil,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { LiveStreamModal } from './LiveStreamModal';
import { extractFirstUrl, getYouTubeEmbedUrl, isYouTubeUrl } from '@/lib/url';

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

interface LivePostCardProps {
  post: Post;
  currentAffiliateId: string | null;
  onLike: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onEndLive?: (postId: string) => void;
  isLiked: boolean;
}

export function LivePostCard({
  post,
  currentAffiliateId,
  onLike,
  onDelete,
  onEndLive,
  isLiked,
}: LivePostCardProps) {
  const [showLiveModal, setShowLiveModal] = useState(false);
  const [viewerCount] = useState(Math.floor(Math.random() * 500) + 50);
  
  const tier = post.author?.tier || 'bronze';
  const isAuthor = currentAffiliateId === post.author_id;
  const firstUrl = useMemo(() => extractFirstUrl(post.content), [post.content]);
  const youtubeEmbedUrl = useMemo(() => (firstUrl && isYouTubeUrl(firstUrl) ? getYouTubeEmbedUrl(firstUrl) : null), [firstUrl]);

  const handleShare = () => {
    navigator.clipboard.writeText(firstUrl || `${window.location.origin}/vip/network/blog?post=${post.id}`);
    toast.success('Link da live copiado!');
  };

  const isLivePost = post.category === 'live' || post.content.includes('🔴');

  if (!isLivePost) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="overflow-hidden bg-card/80 backdrop-blur border-red-500/30 hover:border-red-500/50 transition-all ring-1 ring-red-500/20">
          {/* Live Badge */}
          <div className="bg-gradient-to-r from-red-500/20 to-orange-500/10 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-red-500 animate-pulse" />
              <Badge variant="destructive" className="animate-pulse">
                🔴 AO VIVO
              </Badge>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{viewerCount} assistindo</span>
            </div>
          </div>
          
          <CardContent className="p-4">
            {/* Author Header */}
            <div className="flex items-start justify-between mb-4">
              <Link 
                to={`/vip/network/profile/${post.author?.id}`}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <Avatar className="h-12 w-12 ring-2 ring-offset-2 ring-offset-background ring-red-500">
                  <AvatarImage src={post.author?.profile.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-br from-red-500 to-orange-500 text-white">
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
                    Iniciou {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
              </Link>

              {isAuthor && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onEndLive && (
                      <DropdownMenuItem onClick={() => onEndLive(post.id)}>
                        <Square className="h-4 w-4 mr-2" />
                        Encerrar Live
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem className="text-destructive" onClick={() => onDelete(post.id)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Video Preview */}
            <div 
              className="relative rounded-xl overflow-hidden bg-black cursor-pointer group"
              onClick={() => setShowLiveModal(true)}
            >
              {youtubeEmbedUrl ? (
                <>
                  <div className="aspect-video">
                    <iframe
                      src={youtubeEmbedUrl}
                      title={post.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      className="w-full h-full pointer-events-none"
                    />
                  </div>
                  {/* Overlay to capture clicks */}
                  <div className="absolute inset-0 bg-transparent group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      whileHover={{ scale: 1 }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Button size="lg" className="gap-2 bg-red-500 hover:bg-red-600">
                        <Expand className="h-5 w-5" />
                        Expandir Live
                      </Button>
                    </motion.div>
                  </div>
                </>
              ) : (
                <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-red-500/20 to-orange-500/20">
                  <div className="text-center">
                    <Radio className="h-16 w-16 text-red-500 mx-auto mb-4 animate-pulse" />
                    <p className="text-lg font-medium">Transmissão ao vivo</p>
                    <p className="text-sm text-muted-foreground">Clique para expandir</p>
                  </div>
                </div>
              )}
            </div>

            {/* Title */}
            {post.title && (
              <h3 className="font-semibold text-lg mt-4">{post.title}</h3>
            )}

            {/* Actions Bar */}
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/50">
              <Button
                variant="ghost"
                size="sm"
                className={`flex-1 gap-2 ${isLiked ? 'text-red-500' : ''}`}
                onClick={() => onLike(post.id)}
              >
                <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                {post.likes_count || 0}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="flex-1 gap-2"
                onClick={() => setShowLiveModal(true)}
              >
                <MessageCircle className="h-4 w-4" />
                Chat ao vivo
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
          </CardContent>
        </Card>
      </motion.div>

      {/* Live Stream Modal */}
      <LiveStreamModal
        isOpen={showLiveModal}
        onClose={() => setShowLiveModal(false)}
        videoUrl={firstUrl || ''}
        title={post.title}
        authorName={post.author?.profile.name}
        authorAvatar={post.author?.profile.avatar_url}
      />
    </>
  );
}
