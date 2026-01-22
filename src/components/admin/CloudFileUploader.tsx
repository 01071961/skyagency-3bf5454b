import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  Upload, X, File, Video, FileText, Loader2, ExternalLink, 
  FolderOpen, Cloud, HardDrive, Link2, AlertCircle, Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import StorageFilePicker from './StorageFilePicker';

interface CloudFileUploaderProps {
  value: string;
  onChange: (url: string, fileName?: string) => void;
  accept?: string;
  maxSizeMB?: number;
  bucket?: string;
  folder?: string;
  label?: string;
  placeholder?: string;
  showUrlInput?: boolean;
  showStoragePicker?: boolean;
  showCloudOptions?: boolean;
}

const FILE_ICONS: Record<string, typeof File> = {
  'video': Video,
  'application/pdf': FileText,
  'default': File,
};

export default function CloudFileUploader({
  value,
  onChange,
  accept = '*/*',
  maxSizeMB = 100,
  bucket = 'product-content',
  folder = 'uploads',
  label = 'Arquivo',
  placeholder = 'Cole uma URL ou faça upload',
  showUrlInput = true,
  showStoragePicker = true,
  showCloudOptions = true,
}: CloudFileUploaderProps) {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [urlInput, setUrlInput] = useState(value || '');
  const [driveConnected, setDriveConnected] = useState(false);
  const [driveFolderId, setDriveFolderId] = useState<string | null>(null);
  // Google Drive is now the DEFAULT when connected
  const [uploadDestination, setUploadDestination] = useState<'internal' | 'drive'>('drive');
  const [showConnectPrompt, setShowConnectPrompt] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if Google Drive is connected
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
      
      // If Drive is not connected, fallback to internal
      if (!connected) {
        setUploadDestination('internal');
      } else {
        setUploadDestination('drive'); // Drive is default when connected
      }
    };
    
    checkDriveConnection();
  }, [user]);

  // Initialize Drive folder when connected
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

  const getFileIcon = (url: string) => {
    if (url.includes('.mp4') || url.includes('.webm') || url.includes('.mov') || url.includes('youtube') || url.includes('vimeo')) {
      return Video;
    }
    if (url.includes('.pdf')) {
      return FileText;
    }
    return File;
  };

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
        sessionStorage.setItem('drive_oauth_return', window.location.pathname);
        window.location.href = data.authUrl;
      }
    } catch (error: any) {
      toast.error('Erro ao conectar Google Drive');
    }
  };

  const handleUploadClick = () => {
    // If Drive is the default but not connected, show connect prompt
    if (!driveConnected) {
      setShowConnectPrompt(true);
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`Arquivo muito grande. Máximo: ${maxSizeMB}MB`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      if (uploadDestination === 'internal') {
        // Upload to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(data.path);

        onChange(publicUrl, file.name);
        setUrlInput(publicUrl);
        toast.success('Arquivo enviado para o Storage Interno!');
      } else if (uploadDestination === 'drive' && driveFolderId) {
        // Upload to Google Drive (DEFAULT)
        setUploadProgress(30);
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = reader.result as string;
          setUploadProgress(50);

          const { data, error } = await supabase.functions.invoke('google-drive-manager', {
            body: {
              action: 'upload',
              user_id: user.id,
              folderId: driveFolderId,
              file_name: file.name,
              file_data: base64,
              file_mime: file.type || 'application/octet-stream',
            },
          });

          if (error) throw error;
          setUploadProgress(90);
          
          if (data?.file?.webViewLink) {
            onChange(data.file.webViewLink, file.name);
            setUrlInput(data.file.webViewLink);
            toast.success('✓ Arquivo enviado para o Google Drive!');
          }
          
          setUploadProgress(100);
          setIsUploading(false);
        };
        reader.onerror = () => {
          toast.error('Erro ao ler arquivo');
          setIsUploading(false);
        };
        reader.readAsDataURL(file);
        return;
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Erro ao enviar arquivo');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUrlChange = (url: string) => {
    setUrlInput(url);
    onChange(url);
  };

  const handleClear = () => {
    setUrlInput('');
    onChange('');
  };

  const FileIcon = value ? getFileIcon(value) : File;
  
  const isImage = value && (
    value.includes('.jpg') || 
    value.includes('.jpeg') || 
    value.includes('.png') || 
    value.includes('.gif') || 
    value.includes('.webp') ||
    value.includes('.svg') ||
    accept.includes('image')
  );

  return (
    <div className="space-y-3">
      {label && <Label className="text-sm font-medium">{label}</Label>}
      
      {/* Storage Preference Indicator */}
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg text-xs",
        driveConnected 
          ? "bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400"
          : "bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400"
      )}>
        {driveConnected ? (
          <>
            <Cloud className="h-4 w-4" />
            <span>Preferência: <strong>Google Drive</strong> (ilimitado e sincronizado)</span>
          </>
        ) : (
          <>
            <HardDrive className="h-4 w-4" />
            <span>Storage Interno (15GB) • <button onClick={handleConnectDrive} className="underline font-medium">Conectar Google Drive</button></span>
          </>
        )}
      </div>

      {/* Connect Drive Prompt */}
      {showConnectPrompt && !driveConnected && (
        <Alert className="bg-blue-500/10 border-blue-500/30">
          <Cloud className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-sm">
            <div className="flex items-center justify-between gap-4">
              <span>Conecte seu Google Drive para armazenamento ilimitado e sincronizado.</span>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="outline" onClick={() => setShowConnectPrompt(false)}>
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
      
      <div className="space-y-3">
        {/* URL Input */}
        {showUrlInput && (
          <div className="flex gap-2">
            <Input
              value={urlInput}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder={placeholder}
              disabled={isUploading}
              className="flex-1 min-w-0 text-xs"
            />
            {value && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleClear}
                className="shrink-0 h-9 w-9"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}

        {/* Upload Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {/* Cloud Upload Dropdown */}
          {showCloudOptions ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant={driveConnected ? "default" : "outline"}
                  size="sm"
                  disabled={isUploading}
                  className={cn("flex-1", driveConnected && "bg-blue-500 hover:bg-blue-600")}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      {driveConnected ? <Cloud className="w-4 h-4 mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                      {driveConnected ? 'Enviar para Drive' : 'Fazer Upload'}
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                {/* Google Drive First (Default) */}
                {driveConnected ? (
                  <DropdownMenuItem 
                    onClick={() => {
                      setUploadDestination('drive');
                      fileInputRef.current?.click();
                    }}
                    className="bg-blue-500/10"
                  >
                    <Cloud className="w-4 h-4 mr-2 text-blue-500" />
                    <div className="flex-1">
                      <div className="font-medium">Google Drive</div>
                      <div className="text-xs text-muted-foreground">Recomendado • Ilimitado</div>
                    </div>
                    <Check className="w-4 h-4 text-blue-500" />
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={handleConnectDrive} className="text-blue-500">
                    <Cloud className="w-4 h-4 mr-2" />
                    <div className="flex-1">
                      <div className="font-medium">Conectar Google Drive</div>
                      <div className="text-xs text-muted-foreground">Armazenamento ilimitado</div>
                    </div>
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuSeparator />
                
                {/* Internal Storage Second */}
                <DropdownMenuItem 
                  onClick={() => {
                    setUploadDestination('internal');
                    fileInputRef.current?.click();
                  }}
                >
                  <HardDrive className="w-4 h-4 mr-2" />
                  <div className="flex-1">
                    <div>Storage Interno</div>
                    <div className="text-xs text-muted-foreground">Velocidade máxima • 15GB</div>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUploadClick}
              disabled={isUploading}
              className="flex-1"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Fazer Upload
                </>
              )}
            </Button>
          )}
          
          {/* Storage Picker Button */}
          {showStoragePicker && (
            <StorageFilePicker
              bucket={bucket}
              folder={folder}
              accept={accept !== '*/*' ? accept.split(',').map(a => a.trim()) : undefined}
              onSelect={(url, fileName) => {
                onChange(url, fileName);
                setUrlInput(url);
              }}
              trigger={
                <Button type="button" variant="secondary" size="sm">
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Storage
                </Button>
              }
            />
          )}
        </div>

        {/* Progress Bar */}
        {isUploading && (
          <div className="space-y-1">
            <Progress value={uploadProgress} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              Enviando para {uploadDestination === 'drive' ? 'Google Drive' : 'Storage Interno'}...
            </p>
          </div>
        )}

        {/* Preview */}
        {value && (
          <div className="space-y-2">
            {/* Image Preview */}
            {isImage && (
              <div className="relative rounded-lg overflow-hidden border bg-muted/20 aspect-video">
                <img 
                  src={value} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2">
                  <p className="text-xs text-white/90 truncate flex-1">
                    {value.split('/').pop()?.substring(0, 30)}...
                  </p>
                  <a 
                    href={value} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="shrink-0"
                  >
                    <Button type="button" variant="secondary" size="sm" className="h-7 px-2">
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </a>
                </div>
              </div>
            )}
            
            {/* File Info (for non-images) */}
            {!isImage && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
                <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center shrink-0">
                  <FileIcon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {value.split('/').pop()}
                  </p>
                  <p className="text-xs text-muted-foreground break-all line-clamp-2">
                    {value}
                  </p>
                </div>
                <a 
                  href={value} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="shrink-0"
                >
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {driveConnected 
          ? "Você pode mudar para armazenamento interno se preferir velocidade máxima na plataforma."
          : "Conecte seu Google Drive para armazenamento ilimitado e sincronizado."
        }
      </p>
    </div>
  );
}
