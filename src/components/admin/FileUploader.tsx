import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Upload, X, File, Video, FileText, Loader2, ExternalLink, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import StorageFilePicker from './StorageFilePicker';

interface FileUploaderProps {
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
}

const FILE_ICONS: Record<string, typeof File> = {
  'video': Video,
  'application/pdf': FileText,
  'default': File,
};

export default function FileUploader({
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
}: FileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [urlInput, setUrlInput] = useState(value || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (url: string) => {
    if (url.includes('.mp4') || url.includes('.webm') || url.includes('.mov') || url.includes('youtube') || url.includes('vimeo')) {
      return Video;
    }
    if (url.includes('.pdf')) {
      return FileText;
    }
    return File;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`Arquivo muito grande. Máximo: ${maxSizeMB}MB`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      onChange(publicUrl, file.name);
      setUrlInput(publicUrl);
      toast.success('Arquivo enviado com sucesso!');
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
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
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
          <Progress value={uploadProgress} className="h-2" />
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
        Upload ou cole URL externa (YouTube, Vimeo, Google Drive, etc.)
      </p>
    </div>
  );
}
