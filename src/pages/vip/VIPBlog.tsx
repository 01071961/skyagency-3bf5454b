import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  Heart,
  Filter,
  TrendingUp,
  Clock,
  Users,
  ArrowLeft,
  Rss,
  Sparkles,
  RefreshCw,
  Radio,
  Video,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useVIPSocialNetwork } from '@/hooks/useVIPSocialNetwork';
import { SocialPostCard } from '@/components/vip/SocialFeed';
import { MediaUploadPostCard } from '@/components/vip/MediaUploadPostCard';
import { LivePostCard } from '@/components/vip/LivePostCard';
import { FloatingVideoButton, VideoPlayer } from '@/components/video';

const categories = [
  { value: 'geral', label: 'Geral' },
  { value: 'estrategias', label: 'Estratégias de Vendas' },
  { value: 'marketing', label: 'Marketing Digital' },
  { value: 'cases', label: 'Cases de Sucesso' },
  { value: 'duvidas', label: 'Dúvidas' },
  { value: 'networking', label: 'Networking' },
];

interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  image_url?: string;
  likes_count: number;
  comments_count: number;
  views_count: number;
  is_pinned: boolean;
  created_at: string;
  author_id: string;
  author?: {
    id: string;
    tier: string;
    profile: {
      name: string;
      avatar_url: string;
    };
  };
}

