import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Image as ImageIcon, 
  Video, 
  Send, 
  X, 
  Hash, 
  Radio,
  Upload,
  Loader2,
  Play,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { isYouTubeUrl, getYouTubeEmbedUrl } from '@/lib/url';

const categories = [
  { value: 'geral', label: 'Geral', emoji: '💬' },
  { value: 'estrategias', label: 'Estratégias de Vendas', emoji: '🎯' },
  { value: 'marketing', label: 'Marketing Digital', emoji: '📱' },
  { value: 'cases', label: 'Cases de Sucesso', emoji: '🏆' },
  { value: 'duvidas', label: 'Dúvidas', emoji: '❓' },
  { value: 'networking', label: 'Networking', emoji: '🤝' },
  { value: 'live', label: 'Transmissão ao vivo', emoji: '🔴' },
];

interface MediaUploadPostCardProps {
  userAvatar?: string;
  userName?: string;
  onSubmit: (data: { 
    title: string; 
    content: string; 
    category: string; 
    imageUrl?: string;
    isLive?: boolean;
  }) => Promise<void>;
  isSubmitting?: boolean;
}

export function MediaUploadPostCard({ 
  userAvatar, 
  userName = 'Você', 
  onSubmit,
  isSubmitting = false 
}: MediaUploadPostCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('geral');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [liveUrl, setLiveUrl] = useState('');
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleMediaSelect = useCallback((file: File, type: 'image' | 'video') => {
    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      toast.error('Arquivo muito grande. Máximo 50MB.');
      return;
    }

    setMediaFile(file);
    setMediaType(type);

    const reader = new FileReader();
    reader.onload = (e) => {
      setMediaPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleMediaSelect(file, 'image');
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleMediaSelect(file, 'video');
  };

  const clearMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const uploadMedia = async (): Promise<string | null> => {
    if (!mediaFile) return null;

    setIsUploading(true);
    try {
      const fileExt = mediaFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `posts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('social-media')
        .upload(filePath, mediaFile);

      if (uploadError) {
        // If bucket doesn't exist, just return the preview URL for now
        console.warn('Upload failed, using local preview:', uploadError);
        return mediaPreview;
      }

      const { data } = supabase.storage
        .from('social-media')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading media:', error);
      return mediaPreview; // Fallback to local preview
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && !mediaFile && !liveUrl) return;
    
    let imageUrl: string | undefined;
    
    if (mediaFile) {
      const uploadedUrl = await uploadMedia();
      if (uploadedUrl) imageUrl = uploadedUrl;
    }

    const isLive = category === 'live' || !!liveUrl;
    let finalContent = content.trim();
    
    if (liveUrl) {
      finalContent = `🔴 Transmissão ao vivo\n\n${liveUrl}${content ? '\n\n' + content : ''}`;
    }

    await onSubmit({ 
      title: title.trim() || (isLive ? '🔴 Transmissão ao vivo' : 'Post'), 
      content: finalContent || 'Confira!', 
      category: isLive ? 'live' : category,
      imageUrl,
      isLive,
    });
    
    // Reset form
    setTitle('');
    setContent('');
    setCategory('geral');
    setLiveUrl('');
    clearMedia();
    setIsExpanded(false);
  };

  const selectedCategory = categories.find(c => c.value === category);
  const youtubePreview = liveUrl && isYouTubeUrl(liveUrl) ? getYouTubeEmbedUrl(liveUrl) : null;

  return (
    <Card className="overflow-hidden bg-card/80 backdrop-blur border-border/50">
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10 ring-2 ring-offset-2 ring-offset-background ring-primary/20">
            <AvatarImage src={userAvatar} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
              {userName?.charAt(0) || 'V'}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            {!isExpanded ? (
              <motion.button
                className="w-full text-left px-4 py-3 bg-muted/30 hover:bg-muted/50 rounded-full text-muted-foreground transition-colors"
                onClick={() => setIsExpanded(true)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                O que você quer compartilhar, {userName?.split(' ')[0]}?
              </motion.button>
            ) : (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  {/* Title Input */}
                  <Input
                    placeholder="Título do post (opcional)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-muted/30 border-border/50 font-medium"
                  />

                  {/* Content */}
                  <Textarea
                    placeholder="Compartilhe uma ideia, dica ou pergunta com a comunidade..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[100px] bg-muted/30 border-border/50 resize-none"
                    autoFocus
                  />

                  {/* Live URL Input */}
                  <div className="space-y-2">
                    <Input
                      placeholder="🔴 Cole o link da transmissão ao vivo (YouTube, etc)"
                      value={liveUrl}
                      onChange={(e) => setLiveUrl(e.target.value)}
                      className="bg-muted/30 border-border/50"
                    />
                    
                    {/* YouTube Preview */}
                    {youtubePreview && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="rounded-xl overflow-hidden border border-red-500/30 bg-black"
                      >
                        <div className="aspect-video">
                          <iframe
                            src={youtubePreview}
                            title="Preview"
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          />
                        </div>
                        <div className="p-2 bg-red-500/10 flex items-center gap-2">
                          <Badge variant="destructive" className="animate-pulse">
                            🔴 AO VIVO
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Preview da transmissão
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Media Preview */}
                  {mediaPreview && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative rounded-xl overflow-hidden border border-border/50"
                    >
                      {mediaType === 'image' ? (
                        <img 
                          src={mediaPreview} 
                          alt="Preview" 
                          className="w-full max-h-[300px] object-cover"
                        />
                      ) : (
                        <video 
                          src={mediaPreview} 
                          controls 
                          className="w-full max-h-[300px]"
                        />
                      )}
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={clearMedia}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  )}

                  {/* Category & Actions */}
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger className="w-auto gap-2 bg-muted/30">
                          <Hash className="h-4 w-4 text-muted-foreground" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              <span className="flex items-center gap-2">
                                <span>{cat.emoji}</span>
                                {cat.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Media buttons */}
                      <div className="flex items-center gap-1">
                        <input
                          type="file"
                          ref={imageInputRef}
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={handleImageChange}
                        />
                        <input
                          type="file"
                          ref={videoInputRef}
                          accept="video/*"
                          capture
                          className="hidden"
                          onChange={handleVideoChange}
                        />
                        
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 text-green-500 hover:text-green-400 hover:bg-green-500/10"
                          onClick={() => imageInputRef.current?.click()}
                          disabled={isUploading}
                        >
                          <ImageIcon className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 text-blue-500 hover:text-blue-400 hover:bg-blue-500/10"
                          onClick={() => videoInputRef.current?.click()}
                          disabled={isUploading}
                        >
                          <Video className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                          onClick={() => {
                            setCategory('live');
                            const input = document.querySelector('input[placeholder*="transmissão"]') as HTMLInputElement;
                            input?.focus();
                          }}
                        >
                          <Radio className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsExpanded(false);
                          setTitle('');
                          setContent('');
                          setLiveUrl('');
                          clearMedia();
                        }}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSubmit}
                        disabled={(!content.trim() && !mediaFile && !liveUrl) || isSubmitting || isUploading}
                        className="bg-gradient-to-r from-primary to-primary/80 gap-2"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            {isSubmitting ? 'Publicando...' : 'Publicar'}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Quick action buttons when collapsed */}
        {!isExpanded && (
          <div className="flex items-center justify-around mt-4 pt-4 border-t border-border/50">
            <Button 
              variant="ghost" 
              size="icon" 
              aria-label="Adicionar foto"
              className="flex-1 text-muted-foreground hover:text-foreground"
              onClick={() => {
                setIsExpanded(true);
                setTimeout(() => imageInputRef.current?.click(), 100);
              }}
            >
              <ImageIcon className="h-4 w-4 text-green-500" />
              <span className="sr-only">Foto</span>
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              aria-label="Adicionar vídeo"
              className="flex-1 text-muted-foreground hover:text-foreground"
              onClick={() => {
                setIsExpanded(true);
                setTimeout(() => videoInputRef.current?.click(), 100);
              }}
            >
              <Video className="h-4 w-4 text-blue-500" />
              <span className="sr-only">Vídeo</span>
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              aria-label="Adicionar ao vivo"
              className="flex-1 text-muted-foreground hover:text-foreground"
              onClick={() => {
                setIsExpanded(true);
                setCategory('live');
              }}
            >
              <Radio className="h-4 w-4 text-red-500" />
              <span className="sr-only">Ao vivo</span>
            </Button>
          </div>
        )}

        {/* Hidden file inputs */}
        <input
          type="file"
          ref={imageInputRef}
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleImageChange}
        />
        <input
          type="file"
          ref={videoInputRef}
          accept="video/*"
          capture
          className="hidden"
          onChange={handleVideoChange}
        />
      </CardContent>
    </Card>
  );
}
