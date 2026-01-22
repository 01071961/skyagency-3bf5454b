import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Video, Zap, Sparkles, Cloud, HardDrive, Check, Loader2, AlertCircle, Camera, Upload, X, Image as ImageIcon, Globe, Lock, Users, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
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
import { useState, useRef, useCallback, useEffect } from 'react';

type VideoType = 'video' | 'short';
type VideoPrivacy = 'public' | 'students' | 'vip' | 'private';
type StorageDestination = 'drive' | 'internal';

export default function VideoUploadPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const type = searchParams.get('type');
  const isShort = type === 'short';

  const handleUploadComplete = (data: { id: string; url: string; thumbnailUrl: string }) => {
    toast.success(isShort ? 'Short publicado com sucesso!' : 'Vídeo publicado com sucesso!');
    if (isShort) {
      navigate('/shorts');
    } else {
      navigate(`/videos/${data.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl bg-gradient-to-br ${isShort ? 'from-purple-500 to-pink-500' : 'from-blue-500 to-cyan-500'}`}>
              {isShort ? (
                <Zap className="h-5 w-5 text-white" />
              ) : (
                <Video className="h-5 w-5 text-white" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                {isShort ? 'Criar Short' : 'Enviar Vídeo'}
                <Sparkles className="h-4 w-4 text-yellow-400" />
              </h1>
              <p className="text-sm text-muted-foreground">
                {isShort ? 'Vídeo vertical até 60 segundos' : 'Compartilhe com a comunidade'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-6 bg-card/50 backdrop-blur border-border/50">
            {/* Type Selection (if not specified) */}
            {!type && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4">Escolha o tipo de vídeo</h2>
                <div className="grid grid-cols-2 gap-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/videos/upload?type=short')}
                    className="p-6 rounded-xl border-2 border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10 transition-colors text-left"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
                      <Zap className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold mb-1">Short</h3>
                    <p className="text-sm text-muted-foreground">Vídeo vertical até 60s</p>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/videos/upload?type=video')}
                    className="p-6 rounded-xl border-2 border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 transition-colors text-left"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4">
                      <Video className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold mb-1">Vídeo</h3>
                    <p className="text-sm text-muted-foreground">Vídeos mais longos</p>
                  </motion.button>
                </div>
              </div>
            )}
            
            {/* Direct Uploader (inline, not dialog) */}
            {type && <InlineVideoUploader type={isShort ? 'short' : 'video'} onComplete={handleUploadComplete} />}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

interface InlineVideoUploaderProps {
  type: VideoType;
  onComplete: (data: { id: string; url: string; thumbnailUrl: string }) => void;
}

function InlineVideoUploader({ type, onComplete }: InlineVideoUploaderProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
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
  
  // Google Drive as default
  const [driveConnected, setDriveConnected] = useState(false);
  const [driveFolderId, setDriveFolderId] = useState<string | null>(null);
  const [storageDestination, setStorageDestination] = useState<StorageDestination>('drive');
  const [showConnectPrompt, setShowConnectPrompt] = useState(false);

  const isShort = type === 'short';
  const maxAllowedDuration = isShort ? 60 : 3600;

  // Check Drive connection
  useEffect(() => {
    const checkDriveConnection = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('drive_connected')
        .eq('user_id', user.id)
        .single();
      
      const connected = data?.drive_connected || false;
      setDriveConnected(connected);
      
      if (!connected) {
        setStorageDestination('internal');
        setShowConnectPrompt(true);
      } else {
        setStorageDestination('drive');
      }
    };
    
    checkDriveConnection();
  }, [user]);

  // Initialize Drive folder
  useEffect(() => {
    const initDriveFolder = async () => {
      if (!driveConnected || !user || driveFolderId) return;
      
      try {
        const { data } = await supabase.functions.invoke('google-drive-manager', {
          body: { action: 'create-root-folder', user_id: user.id }
        });
        
        if (data?.folderId) {
          setDriveFolderId(data.folderId);
        }
      } catch (error) {
        console.error('Error initializing Drive folder:', error);
      }
    };
    
    initDriveFolder();
  }, [driveConnected, user, driveFolderId]);

  const handleConnectDrive = async () => {
    if (!user) {
      toast.error('Você precisa estar logado');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('google-drive-manager', {
        body: { action: 'get-auth-url', user_id: user.id, origin: window.location.origin }
      });

      if (error) throw error;
      
      if (data?.authUrl) {
        sessionStorage.setItem('drive_oauth_return', window.location.pathname + window.location.search);
        window.location.href = data.authUrl;
      }
    } catch (error: any) {
      toast.error('Erro ao conectar Google Drive');
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const handleFileSelect = useCallback((selectedFile: File) => {
    if (!selectedFile.type.startsWith('video/')) {
      toast.error('Selecione um arquivo de vídeo válido');
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo: 5GB');
      return;
    }

    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);

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

    // Force Drive connection if Drive is selected but not connected
    if (storageDestination === 'drive' && !driveConnected) {
      setShowConnectPrompt(true);
      toast.error('Conecte seu Google Drive primeiro');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      let videoUrl = '';
      let storageType: 'internal' | 'drive' = 'internal';

      if (storageDestination === 'drive' && driveFolderId) {
        // Upload to Google Drive (DEFAULT)
        setUploadProgress(20);
        
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        setUploadProgress(40);

        const { data, error } = await supabase.functions.invoke('google-drive-manager', {
          body: {
            action: 'upload',
            user_id: user.id,
            folderId: driveFolderId,
            file_name: `${title.trim()}_${timestamp}.${fileExt}`,
            file_data: base64,
            file_mime: file.type || 'video/mp4',
          },
        });

        if (error) throw error;
        
        if (data?.file?.webViewLink) {
          videoUrl = data.file.webViewLink;
          storageType = 'drive';
        }
        setUploadProgress(70);
      } else {
        // Upload to Internal Storage
        const filePath = `${user.id}/${timestamp}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('videos')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;
        setUploadProgress(70);

        const { data: { publicUrl } } = supabase.storage
          .from('videos')
          .getPublicUrl(filePath);

        videoUrl = publicUrl;
        storageType = 'internal';
      }

      // Upload thumbnail
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
          storage_type: storageType,
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

      toast.success(
        storageType === 'drive' 
          ? '✓ Vídeo salvo no Google Drive!' 
          : 'Vídeo salvo no armazenamento interno!'
      );

      onComplete({
        id: videoRecord.id,
        url: videoUrl,
        thumbnailUrl,
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Erro no upload: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Storage Preference */}
      <div className={`flex items-center gap-3 p-4 rounded-xl border ${
        driveConnected 
          ? 'bg-blue-500/10 border-blue-500/30' 
          : 'bg-amber-500/10 border-amber-500/30'
      }`}>
        {driveConnected ? (
          <>
            <Cloud className="h-5 w-5 text-blue-500" />
            <div className="flex-1">
              <p className="font-medium text-blue-600 dark:text-blue-400">
                Preferência: Google Drive (ilimitado e sincronizado)
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Você pode mudar para armazenamento interno se preferir velocidade máxima.
              </p>
            </div>
            <Check className="h-5 w-5 text-blue-500" />
          </>
        ) : (
          <>
            <HardDrive className="h-5 w-5 text-amber-500" />
            <div className="flex-1">
              <p className="font-medium text-amber-600 dark:text-amber-400">
                Usando: Storage Interno (15GB)
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Conecte o Google Drive para armazenamento ilimitado.
              </p>
            </div>
            <Button size="sm" onClick={handleConnectDrive} className="bg-blue-500 hover:bg-blue-600">
              <Cloud className="h-4 w-4 mr-1" />
              Conectar Drive
            </Button>
          </>
        )}
      </div>

      {/* Connect Drive Prompt */}
      {showConnectPrompt && !driveConnected && (
        <Alert className="bg-blue-500/10 border-blue-500/30">
          <Cloud className="h-4 w-4 text-blue-500" />
          <AlertDescription>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="font-medium">Conecte seu Google Drive agora</p>
                <p className="text-sm text-muted-foreground">Armazenamento ilimitado e sincronizado em todos os dispositivos.</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="outline" onClick={() => {
                  setShowConnectPrompt(false);
                  setStorageDestination('internal');
                }}>
                  Usar Interno
                </Button>
                <Button size="sm" onClick={handleConnectDrive} className="bg-blue-500 hover:bg-blue-600">
                  <Cloud className="h-4 w-4 mr-1" />
                  Conectar Drive
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Storage Selector (when Drive is connected) */}
      {driveConnected && (
        <div className="flex gap-3">
          <Button
            variant={storageDestination === 'drive' ? 'default' : 'outline'}
            className={storageDestination === 'drive' ? 'bg-blue-500 hover:bg-blue-600 flex-1' : 'flex-1'}
            onClick={() => setStorageDestination('drive')}
          >
            <Cloud className="h-4 w-4 mr-2" />
            Google Drive
            {storageDestination === 'drive' && <Check className="h-4 w-4 ml-2" />}
          </Button>
          <Button
            variant={storageDestination === 'internal' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => setStorageDestination('internal')}
          >
            <HardDrive className="h-4 w-4 mr-2" />
            Interno
            {storageDestination === 'internal' && <Check className="h-4 w-4 ml-2" />}
          </Button>
        </div>
      )}

      {/* Upload Area */}
      {!previewUrl ? (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-muted-foreground/30 rounded-2xl p-12 text-center hover:border-primary/50 transition-colors cursor-pointer bg-muted/20"
          onClick={() => fileInputRef.current?.click()}
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Upload className="h-16 w-16 mx-auto text-muted-foreground mb-6" />
          </motion.div>
          <h3 className="text-lg font-semibold mb-2">
            {isShort ? 'Envie seu Short' : 'Envie seu Vídeo'}
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Arraste um vídeo ou clique para selecionar
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button variant="outline" size="lg" onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}>
              <Upload className="h-5 w-5 mr-2" />
              Selecionar Arquivo
            </Button>
            <Button variant="outline" size="lg" onClick={(e) => {
              e.stopPropagation();
              cameraInputRef.current?.click();
            }}>
              <Camera className="h-5 w-5 mr-2" />
              Usar Câmera
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            {isShort ? 'Vídeo vertical • Máx. 60 segundos • Até 5GB' : 'Até 1 hora • Até 5GB'}
          </p>
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
        <div className="space-y-6">
          {/* Video Preview */}
          <div className={`relative rounded-2xl overflow-hidden bg-black ${isShort ? 'aspect-[9/16] max-h-[400px] mx-auto' : 'aspect-video'}`}>
            <video
              src={previewUrl}
              className="w-full h-full object-contain"
              controls
            />
            <Button
              size="icon"
              variant="destructive"
              className="absolute top-3 right-3"
              onClick={() => {
                setFile(null);
                setPreviewUrl(null);
                setVideoDuration(0);
                setError(null);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
            <Badge className="absolute bottom-3 left-3 bg-black/70 text-white">
              {formatDuration(videoDuration)}
            </Badge>
          </div>

          {/* Duration Error */}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Form Fields */}
          {!error && (
            <>
              <div className="space-y-2">
                <Label className="text-base">Título *</Label>
                <Input
                  placeholder={isShort ? 'Título do Short' : 'Título do vídeo'}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-12 text-base"
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground text-right">{title.length}/100</p>
              </div>

              <div className="space-y-2">
                <Label className="text-base">Descrição</Label>
                <Textarea
                  placeholder="Descreva o conteúdo do seu vídeo..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="text-base"
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground text-right">{description.length}/500</p>
              </div>

              {/* Thumbnail */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-base">
                  <ImageIcon className="h-4 w-4" />
                  Miniatura
                </Label>
                <div className="flex gap-4 items-center">
                  {thumbnailPreview && (
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail"
                      className="w-32 h-20 object-cover rounded-lg border"
                    />
                  )}
                  <Button
                    variant="outline"
                    onClick={() => thumbnailInputRef.current?.click()}
                  >
                    {thumbnailPreview ? 'Alterar' : 'Escolher'} miniatura
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
                <Label className="text-base">Visibilidade</Label>
                <Select value={privacy} onValueChange={(v) => setPrivacy(v as VideoPrivacy)}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">
                      <span className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Público - Todos podem ver
                      </span>
                    </SelectItem>
                    <SelectItem value="students">
                      <span className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Apenas alunos matriculados
                      </span>
                    </SelectItem>
                    <SelectItem value="vip">
                      <span className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Apenas membros VIP
                      </span>
                    </SelectItem>
                    <SelectItem value="private">
                      <span className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Privado - Apenas eu
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-3 p-4 bg-primary/5 rounded-xl border border-primary/20">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enviando para {storageDestination === 'drive' ? 'Google Drive' : 'Storage Interno'}...
                    </span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-3" />
                </div>
              )}

              {/* Submit Button */}
              <Button
                size="lg"
                className={`w-full h-14 text-lg font-semibold ${
                  storageDestination === 'drive' 
                    ? 'bg-blue-500 hover:bg-blue-600' 
                    : isShort 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                      : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                }`}
                onClick={handleUpload}
                disabled={isUploading || !file || !title.trim()}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Publicando...
                  </>
                ) : (
                  <>
                    {storageDestination === 'drive' ? <Cloud className="h-5 w-5 mr-2" /> : isShort ? <Zap className="h-5 w-5 mr-2" /> : <Video className="h-5 w-5 mr-2" />}
                    Publicar {isShort ? 'Short' : 'Vídeo'}
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
