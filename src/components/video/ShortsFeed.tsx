import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  MessageCircle,
  Share2,
  Volume2,
  VolumeX,
  Play,
  Pause,
  ChevronUp,
  ChevronDown,
  User,
  MoreVertical,
  Flag,
  Bookmark,
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
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';
import { cn } from '@/lib/utils';

interface Short {
  id: string;
  title: string;
  description: string;
  storage_url: string;
  thumbnail_url: string;
  duration: number;
  views_count: number;
  likes_count: number;
  comments_count: number;
  user_id: string;
  created_at: string;
  user?: {
    name: string;
    avatar_url: string;
  };
  isLiked?: boolean;
}

interface ShortsFeedProps {
  className?: string;
}

export function ShortsFeed({ className }: ShortsFeedProps) {
  const { user } = useAuth();
  const [shorts, setShorts] = useState<Short[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    fetchShorts();
  }, []);

  const fetchShorts = async () => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('type', 'short')
        .eq('status', 'ready')
        .eq('privacy', 'public')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch profiles for all users
      const userIds = [...new Set((data || []).map(v => v.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, { name: p.name, avatar_url: p.avatar_url }]));

      // Get likes if user is logged in
      let likedIds: string[] = [];
      if (user) {
        const { data: likes } = await supabase
          .from('video_likes')
          .select('video_id')
          .eq('user_id', user.id);
        likedIds = likes?.map(l => l.video_id) || [];
      }

      const shortsWithLikes = (data || []).map(short => ({
        ...short,
        user: profileMap.get(short.user_id),
        isLiked: likedIds.includes(short.id),
      }));

      setShorts(shortsWithLikes as Short[]);
    } catch (error) {
      console.error('Error fetching shorts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScroll = useCallback((direction: 'up' | 'down') => {
    const newIndex = direction === 'down' 
      ? Math.min(currentIndex + 1, shorts.length - 1)
      : Math.max(currentIndex - 1, 0);
    
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
      
      // Pause previous video
      videoRefs.current[currentIndex]?.pause();
      
      // Play new video
      const newVideo = videoRefs.current[newIndex];
      if (newVideo) {
        newVideo.currentTime = 0;
        newVideo.play();
      }
    }
  }, [currentIndex, shorts.length]);

  // Handle touch/wheel scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndY = e.changedTouches[0].clientY;
      const diff = touchStartY - touchEndY;

      if (Math.abs(diff) > 50) {
        handleScroll(diff > 0 ? 'down' : 'up');
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY > 0) {
        handleScroll('down');
      } else if (e.deltaY < 0) {
        handleScroll('up');
      }
    };

    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('wheel', handleWheel);
    };
  }, [handleScroll]);

  // Play current video when index changes
  useEffect(() => {
    const video = videoRefs.current[currentIndex];
    if (video && isPlaying) {
      video.play().catch(() => {});
    }
  }, [currentIndex, isPlaying]);

  const handleLike = async (short: Short) => {
    if (!user) {
      toast.error('Faça login para curtir');
      return;
    }

    try {
      if (short.isLiked) {
        await supabase
          .from('video_likes')
          .delete()
          .eq('video_id', short.id)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('video_likes')
          .insert({ video_id: short.id, user_id: user.id });
      }

      setShorts(prev => prev.map(s => 
        s.id === short.id 
          ? { ...s, isLiked: !s.isLiked, likes_count: s.likes_count + (s.isLiked ? -1 : 1) }
          : s
      ));
    } catch (error) {
      console.error('Error liking:', error);
    }
  };

  const handleShare = async (short: Short) => {
    const url = `${window.location.origin}/shorts/${short.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: short.title,
          url,
        });
      } catch {}
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copiado!');
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    videoRefs.current.forEach(video => {
      if (video) video.muted = !isMuted;
    });
  };

  const togglePlay = () => {
    const video = videoRefs.current[currentIndex];
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="animate-pulse text-white">Carregando shorts...</div>
      </div>
    );
  }

  if (shorts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white p-8 text-center">
        <p className="text-lg mb-4">Nenhum short disponível</p>
        <p className="text-muted-foreground">Seja o primeiro a publicar!</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn('relative h-screen bg-black overflow-hidden', className)}
    >
      {/* Navigation Arrows (Desktop) */}
      <div className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 flex-col gap-2">
        <Button
          size="icon"
          variant="ghost"
          className="bg-white/10 hover:bg-white/20 text-white"
          onClick={() => handleScroll('up')}
          disabled={currentIndex === 0}
        >
          <ChevronUp className="h-6 w-6" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="bg-white/10 hover:bg-white/20 text-white"
          onClick={() => handleScroll('down')}
          disabled={currentIndex === shorts.length - 1}
        >
          <ChevronDown className="h-6 w-6" />
        </Button>
      </div>

      {/* Shorts Container */}
      <motion.div
        className="h-full"
        animate={{ y: -currentIndex * 100 + '%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {shorts.map((short, index) => (
          <div
            key={short.id}
            className="relative h-screen w-full flex items-center justify-center"
          >
            {/* Video */}
            <video
              ref={el => videoRefs.current[index] = el}
              src={short.storage_url}
              poster={short.thumbnail_url}
              loop
              playsInline
              muted={isMuted}
              className="h-full w-full object-contain max-w-md mx-auto"
              onClick={togglePlay}
            />

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 pointer-events-none" />

            {/* Play/Pause Indicator */}
            <AnimatePresence>
              {!isPlaying && index === currentIndex && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <div className="w-20 h-20 rounded-full bg-black/50 flex items-center justify-center">
                    <Play className="h-10 w-10 text-white ml-1" fill="white" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Right Side Actions */}
            <div className="absolute right-4 bottom-24 flex flex-col items-center gap-6 z-10">
              {/* Like */}
              <button
                onClick={() => handleLike(short)}
                className="flex flex-col items-center"
              >
                <div className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
                  short.isLiked ? 'bg-red-500' : 'bg-white/10'
                )}>
                  <Heart 
                    className={cn('h-6 w-6', short.isLiked ? 'fill-white text-white' : 'text-white')} 
                  />
                </div>
                <span className="text-white text-xs mt-1">{formatCount(short.likes_count)}</span>
              </button>

              {/* Comments */}
              <button className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                  <MessageCircle className="h-6 w-6 text-white" />
                </div>
                <span className="text-white text-xs mt-1">{formatCount(short.comments_count)}</span>
              </button>

              {/* Share */}
              <button
                onClick={() => handleShare(short)}
                className="flex flex-col items-center"
              >
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                  <Share2 className="h-6 w-6 text-white" />
                </div>
                <span className="text-white text-xs mt-1">Compartilhar</span>
              </button>

              {/* Mute */}
              <button onClick={toggleMute} className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                  {isMuted ? (
                    <VolumeX className="h-6 w-6 text-white" />
                  ) : (
                    <Volume2 className="h-6 w-6 text-white" />
                  )}
                </div>
              </button>

              {/* More */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                      <MoreVertical className="h-6 w-6 text-white" />
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Bookmark className="h-4 w-4 mr-2" />
                    Salvar
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Flag className="h-4 w-4 mr-2" />
                    Denunciar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Bottom Info */}
            <div className="absolute bottom-8 left-4 right-20 z-10">
              {/* Author */}
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-10 w-10 border-2 border-white">
                  <AvatarImage src={short.user?.avatar_url} />
                  <AvatarFallback>
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <span className="text-white font-semibold">
                  {short.user?.name || 'Usuário'}
                </span>
              </div>

              {/* Title & Description */}
              <h3 className="text-white font-medium mb-1 line-clamp-2">
                {short.title}
              </h3>
              {short.description && (
                <p className="text-white/80 text-sm line-clamp-2">
                  {short.description}
                </p>
              )}
            </div>

            {/* Progress Indicator */}
            <div className="absolute top-4 left-4 right-4 flex gap-1">
              {shorts.slice(0, 10).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-1 flex-1 rounded-full',
                    i === currentIndex ? 'bg-white' : 'bg-white/30'
                  )}
                />
              ))}
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
