import { useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { VIPPostCard } from './VIPPostCard';
import { useVIPFeed, VIPPost } from '@/hooks/useVIPSocial';

interface VIPFeedProps {
  filter?: 'all' | 'following' | 'shorts' | 'live';
  isVIP?: boolean;
}

export function VIPFeed({ filter = 'all', isVIP = false }: VIPFeedProps) {
  const { posts, loading, hasMore, loadMore } = useVIPFeed(filter);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Infinite scroll with Intersection Observer
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    if (entry.isIntersecting && hasMore && !loading) {
      loadMore();
    }
  }, [hasMore, loading, loadMore]);

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    observerRef.current = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '100px',
      threshold: 0,
    });

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleObserver]);

  if (loading && posts.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando feed...</p>
        </div>
      </div>
    );
  }

  if (!loading && posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
          <span className="text-4xl">📺</span>
        </div>
        <h3 className="text-lg font-semibold mb-2">Nenhum post encontrado</h3>
        <p className="text-muted-foreground max-w-sm">
          {filter === 'following' 
            ? 'Siga algumas pessoas para ver seus posts aqui!'
            : 'Seja o primeiro a postar algo incrível!'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Grid layout for videos (YouTube style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {posts.map((post, index) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <VIPPostCard post={post} isVIP={isVIP} />
          </motion.div>
        ))}
      </div>

      {/* Load more trigger */}
      <div ref={loadMoreRef} className="py-4">
        {loading && (
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
      </div>

      {!hasMore && posts.length > 0 && (
        <p className="text-center text-muted-foreground py-8">
          Você chegou ao fim! 🎉
        </p>
      )}
    </div>
  );
}
