import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video,
  Youtube,
  Upload,
  Loader2,
  ExternalLink,
  FileVideo,
  Globe,
  Lock,
  Users,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface YouTubeVideoUploadCardProps {
  affiliateId: string | null;
  userName?: string;
  onVideoPosted?: (videoData: { url: string; title: string }) => void;
}

const categories = [
  { value: 'education', label: 'Educação' },
  { value: 'business', label: 'Negócios' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'tutorial', label: 'Tutorial' },
  { value: 'entretenimento', label: 'Entretenimento' },
];

const visibilityOptions = [
  { value: 'public', label: 'Público', icon: Globe, description: 'Todos podem ver' },
  { value: 'unlisted', label: 'Não listado', icon: Users, description: 'Apenas quem tem o link' },
  { value: 'private', label: 'Privado', icon: Lock, description: 'Apenas você' },
];

export function YouTubeVideoUploadCard({ 
  affiliateId, 
  userName,
  onVideoPosted 
}: YouTubeVideoUploadCardProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoCategory, setVideoCategory] = useState('education');
  const [visibility, setVisibility] = useState('public');
  const [isPosting, setIsPosting] = useState(false);

  const handlePostVideo = async () => {
    if (!videoUrl.trim()) {
      toast.error('Cole o link do seu vídeo do YouTube');
      return;
    }

    // Validate YouTube URL
    const isValidUrl = videoUrl.includes('youtube.com/watch') || 
                       videoUrl.includes('youtu.be/') ||
                       videoUrl.includes('youtube.com/embed/');
    
    if (!isValidUrl) {
      toast.error('URL inválida. Cole um link de vídeo do YouTube');
      return;
    }

    setIsPosting(true);

    try {
      if (affiliateId) {
        const { error } = await supabase
          .from('affiliate_posts')
          .insert({
            author_id: affiliateId,
            title: videoTitle.trim() || '🎬 Novo Vídeo',
            content: `🎬 Vídeo\n\n${videoDescription}\n\n${videoUrl}`,
            category: 'video',
          });

        if (error) throw error;

        toast.success('Vídeo publicado na comunidade!');
        onVideoPosted?.({ url: videoUrl, title: videoTitle });
        
        // Reset form
        setVideoTitle('');
        setVideoDescription('');
        setVideoUrl('');
        setVideoCategory('education');
        setShowDialog(false);
      }
    } catch (error: any) {
      console.error('Error posting video:', error);
      toast.error('Erro ao publicar vídeo: ' + error.message);
    } finally {
      setIsPosting(false);
    }
  };

  // Extract Video ID for preview
  const getVideoId = (url: string): string | null => {
    const watchMatch = url.match(/youtube\.com\/watch\?v=([^&]+)/);
    const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
    const embedMatch = url.match(/youtube\.com\/embed\/([^?&]+)/);
    return watchMatch?.[1] || shortMatch?.[1] || embedMatch?.[1] || null;
  };

  const videoId = getVideoId(videoUrl);

  return (
    <Card className="bg-gradient-to-br from-card via-card to-blue-500/5 border-blue-500/20 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div 
              className="p-2 rounded-lg bg-blue-500/20"
              whileHover={{ scale: 1.05 }}
            >
              <FileVideo className="h-5 w-5 text-blue-400" />
            </motion.div>
            <div>
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                Vídeo
                <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-400">
                  🎬
                </Badge>
              </h3>
              <p className="text-xs text-muted-foreground">
                Postar na timeline
              </p>
            </div>
          </div>
        </div>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button size="icon" aria-label="Postar vídeo" className="w-full bg-blue-500 hover:bg-blue-600">
              <Video className="h-4 w-4" />
              <span className="sr-only">Postar Vídeo</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Video className="h-5 w-5 text-blue-500" />
                Publicar Vídeo
              </DialogTitle>
              <DialogDescription>
                Cole o link do vídeo
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>URL do Vídeo *</Label>
                <Input
                  placeholder="https://youtube.com/watch?v=..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                />
              </div>

              {/* Video Preview */}
              <AnimatePresence>
                {videoId && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-xl overflow-hidden border border-blue-500/30 bg-black"
                  >
                    <div className="aspect-video">
                      <iframe
                        src={`https://www.youtube.com/embed/${videoId}`}
                        title="Video Preview"
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <Label>Título do Vídeo</Label>
                <Input
                  placeholder="Ex: Como aumentar suas vendas em 30 dias"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  placeholder="Conte sobre o conteúdo do seu vídeo..."
                  value={videoDescription}
                  onChange={(e) => setVideoDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={videoCategory} onValueChange={setVideoCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Visibilidade</Label>
                  <Select value={visibility} onValueChange={setVisibility}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {visibilityOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <span className="flex items-center gap-2">
                            <opt.icon className="h-4 w-4" />
                            {opt.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-3 bg-blue-500/10 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Upload className="h-4 w-4 text-blue-400" />
                  Dicas para seu vídeo
                </div>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Use miniaturas atraentes e personalizadas</li>
                  <li>Títulos claros e diretos funcionam melhor</li>
                  <li>Adicione descrições detalhadas com palavras-chave</li>
                  <li>Ative legendas automáticas</li>
                </ul>
                <a
                  href="https://studio.youtube.com/channel/UC/videos/upload"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                >
                  <ExternalLink className="h-3 w-3" />
                  Upload no YouTube Studio
                </a>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowDialog(false)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-blue-500 hover:bg-blue-600 gap-2"
                onClick={handlePostVideo}
                disabled={isPosting || !videoUrl.trim()}
              >
                {isPosting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Publicar na Timeline
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <a
          href="https://studio.youtube.com/channel/UC/videos/upload"
          target="_blank"
          rel="noopener noreferrer"
          className="block mt-3"
        >
          <Button variant="outline" className="w-full gap-2">
            <Youtube className="h-4 w-4 text-blue-500" />
            Upload no YouTube Studio
          </Button>
        </a>
      </CardContent>
    </Card>
  );
}
