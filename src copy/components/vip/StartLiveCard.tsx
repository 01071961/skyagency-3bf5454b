import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radio,
  Youtube,
  Video,
  Play,
  Square,
  Settings,
  Copy,
  ExternalLink,
  Loader2,
  Check,
  AlertCircle,
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

interface StartLiveCardProps {
  affiliateId: string | null;
  userName?: string;
  onLiveStarted?: (liveData: { url: string; title: string }) => void;
  onLiveEnded?: () => void;
}

export function StartLiveCard({ 
  affiliateId, 
  userName,
  onLiveStarted,
  onLiveEnded 
}: StartLiveCardProps) {
  const [isLive, setIsLive] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [liveTitle, setLiveTitle] = useState('');
  const [liveDescription, setLiveDescription] = useState('');
  const [liveCategory, setLiveCategory] = useState('education');
  const [youtubeStreamUrl, setYoutubeStreamUrl] = useState('');
  const [streamKey, setStreamKey] = useState('');
  const [currentLiveUrl, setCurrentLiveUrl] = useState('');

  const handleStartLive = async () => {
    if (!liveTitle.trim()) {
      toast.error('Digite um título para a live');
      return;
    }

    setIsStarting(true);

    try {
      // Create a live post in the database
      if (affiliateId) {
        const { data: post, error } = await supabase
          .from('affiliate_posts')
          .insert({
            author_id: affiliateId,
            title: `🔴 ${liveTitle}`,
            content: `🔴 AO VIVO AGORA!\n\n${liveDescription}\n\n${youtubeStreamUrl || 'Transmissão ao vivo da rede VIP'}`,
            category: 'live',
          })
          .select()
          .single();

        if (error) throw error;

        setIsLive(true);
        setCurrentLiveUrl(youtubeStreamUrl);
        toast.success('Live iniciada com sucesso!');
        
        onLiveStarted?.({
          url: youtubeStreamUrl,
          title: liveTitle
        });
      }
    } catch (error: any) {
      console.error('Error starting live:', error);
      toast.error('Erro ao iniciar live: ' + error.message);
    } finally {
      setIsStarting(false);
      setShowSetupDialog(false);
    }
  };

  const handleEndLive = async () => {
    setIsEnding(true);

    try {
      // Update the post to remove live status
      if (affiliateId) {
        const { error } = await supabase
          .from('affiliate_posts')
          .update({
            title: liveTitle.replace('🔴 ', ''),
            content: `Transmissão encerrada.\n\n${liveDescription}`,
          })
          .eq('author_id', affiliateId)
          .eq('category', 'live')
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) console.error('Error updating post:', error);
      }

      setIsLive(false);
      setCurrentLiveUrl('');
      setLiveTitle('');
      setLiveDescription('');
      toast.success('Live encerrada');
      onLiveEnded?.();
    } catch (error: any) {
      console.error('Error ending live:', error);
      toast.error('Erro ao encerrar live');
    } finally {
      setIsEnding(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  return (
    <Card className="bg-gradient-to-br from-card via-card to-red-500/5 border-red-500/20 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div 
              className={`p-2 rounded-lg ${isLive ? 'bg-red-500/20' : 'bg-muted/50'}`}
              animate={isLive ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 1, repeat: isLive ? Infinity : 0 }}
            >
              <Radio className={`h-5 w-5 ${isLive ? 'text-red-500' : 'text-muted-foreground'}`} />
            </motion.div>
            <div>
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                Live
                {isLive && (
                  <Badge variant="destructive" className="animate-pulse">
                    🔴
                  </Badge>
                )}
              </h3>
              <p className="text-xs text-muted-foreground">
                {isLive ? 'Transmitindo agora' : 'Iniciar transmissão'}
              </p>
            </div>
          </div>
        </div>

        {isLive ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
              <p className="text-sm font-medium text-red-400 mb-1">{liveTitle}</p>
              {currentLiveUrl && (
                <div className="flex items-center gap-2">
                  <Input
                    value={currentLiveUrl}
                    readOnly
                    className="text-xs bg-transparent border-none h-7 p-0"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => copyToClipboard(currentLiveUrl, 'Link da live')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            <Button
              variant="destructive"
              size="icon"
              aria-label="Encerrar live"
              className="w-full gap-2"
              onClick={handleEndLive}
              disabled={isEnding}
            >
              {isEnding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              <span className="sr-only">Encerrar</span>
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
              <DialogTrigger asChild>
                <Button size="icon" aria-label="Iniciar live" className="w-full bg-red-500 hover:bg-red-600">
                  <Play className="h-4 w-4" />
                  <span className="sr-only">Iniciar</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Youtube className="h-5 w-5 text-red-500" />
                    Configurar Live
                  </DialogTitle>
                  <DialogDescription>
                    Defina título e link
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Título da Live *</Label>
                    <Input
                      placeholder="Ex: Estratégias de Vendas ao Vivo"
                      value={liveTitle}
                      onChange={(e) => setLiveTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Textarea
                      placeholder="Descreva o conteúdo da sua live..."
                      value={liveDescription}
                      onChange={(e) => setLiveDescription(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select value={liveCategory} onValueChange={setLiveCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="education">Educação</SelectItem>
                        <SelectItem value="business">Negócios</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="estrategias">Estratégias</SelectItem>
                        <SelectItem value="networking">Networking</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      URL da Live no YouTube
                      <Badge variant="outline" className="text-xs">Opcional</Badge>
                    </Label>
                    <Input
                      placeholder="https://youtube.com/live/..."
                      value={youtubeStreamUrl}
                      onChange={(e) => setYoutubeStreamUrl(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                        Cole o link da live para incorporar aqui
                      </p>
                  </div>

                  <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      Como iniciar no YouTube Studio
                    </div>
                    <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>Abra o YouTube Studio e clique em "Criar" → "Transmitir ao vivo"</li>
                      <li>Configure título, descrição e miniatura</li>
                      <li>Copie o link da live e cole acima</li>
                      <li>Inicie a transmissão no YouTube e depois aqui</li>
                    </ol>
                    <a
                      href="https://studio.youtube.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Abrir YouTube Studio
                    </a>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowSetupDialog(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="flex-1 bg-red-500 hover:bg-red-600 gap-2"
                    onClick={handleStartLive}
                    disabled={isStarting || !liveTitle.trim()}
                  >
                    {isStarting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    Iniciar Live
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <a
              href="https://studio.youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button variant="outline" className="w-full gap-2">
                <Youtube className="h-4 w-4 text-red-500" />
                Abrir YouTube Studio
              </Button>
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