export default function VIPBlog() {
  const navigate = useNavigate();
  const {
    myProfile,
    likePost,
    createPost,
    editPost,
    deletePost,
    addComment,
    followUser,
    isFollowing,
    hasLiked,
    loading: profileLoading,
  } = useVIPSocialNetwork();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent');
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPosts();
  }, [categoryFilter, sortBy]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('blog-posts-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'affiliate_posts' },
        () => loadPosts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadPosts = async () => {
    try {
      if (!refreshing) setLoading(true);
      
      let query = supabase
        .from('affiliate_posts')
        .select('*');
      
      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }
      
      if (sortBy === 'popular') {
        query = query.order('likes_count', { ascending: false });
      } else {
        query = query.order('is_pinned', { ascending: false }).order('created_at', { ascending: false });
      }

      const { data, error } = await query.limit(50);
      
      if (error) throw error;

      if (!data || data.length === 0) {
        setPosts([]);
        return;
      }

      // Fetch all unique author IDs
      const authorIds = [...new Set(data.map(p => p.author_id).filter(Boolean))];
      
      // Batch fetch affiliates
      const { data: affiliatesData } = await supabase
        .from('vip_affiliates')
        .select('id, tier, user_id')
        .in('id', authorIds);

      const affiliatesMap = new Map(affiliatesData?.map(a => [a.id, a]) || []);
      
      // Batch fetch profiles
      const userIds = [...new Set(affiliatesData?.map(a => a.user_id).filter(Boolean) || [])];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, name, avatar_url')
        .in('user_id', userIds);
      
      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);

      // Build posts with authors
      const postsWithAuthors: Post[] = data.map(post => {
        const affiliate = affiliatesMap.get(post.author_id);
        const profile = affiliate ? profilesMap.get(affiliate.user_id) : null;
        
        return {
          ...post,
          author: affiliate ? {
            id: affiliate.id,
            tier: affiliate.tier,
            profile: profile || { name: 'Afiliado', avatar_url: '' }
          } : undefined
        };
      });

      setPosts(postsWithAuthors);
    } catch (error) {
      console.error('Error loading posts:', error);
      toast.error('Erro ao carregar publicações');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadPosts();
  };


  const handleLike = async (postId: string) => {
    const success = await likePost(postId);
    if (success) {
      const isLiked = hasLiked(postId);
      setPosts(prev => prev.map(p => 
        p.id === postId 
          ? { ...p, likes_count: isLiked ? Math.max(0, p.likes_count - 1) : p.likes_count + 1 } 
          : p
      ));
    }
  };

  const handleComment = async (postId: string, content: string) => {
    const comment = await addComment(postId, content);
    if (comment) {
      setPosts(prev => prev.map(p => 
        p.id === postId ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p
      ));
    }
  };

  const handleDeletePost = async (postId: string) => {
    const success = await deletePost(postId);
    if (success) {
      setPosts(prev => prev.filter(p => p.id !== postId));
    }
  };

  const handleEditPost = async (postId: string, title: string, content: string) => {
    const post = await editPost(postId, title, content);
    if (post) {
      setPosts(prev => prev.map(p => 
        p.id === postId ? { ...p, title: post.title, content: post.content } : p
      ));
    }
  };

  const handleCreatePost = async (data: { title: string; content: string; category: string }) => {
    setSubmitting(true);
    try {
      const post = await createPost(data);
      if (post) {
        loadPosts();
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate stats
  const stats = useMemo(() => ({
    totalPosts: posts.length,
    totalLikes: posts.reduce((acc, p) => acc + (p.likes_count || 0), 0),
    uniqueAuthors: new Set(posts.map(p => p.author_id)).size
  }), [posts]);

  if (loading && !refreshing) {
    return (
      <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
        <Skeleton className="h-32 rounded-2xl" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      {/* Premium Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-primary/5 border border-border/50 p-6"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/vip/network')}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <motion.div 
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center shadow-lg"
              whileHover={{ scale: 1.05, rotate: 5 }}
            >
              <Rss className="h-7 w-7 text-white" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                Feed da Comunidade
                <Sparkles className="h-5 w-5 text-yellow-400" />
              </h1>
              <p className="text-muted-foreground">
                Compartilhe ideias com outros afiliados VIP
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="hidden sm:inline-flex gap-1 border-red-500/30 text-red-400">
              <Radio className="h-3 w-3" />
              Lives ativas
            </Badge>
            <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-green-400">Ao vivo</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 bg-card/50 backdrop-blur border-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <MessageCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold">{stats.totalPosts}</p>
              <p className="text-xs text-muted-foreground">Posts</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-card/50 backdrop-blur border-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <Heart className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-xl font-bold">{stats.totalLikes}</p>
              <p className="text-xs text-muted-foreground">Curtidas</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-card/50 backdrop-blur border-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary/10">
              <Users className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-xl font-bold">{stats.uniqueAuthors}</p>
              <p className="text-xs text-muted-foreground">Autores</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48 bg-card/50 backdrop-blur">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v: 'recent' | 'popular') => setSortBy(v)}>
          <SelectTrigger className="w-full sm:w-48 bg-card/50 backdrop-blur">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Mais recentes
              </span>
            </SelectItem>
            <SelectItem value="popular">
              <span className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Mais populares
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Create Post & Video Quick Actions */}
      <div className="space-y-4">
        {/* Main post card */}
        <MediaUploadPostCard
          userName={myProfile?.name}
          userAvatar={myProfile?.avatarUrl}
          onSubmit={handleCreatePost}
          isSubmitting={submitting}
        />
        
        {/* Quick Video Actions */}
        <div className="grid grid-cols-3 gap-3">
          <Button
            variant="outline"
            className="h-auto py-4 flex-col gap-2 bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/30 hover:bg-red-500/20"
            onClick={() => navigate('/live/create')}
          >
            <Radio className="h-5 w-5 text-red-500" />
            <span className="text-xs">Live</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 flex-col gap-2 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30 hover:bg-purple-500/20"
            onClick={() => navigate('/videos/upload?type=short')}
          >
            <Zap className="h-5 w-5 text-purple-500" />
            <span className="text-xs">Short</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 flex-col gap-2 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30 hover:bg-blue-500/20"
            onClick={() => navigate('/videos/upload')}
          >
            <Video className="h-5 w-5 text-blue-500" />
            <span className="text-xs">Vídeo</span>
          </Button>
        </div>
      </div>

      {/* Posts Feed */}
      {posts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="p-12 text-center bg-card/50 backdrop-blur border-border/50">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            </motion.div>
            <h3 className="text-xl font-semibold mb-2">Nenhuma publicação ainda</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Seja o primeiro a compartilhar uma ideia, dica ou pergunta com a comunidade VIP!
            </p>
          </Card>
        </motion.div>
      ) : (
        <motion.div 
          className="space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <AnimatePresence mode="popLayout">
            {posts.map((post, index) => (
              <motion.div
                key={post.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.03 }}
              >
                {post.category === 'live' || post.content.includes('🔴') ? (
                  <LivePostCard
                    post={post}
                    currentAffiliateId={myProfile?.id || null}
                    onLike={handleLike}
                    onDelete={handleDeletePost}
                    onEndLive={handleDeletePost}
                    isLiked={hasLiked(post.id)}
                  />
                ) : (post.category === 'shorts' || post.category === 'video') ? (
                  <Card className="p-4 bg-card/50 backdrop-blur border-border/50">
                    <div className="flex items-start gap-3 mb-3">
                      <img
                        src={post.author?.profile?.avatar_url || '/placeholder.svg'}
                        alt={post.author?.profile?.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <p className="font-medium">{post.author?.profile?.name}</p>
                        <p className="text-xs text-muted-foreground">{new Date(post.created_at).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                    <h3 className="font-semibold mb-2">{post.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{post.content}</p>
                    {post.image_url && (
                      <VideoPlayer src={post.image_url} title={post.title} />
                    )}
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50">
                      <Button variant="ghost" size="sm" onClick={() => handleLike(post.id)}>
                        <Heart className={`h-4 w-4 mr-1 ${hasLiked(post.id) ? 'fill-red-500 text-red-500' : ''}`} />
                        {post.likes_count}
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <SocialPostCard
                    post={post}
                    currentAffiliateId={myProfile?.id || null}
                    onLike={handleLike}
                    onComment={handleComment}
                    onDelete={handleDeletePost}
                    onEdit={handleEditPost}
                    onFollow={followUser}
                    isFollowing={post.author_id ? isFollowing(post.author_id) : false}
                    isLiked={hasLiked(post.id)}
                  />
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Floating Action Button */}
      <FloatingVideoButton />
    </div>
  );
}
