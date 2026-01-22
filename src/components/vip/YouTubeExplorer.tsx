import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Play,
  Radio,
  TrendingUp,
  ListVideo,
  Eye,
  ThumbsUp,
  Clock,
  ExternalLink,
  Loader2,
  Youtube,
  Users,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useYouTubeAPI, YouTubeVideo } from '@/hooks/useYouTubeAPI';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface YouTubeExplorerProps {
  onSelectVideo?: (video: YouTubeVideo) => void;
  showAddToPost?: boolean;
}

export function YouTubeExplorer({ onSelectVideo, showAddToPost = true }: YouTubeExplorerProps) {
  const { 
    loading, 
    searchVideos, 
    getLiveBroadcasts, 
    getTrendingVideos,
    getVideoDetails,
  } = useYouTubeAPI();

  const [activeTab, setActiveTab] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);

  useEffect(() => {
    if (activeTab === 'trending') {
      handleTrending();
    } else if (activeTab === 'lives') {
      handleLives();
    }
  }, [activeTab]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    const result = await searchVideos(searchQuery, 12);
    if (result) {
      setVideos(result.videos);
      setNextPageToken(result.nextPageToken);
    }
  };

  const handleTrending = async () => {
    const result = await getTrendingVideos(12);
    if (result) {
      setVideos(result.videos);
      setNextPageToken(result.nextPageToken);
    }
  };

  const handleLives = async () => {
    const result = await getLiveBroadcasts(undefined, 12);
    if (result) {
      setVideos(result.videos);
      setNextPageToken(result.nextPageToken);
    }
  };

  const handleLoadMore = async () => {
    if (!nextPageToken) return;

    let result;
    if (activeTab === 'search') {
      result = await searchVideos(searchQuery, 12, nextPageToken);
    } else if (activeTab === 'trending') {
      result = await getTrendingVideos(12, nextPageToken);
    } else if (activeTab === 'lives') {
      result = await getLiveBroadcasts(undefined, 12, nextPageToken);
    }

    if (result) {
      setVideos(prev => [...prev, ...result.videos]);
      setNextPageToken(result.nextPageToken);
    }
  };

  const handleVideoClick = async (video: YouTubeVideo) => {
    const details = await getVideoDetails(video.id);
    setSelectedVideo(details || video);
    setShowVideoModal(true);
  };

  const handleAddToPost = (video: YouTubeVideo) => {
    if (onSelectVideo) {
      onSelectVideo(video);
      toast.success('Vídeo selecionado para o post');
    }
  };

  const formatViewCount = (count?: string) => {
    if (!count) return '0';
    const num = parseInt(count);
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return count;
  };

  const formatDuration = (duration?: string) => {
    if (!duration) return '';
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return duration;
    
    const hours = match[1] ? parseInt(match[1]) : 0;
    const minutes = match[2] ? parseInt(match[2]) : 0;
    const seconds = match[3] ? parseInt(match[3]) : 0;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const VideoCard = ({ video }: { video: YouTubeVideo }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="group cursor-pointer"
    >
      <Card className="overflow-hidden bg-card/80 backdrop-blur border-border/50 hover:border-primary/30 transition-all">
        <div className="relative" onClick={() => handleVideoClick(video)}>
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full aspect-video object-cover"
          />
          {video.isLive ? (
            <Badge className="absolute top-2 left-2 bg-red-500 text-white animate-pulse">
              <Radio className="h-3 w-3 mr-1" />
              AO VIVO
            </Badge>
          ) : video.duration && (
            <Badge className="absolute bottom-2 right-2 bg-black/80 text-white">
              {formatDuration(video.duration)}
            </Badge>
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Play className="h-12 w-12 text-white" />
          </div>
        </div>
        <CardContent className="p-3">
          <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
            {video.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">{video.channelTitle}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            {video.viewCount && (
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {formatViewCount(video.viewCount)}
              </span>
            )}
            {video.isLive && video.liveConcurrentViewers && (
              <span className="flex items-center gap-1 text-red-400">
                <Users className="h-3 w-3" />
                {formatViewCount(video.liveConcurrentViewers)} assistindo
              </span>
            )}
            {!video.isLive && (
              <span>
                {formatDistanceToNow(new Date(video.publishedAt), { addSuffix: true, locale: ptBR })}
              </span>
            )}
          </div>
          {showAddToPost && (
            <Button
              size="sm"
              variant="outline"
              className="w-full mt-3 gap-2"
              onClick={(e) => {
                e.stopPropagation();
                handleAddToPost(video);
              }}
            >
              <Plus className="h-4 w-4" />
              Usar no Post
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-red-500/10">
          <Youtube className="h-6 w-6 text-red-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Explorar YouTube</h2>
          <p className="text-sm text-muted-foreground">
            Busque vídeos, lives e conteúdos em alta
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="search" className="gap-2">
            <Search className="h-4 w-4" />
            Buscar
          </TabsTrigger>
          <TabsTrigger value="lives" className="gap-2">
            <Radio className="h-4 w-4" />
            Lives
          </TabsTrigger>
          <TabsTrigger value="trending" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Em Alta
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-4 mt-4">
          <div className="flex gap-2">
            <Input
              placeholder="Buscar vídeos no YouTube..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="lives" className="mt-4">
          <p className="text-sm text-muted-foreground mb-4">
            Transmissões ao vivo no Brasil
          </p>
        </TabsContent>

        <TabsContent value="trending" className="mt-4">
          <p className="text-sm text-muted-foreground mb-4">
            Vídeos mais populares no momento
          </p>
        </TabsContent>
      </Tabs>

      {/* Results */}
      {loading && videos.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="aspect-video rounded-lg" />
          ))}
        </div>
      ) : videos.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {videos.map((video, index) => (
                <VideoCard key={`${video.id}-${index}`} video={video} />
              ))}
            </AnimatePresence>
          </div>
          
          {nextPageToken && (
            <div className="flex justify-center">
              <Button 
                variant="outline" 
                onClick={handleLoadMore}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Carregar mais
              </Button>
            </div>
          )}
        </>
      ) : activeTab === 'search' ? (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Digite algo para buscar vídeos</p>
        </div>
      ) : null}

      {/* Video Modal */}
      <Dialog open={showVideoModal} onOpenChange={setShowVideoModal}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          {selectedVideo && (
            <>
              <div className="aspect-video bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=1`}
                  title={selectedVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
              <div className="p-4">
                <DialogHeader>
                  <DialogTitle className="text-lg">{selectedVideo.title}</DialogTitle>
                </DialogHeader>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span>{selectedVideo.channelTitle}</span>
                  {selectedVideo.viewCount && (
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {formatViewCount(selectedVideo.viewCount)} visualizações
                    </span>
                  )}
                  {selectedVideo.likeCount && (
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="h-4 w-4" />
                      {formatViewCount(selectedVideo.likeCount)}
                    </span>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => window.open(`https://youtube.com/watch?v=${selectedVideo.id}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Abrir no YouTube
                  </Button>
                  {showAddToPost && (
                    <Button
                      className="gap-2"
                      onClick={() => {
                        handleAddToPost(selectedVideo);
                        setShowVideoModal(false);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      Usar no Post
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
