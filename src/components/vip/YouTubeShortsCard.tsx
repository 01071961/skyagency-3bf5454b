import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Smartphone,
  Youtube,
  Upload,
  Play,
  Loader2,
  ExternalLink,
  Hash,
  Music2,
  Scissors,
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
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface YouTubeShortsCardProps {
  affiliateId: string | null;
  userName?: string;
  onShortPosted?: (shortData: { url: string; title: string }) => void;
}

export function YouTubeShortsCard({ 
  affiliateId, 
  userName,
  onShortPosted 
}: YouTubeShortsCardProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [shortTitle, setShortTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  const handlePostShort = async () => {
    if (!shortUrl.trim()) {
      toast.error('Cole o link do seu Short do YouTube');
      return;
    }

    // Validate YouTube Shorts URL
    const isValidShortUrl = shortUrl.includes('youtube.com/shorts/') || 
                            shortUrl.includes('youtu.be/');
    
    if (!isValidShortUrl) {
      toast.error('URL inválida. Cole um link de Short do YouTube');
      return;
    }

    setIsPosting(true);

    try {
      if (affiliateId) {
        const hashtagsFormatted = hashtags
          .split(/[\s,]+/)
          .filter(Boolean)
          .map(tag => tag.startsWith('#') ? tag : `#${tag}`)
          .join(' ');

        const { error } = await supabase
          .from('affiliate_posts')
          .insert({
            author_id: affiliateId,
            title: shortTitle.trim() || '📱 Novo Short',
            content: `📱 Short\n\n${shortDescription}\n\n${hashtagsFormatted}\n\n${shortUrl}`,
            category: 'shorts',
          });

        if (error) throw error;

        toast.success('Short publicado com sucesso!');
        onShortPosted?.({ url: shortUrl, title: shortTitle });
        
        // Reset form
        setShortTitle('');
        setShortDescription('');
        setHashtags('');
        setShortUrl('');
        setShowDialog(false);
      }
    } catch (error: any) {
      console.error('Error posting short:', error);
      toast.error('Erro ao publicar Short: ' + error.message);
    } finally {
      setIsPosting(false);
    }
  };

  // Extract Short ID for preview
  const getShortId = (url: string): string | null => {
    const shortsMatch = url.match(/youtube\.com\/shorts\/([^?&]+)/);
    const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
    return shortsMatch?.[1] || shortMatch?.[1] || null;
  };

  const shortId = getShortId(shortUrl);

  return (
    <Card className="bg-gradient-to-br from-card via-card to-purple-500/5 border-purple-500/20 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div 
              className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20"
              whileHover={{ scale: 1.05 }}
            >
              <Smartphone className="h-5 w-5 text-purple-400" />
            </motion.div>
            <div>
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                Shorts
                <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-400">
                  9:16
                </Badge>
              </h3>
              <p className="text-xs text-muted-foreground">
                Vídeo curto vertical
              </p>
            </div>
          </div>
        </div>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button size="icon" aria-label="Postar short" className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
              <Scissors className="h-4 w-4" />
              <span className="sr-only">Postar Short</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-purple-500" />
                Publicar Short
              </DialogTitle>
              <DialogDescription>
                Cole o link do seu Short
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>URL do Short *</Label>
                <Input
                  placeholder="https://youtube.com/shorts/..."
                  value={shortUrl}
                  onChange={(e) => setShortUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Cole o link do seu Short já publicado no YouTube
                </p>
              </div>

              {/* Short Preview */}
              <AnimatePresence>
                {shortId && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-xl overflow-hidden border border-purple-500/30 bg-black"
                  >
                    <div className="aspect-[9/16] max-h-[300px] mx-auto">
                      <iframe
                        src={`https://www.youtube.com/embed/${shortId}`}
                        title="Short Preview"
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  placeholder="Ex: Dica rápida de vendas"
                  value={shortTitle}
                  onChange={(e) => setShortTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  placeholder="Breve descrição do seu Short..."
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Hashtags
                </Label>
                <Input
                  placeholder="vendas marketing dicas"
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Separe as hashtags por espaço ou vírgula
                </p>
              </div>

              <div className="p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Music2 className="h-4 w-4 text-purple-400" />
                  Como criar um Short viral
                </div>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Use formato vertical (9:16)</li>
                  <li>Máximo de 60 segundos</li>
                  <li>Comece com um gancho nos primeiros 2 segundos</li>
                  <li>Use músicas e efeitos em alta</li>
                </ul>
                <a
                  href="https://studio.youtube.com/channel/UC/videos/shorts"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                >
                  <ExternalLink className="h-3 w-3" />
                  Criar Short no YouTube Studio
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
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 gap-2"
                onClick={handlePostShort}
                disabled={isPosting || !shortUrl.trim()}
              >
                {isPosting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Publicar na Comunidade
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <a
          href="https://studio.youtube.com/channel/UC/videos/shorts"
          target="_blank"
          rel="noopener noreferrer"
          className="block mt-3"
        >
          <Button variant="outline" className="w-full gap-2">
            <Youtube className="h-4 w-4 text-purple-500" />
            Criar no YouTube Studio
          </Button>
        </a>
      </CardContent>
    </Card>
  );
}
