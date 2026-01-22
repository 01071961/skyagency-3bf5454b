import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Video,
  Camera,
  X,
  Loader2,
  Check,
  AlertCircle,
  Play,
  Image as ImageIcon,
  Settings,
  Globe,
  Lock,
  Users,
  Smartphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
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
import { useAuth } from '@/auth';

type VideoType = 'video' | 'short';
type VideoPrivacy = 'public' | 'students' | 'vip' | 'private';

interface VideoUploaderProps {
  type?: VideoType;
  onUploadComplete?: (video: { id: string; url: string; thumbnailUrl: string }) => void;
  trigger?: React.ReactNode;
  maxDuration?: number; // in seconds
}

export function VideoUploader({
  type = 'video',
  onUploadComplete,
  trigger,
  maxDuration,
}: VideoUploaderProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState<VideoPrivacy>('public');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const isShort = type === 'short';
  const maxAllowedDuration = maxDuration || (isShort ? 60 : 3600); // 60s for shorts, 1h for videos

  const handleFileSelect = useCallback((selectedFile: File) => {
    if (!selectedFile.type.startsWith('video/')) {
      toast.error('Selecione um arquivo de vídeo válido');
      return;
    }

    // Check file size (max 5GB)
    if (selectedFile.size > 5 * 1024 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo: 5GB');
      return;
    }

    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);

    // Get video duration
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      setVideoDuration(video.duration);

      if (video.duration > maxAllowedDuration) {
        setError(`Duração máxima: ${formatDuration(maxAllowedDuration)}`);
      } else {
        setError(null);
      }

      // Auto-generate thumbnail at 1 second
      video.currentTime = 1;
    };
    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          setThumbnailPreview(URL.createObjectURL(blob));
        }
      }, 'image/jpeg', 0.8);
    };
    video.src = url;
  }, [maxAllowedDuration]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith('image/')) {
        toast.error('Selecione uma imagem válida');
        return;
      }
      setThumbnail(selectedFile);
      setThumbnailPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, [handleFileSelect]);

  const handleUpload = async () => {
    if (!file || !user) {
      toast.error('Selecione um vídeo para enviar');
      return;
    }

    if (!title.trim()) {
      toast.error('Digite um título para o vídeo');
      return;
    }

    if (videoDuration > maxAllowedDuration) {
      toast.error(`Duração máxima permitida: ${formatDuration(maxAllowedDuration)}`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${timestamp}.${fileExt}`;

      // Upload video
      const { data: videoData, error: uploadError } = await supabase.storage
        .from('videos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;
      setUploadProgress(70);

      // Get public URL
      const { data: { publicUrl: videoUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(filePath);

      // Upload thumbnail if exists
      let thumbnailUrl = '';
      if (thumbnail || thumbnailPreview) {
        const thumbBlob = thumbnail || await fetch(thumbnailPreview!).then(r => r.blob());
        const thumbPath = `${user.id}/${timestamp}_thumb.jpg`;
        
        const { error: thumbError } = await supabase.storage
          .from('videos')
          .upload(thumbPath, thumbBlob, {
            cacheControl: '3600',
            upsert: false,
          });

        if (!thumbError) {
          const { data: { publicUrl } } = supabase.storage
            .from('videos')
            .getPublicUrl(thumbPath);
          thumbnailUrl = publicUrl;
        }
      }
      setUploadProgress(85);

      // Create video record
      const { data: videoRecord, error: dbError } = await supabase
        .from('videos')
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: description.trim(),
          type: isShort ? 'short' : 'video',
          privacy,
          status: 'ready',
          storage_type: 'internal',
          storage_url: videoUrl,
          thumbnail_url: thumbnailUrl,
          duration: Math.round(videoDuration),
          file_size: file.size,
          mime_type: file.type,
        })
        .select()
        .single();

      if (dbError) throw dbError;
      setUploadProgress(100);

      toast.success(isShort ? 'Short publicado!' : 'Vídeo publicado!');
      onUploadComplete?.({
        id: videoRecord.id,
        url: videoUrl,
        thumbnailUrl,
      });

      // Reset form
      resetForm();
      setIsOpen(false);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Erro no upload: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setPreviewUrl(null);
    setThumbnail(null);
    setThumbnailPreview(null);
    setTitle('');
    setDescription('');
    setPrivacy('public');
    setVideoDuration(0);
    setError(null);
    setUploadProgress(0);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const defaultTrigger = (
    <Button className={isShort ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-primary'}>
      {isShort ? <Smartphone className="h-4 w-4 mr-2" /> : <Video className="h-4 w-4 mr-2" />}
      {isShort ? 'Novo Short' : 'Enviar Vídeo'}
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isShort ? (
              <Smartphone className="h-5 w-5 text-purple-500" />
            ) : (
              <Video className="h-5 w-5 text-primary" />
            )}
            {isShort ? 'Publicar Short' : 'Enviar Vídeo'}
          </DialogTitle>
          <DialogDescription>
            {isShort 
              ? 'Vídeo vertical até 60 segundos' 
              : 'Upload de vídeo para a plataforma'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Upload Area */}
          {!previewUrl ? (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Arraste um vídeo ou clique para selecionar
              </p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" size="sm" onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}>
                  <Upload className="h-4 w-4 mr-2" />
                  Arquivo
                </Button>
                <Button variant="outline" size="sm" onClick={(e) => {
                  e.stopPropagation();
                  cameraInputRef.current?.click();
                }}>
                  <Camera className="h-4 w-4 mr-2" />
                  Câmera
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="video/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Video Preview */}
              <div className={`relative rounded-xl overflow-hidden bg-black ${isShort ? 'aspect-[9/16] max-h-[300px] mx-auto' : 'aspect-video'}`}>
                <video
                  src={previewUrl}
                  className="w-full h-full object-contain"
                  controls
                />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={() => {
                    setFile(null);
                    setPreviewUrl(null);
                    setVideoDuration(0);
                    setError(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
                <Badge className="absolute bottom-2 left-2 bg-black/70">
                  {formatDuration(videoDuration)}
                </Badge>
              </div>

              {/* Duration Error */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Form Fields */}
          {previewUrl && !error && (
            <>
              <div className="space-y-2">
                <Label>Título *</Label>
                <Input
                  placeholder={isShort ? 'Título do Short' : 'Título do vídeo'}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  placeholder="Descreva o conteúdo..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Thumbnail */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Miniatura
                </Label>
                <div className="flex gap-4 items-center">
                  {thumbnailPreview && (
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail"
                      className="w-24 h-14 object-cover rounded"
                    />
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => thumbnailInputRef.current?.click()}
                  >
                    Alterar miniatura
                  </Button>
                  <input
                    ref={thumbnailInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Privacy */}
              <div className="space-y-2">
                <Label>Visibilidade</Label>
                <Select value={privacy} onValueChange={(v) => setPrivacy(v as VideoPrivacy)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">
                      <span className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Público
                      </span>
                    </SelectItem>
                    <SelectItem value="students">
                      <span className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Apenas alunos
                      </span>
                    </SelectItem>
                    <SelectItem value="vip">
                      <span className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Apenas VIP
                      </span>
                    </SelectItem>
                    <SelectItem value="private">
                      <span className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Privado
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Enviando...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              resetForm();
              setIsOpen(false);
            }}
            disabled={isUploading}
          >
            Cancelar
          </Button>
          <Button
            className={`flex-1 ${isShort ? 'bg-gradient-to-r from-purple-500 to-pink-500' : ''}`}
            onClick={handleUpload}
            disabled={!file || !title.trim() || !!error || isUploading}
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Publicar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
