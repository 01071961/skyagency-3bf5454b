import { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Image as ImageIcon,
  Video,
  Send,
  X,
  Loader2,
  Upload,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';

const categories = [
  { value: 'geral', label: 'Geral', emoji: '💬' },
  { value: 'estrategias', label: 'Estratégias de Vendas', emoji: '🎯' },
  { value: 'marketing', label: 'Marketing Digital', emoji: '📱' },
  { value: 'cases', label: 'Cases de Sucesso', emoji: '🏆' },
  { value: 'duvidas', label: 'Dúvidas', emoji: '❓' },
  { value: 'networking', label: 'Networking', emoji: '🤝' },
];

export default function VIPNetworkCreatePost() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const postType = searchParams.get('type') || 'image'; // 'image' | 'short' | 'video'
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('geral');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [hashtags, setHashtags] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isVideo = postType === 'short' || postType === 'video';
  const acceptTypes = isVideo ? 'video/*' : 'image/*';
  const maxSize = isVideo ? 500 * 1024 * 1024 : 50 * 1024 * 1024; // 500MB for video, 50MB for image

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxSize) {
      toast.error(`Arquivo muito grande. Máximo ${isVideo ? '500MB' : '50MB'}.`);
      return;
    }

    setMediaFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setMediaPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const clearMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Faça login para postar');
      return;
    }

    if (!mediaFile && !description.trim()) {
      toast.error('Adicione conteúdo ou mídia para publicar');
      return;
    }

    setIsUploading(true);

    try {
      let mediaUrl: string | undefined;

      // Upload media if exists
      if (mediaFile) {
        const fileExt = mediaFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const bucket = isVideo ? 'videos' : 'social-media';
        const filePath = isVideo ? fileName : `posts/${fileName}`;

        const { error: uploadError, data: uploadData } = await supabase.storage
          .from(bucket)
          .upload(filePath, mediaFile);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error('Erro ao fazer upload da mídia');
        }

        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);

        mediaUrl = urlData.publicUrl;
      }

      // Create post
      const hashtagsArray = hashtags
        .split(/[#,\s]+/)
        .filter(tag => tag.trim())
        .map(tag => tag.toLowerCase());

      const { error: postError } = await supabase
        .from('vip_posts')
        .insert({
          author_id: user.id,
          title: title.trim() || null,
          content: description.trim() || null,
          media_type: isVideo ? (postType === 'short' ? 'short' : 'video') : 'image',
          media_url: mediaUrl,
          hashtags: hashtagsArray.length > 0 ? hashtagsArray : null,
        });

      if (postError) throw postError;

      toast.success('Post criado com sucesso!');
      navigate('/vip/network');
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast.error(error.message || 'Erro ao criar post');
    } finally {
      setIsUploading(false);
    }
  };

  const getPageTitle = () => {
    switch (postType) {
      case 'short':
        return 'Criar Short';
      case 'video':
        return 'Enviar Vídeo';
      default:
        return 'Publicar Imagem';
    }
  };

  const getPageIcon = () => {
    switch (postType) {
      case 'short':
        return <Zap className="h-6 w-6 text-pink-500" />;
      case 'video':
        return <Video className="h-6 w-6 text-blue-500" />;
      default:
        return <ImageIcon className="h-6 w-6 text-green-500" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20">
          {getPageIcon()}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{getPageTitle()}</h1>
          <p className="text-muted-foreground">
            {postType === 'short' 
              ? 'Vídeo vertical de até 60 segundos' 
              : postType === 'video' 
                ? 'Compartilhe vídeos com a comunidade'
                : 'Compartilhe fotos com a comunidade'
            }
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Media Upload */}
          <div className="space-y-2">
            <Label>{isVideo ? 'Vídeo' : 'Imagem'} *</Label>
            
            {!mediaPreview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
              >
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">
                  Clique para selecionar ou arraste o arquivo
                </p>
                <p className="text-xs text-muted-foreground">
                  {isVideo ? 'MP4, WebM (máx. 500MB)' : 'JPG, PNG, WebP (máx. 50MB)'}
                </p>
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden bg-black">
                {isVideo ? (
                  <video
                    src={mediaPreview}
                    controls
                    className="w-full max-h-[400px] object-contain"
                  />
                ) : (
                  <img
                    src={mediaPreview}
                    alt="Preview"
                    className="w-full max-h-[400px] object-contain"
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
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptTypes}
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label>Título</Label>
            <Input
              placeholder="Dê um título para sua publicação..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              placeholder="Descreva sua publicação..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.emoji} {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Hashtags */}
          <div className="space-y-2">
            <Label>Hashtags</Label>
            <Input
              placeholder="#investimentos #finanças #dicas"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Separe as hashtags com espaços ou vírgulas
            </p>
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate(-1)}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={isUploading || (!mediaFile && !description.trim())}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Publicando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Publicar
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
