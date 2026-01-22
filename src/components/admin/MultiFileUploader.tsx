import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  Upload, X, File, FileText, Loader2, ExternalLink, 
  Plus, Link2, Cloud, HardDrive
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DownloadFile {
  url: string;
  name: string;
  type?: string; // 'upload' | 'googledrive' | 'onedrive' | 'link'
}

interface MultiFileUploaderProps {
  value: DownloadFile[];
  onChange: (files: DownloadFile[]) => void;
  accept?: string;
  maxSizeMB?: number;
  bucket?: string;
  folder?: string;
  label?: string;
}

const getFileIcon = (file: DownloadFile) => {
  const url = file.url.toLowerCase();
  if (url.includes('.pdf')) return FileText;
  if (url.includes('drive.google') || url.includes('docs.google')) return Cloud;
  if (url.includes('onedrive') || url.includes('sharepoint')) return HardDrive;
  return File;
};

const getFileType = (url: string): string => {
  if (url.includes('drive.google') || url.includes('docs.google')) return 'googledrive';
  if (url.includes('onedrive') || url.includes('sharepoint') || url.includes('1drv.ms')) return 'onedrive';
  if (url.includes('dropbox.com')) return 'dropbox';
  return 'link';
};

const getDisplayName = (file: DownloadFile): string => {
  if (file.name) return file.name;
  try {
    const url = new URL(file.url);
    const path = url.pathname;
    const fileName = path.split('/').pop();
    return fileName || 'Arquivo';
  } catch {
    return 'Arquivo';
  }
};

export default function MultiFileUploader({
  value = [],
  onChange,
  accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.txt,.csv',
  maxSizeMB = 100,
  bucket = 'product-content',
  folder = 'lessons/materials',
  label = 'Arquivos para Download',
}: MultiFileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkName, setLinkName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    const newFiles: DownloadFile[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file size
        if (file.size > maxSizeMB * 1024 * 1024) {
          toast.error(`${file.name} muito grande. Máximo: ${maxSizeMB}MB`);
          continue;
        }

        setUploadProgress(Math.round(((i + 1) / files.length) * 100));

        const fileExt = file.name.split('.').pop();
        const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (error) {
          console.error('Upload error:', error);
          toast.error(`Erro ao enviar ${file.name}`);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(data.path);

        newFiles.push({
          url: publicUrl,
          name: file.name,
          type: 'upload'
        });
      }

      if (newFiles.length > 0) {
        onChange([...value, ...newFiles]);
        toast.success(`${newFiles.length} arquivo(s) enviado(s)!`);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Erro ao enviar arquivos');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAddLink = () => {
    if (!linkUrl.trim()) {
      toast.error('Cole uma URL válida');
      return;
    }

    const newFile: DownloadFile = {
      url: linkUrl.trim(),
      name: linkName.trim() || getDisplayName({ url: linkUrl, name: '' }),
      type: getFileType(linkUrl)
    };

    onChange([...value, newFile]);
    setLinkUrl('');
    setLinkName('');
    setShowLinkInput(false);
    toast.success('Link adicionado!');
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = [...value];
    newFiles.splice(index, 1);
    onChange(newFiles);
  };

  const handleUpdateFileName = (index: number, newName: string) => {
    const newFiles = [...value];
    newFiles[index] = { ...newFiles[index], name: newName };
    onChange(newFiles);
  };

  return (
    <div className="space-y-4">
      {label && <Label className="text-sm font-medium">{label}</Label>}
      
      {/* File List */}
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((file, index) => {
            const FileIcon = getFileIcon(file);
            return (
              <Card key={index} className="p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded bg-primary/10 flex items-center justify-center shrink-0">
                  <FileIcon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <Input
                    value={file.name}
                    onChange={(e) => handleUpdateFileName(index, e.target.value)}
                    className="h-7 text-sm font-medium"
                    placeholder="Nome do arquivo"
                  />
                  <p className="text-xs text-muted-foreground truncate mt-1">
                    {file.type === 'googledrive' && '📁 Google Drive • '}
                    {file.type === 'onedrive' && '📁 OneDrive • '}
                    {file.type === 'dropbox' && '📁 Dropbox • '}
                    {file.url.substring(0, 50)}...
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <a 
                    href={file.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </a>
                  <Button 
                    type="button"
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleRemoveFile(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <Progress value={uploadProgress} className="h-2" />
      )}

      {/* Link Input */}
      {showLinkInput && (
        <Card className="p-4 space-y-3 border-dashed">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Adicionar Link</span>
          </div>
          <div className="space-y-2">
            <Input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://drive.google.com/... ou qualquer URL"
              className="text-sm"
            />
            <Input
              value={linkName}
              onChange={(e) => setLinkName(e.target.value)}
              placeholder="Nome do arquivo (opcional)"
              className="text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button 
              type="button" 
              size="sm" 
              onClick={handleAddLink}
              disabled={!linkUrl.trim()}
            >
              <Plus className="w-4 h-4 mr-1" />
              Adicionar
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setShowLinkInput(false);
                setLinkUrl('');
                setLinkName('');
              }}
            >
              Cancelar
            </Button>
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
          multiple
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </>
          )}
        </Button>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowLinkInput(true)}
          disabled={showLinkInput}
        >
          <Link2 className="w-4 h-4 mr-2" />
          Link
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Adicione quantos arquivos quiser: upload direto ou links do Google Drive, OneDrive, Dropbox, etc.
      </p>
    </div>
  );
}
