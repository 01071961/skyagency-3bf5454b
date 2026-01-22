import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Youtube,
  Upload,
  Search,
  Radio,
  ListVideo,
  PlaySquare,
  ExternalLink,
  Info,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { YouTubeExplorer } from '@/components/vip/YouTubeExplorer';
import { YouTubeVideo } from '@/hooks/useYouTubeAPI';
import { toast } from 'sonner';

export default function VIPYouTube() {
  const navigate = useNavigate();
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);

  const handleVideoSelect = (video: YouTubeVideo) => {
    setSelectedVideo(video);
    toast.success(`Vídeo "${video.title}" selecionado`);
  };

  const handleUseInPost = () => {
    if (selectedVideo) {
      // Navigate to blog with video URL
      const videoUrl = `https://youtube.com/watch?v=${selectedVideo.id}`;
      navigate(`/vip/network/blog?video=${encodeURIComponent(videoUrl)}`);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500/20 via-card to-card border border-red-500/20 p-6"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-red-500/10 via-transparent to-transparent" />
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
            <div className="p-3 rounded-xl bg-red-500/20">
              <Youtube className="h-8 w-8 text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                YouTube Studio
              </h1>
              <p className="text-muted-foreground">
                Explore, busque e integre vídeos do YouTube
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="gap-2"
            asChild
          >
            <a 
              href="https://studio.youtube.com" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4" />
              Abrir YouTube Studio
            </a>
          </Button>
        </div>
      </motion.div>

      {/* Selected Video Preview */}
      {selectedVideo && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex gap-4 items-center">
                <img
                  src={selectedVideo.thumbnailUrl}
                  alt={selectedVideo.title}
                  className="w-32 h-20 object-cover rounded-lg"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium line-clamp-1">{selectedVideo.title}</h3>
                  <p className="text-sm text-muted-foreground">{selectedVideo.channelTitle}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setSelectedVideo(null)}>
                    Remover
                  </Button>
                  <Button onClick={handleUseInPost} className="gap-2">
                    <PlaySquare className="h-4 w-4" />
                    Usar no Post
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="explore" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="explore" className="gap-2">
            <Search className="h-4 w-4" />
            Explorar
          </TabsTrigger>
          <TabsTrigger value="upload" className="gap-2">
            <Upload className="h-4 w-4" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="playlists" className="gap-2">
            <ListVideo className="h-4 w-4" />
            Playlists
          </TabsTrigger>
        </TabsList>

        <TabsContent value="explore">
          <YouTubeExplorer onSelectVideo={handleVideoSelect} showAddToPost />
        </TabsContent>

        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload de Vídeos
              </CardTitle>
              <CardDescription>
                Envie vídeos diretamente para o YouTube e compartilhe na rede social VIP
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Área de Upload */}
              <Card className="p-8 border-dashed border-2 cursor-pointer hover:border-red-500/50 transition-colors bg-gradient-to-br from-red-500/5 to-transparent">
                <div className="text-center space-y-4">
                  <div className="mx-auto w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
                    <Youtube className="h-10 w-10 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Conecte sua conta do YouTube</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Faça login com sua conta Google para enviar vídeos diretamente
                    </p>
                  </div>
                  <Button 
                    className="gap-2 bg-red-600 hover:bg-red-700"
                    onClick={() => {
                      // Inicia o fluxo OAuth do Google/YouTube
                      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
                      const redirectUri = `${window.location.origin}/auth/youtube/callback`;
                      const scope = 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube';
                      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`;
                      window.location.href = authUrl;
                    }}
                  >
                    <Youtube className="h-4 w-4" />
                    Conectar com YouTube
                  </Button>
                </div>
              </Card>

              {/* Info */}
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p>Ao conectar, você poderá:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Fazer upload de vídeos direto para seu canal</li>
                    <li>Gerenciar suas playlists</li>
                    <li>Compartilhar vídeos na rede VIP automaticamente</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="playlists">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListVideo className="h-5 w-5" />
                Gerenciar Playlists
              </CardTitle>
              <CardDescription>
                Visualize e gerencie suas playlists do YouTube
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Conecte sua conta</AlertTitle>
                <AlertDescription>
                  Para gerenciar playlists, conecte sua conta do YouTube usando OAuth 2.0.
                  Isso permitirá criar, editar e organizar suas playlists.
                </AlertDescription>
              </Alert>
              
              <div className="mt-6 text-center py-12">
                <ListVideo className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Suas Playlists</h3>
                <p className="text-muted-foreground mb-4">
                  Conecte sua conta para ver e gerenciar playlists
                </p>
                <Button variant="outline" disabled>
                  Conectar YouTube
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-4 cursor-pointer hover:border-red-500/30 transition-colors" onClick={() => navigate('/vip/network/blog')}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <Radio className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <h3 className="font-medium">Iniciar Live</h3>
              <p className="text-xs text-muted-foreground">Transmita ao vivo na comunidade</p>
            </div>
          </div>
        </Card>
        
        <a 
          href="https://studio.youtube.com/channel/UC/analytics" 
          target="_blank" 
          rel="noopener noreferrer"
          className="block"
        >
          <Card className="p-4 cursor-pointer hover:border-red-500/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <BarChart3 className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <h3 className="font-medium">Analytics</h3>
                <p className="text-xs text-muted-foreground">Veja estatísticas do canal</p>
              </div>
            </div>
          </Card>
        </a>
        
        <a 
          href="https://www.youtube.com/upload" 
          target="_blank" 
          rel="noopener noreferrer"
          className="block"
        >
          <Card className="p-4 cursor-pointer hover:border-red-500/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Upload className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <h3 className="font-medium">Upload Rápido</h3>
                <p className="text-xs text-muted-foreground">Envie direto no YouTube</p>
              </div>
            </div>
          </Card>
        </a>
      </div>
    </div>
  );
}
