import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  FolderOpen, 
  File, 
  Video, 
  Image, 
  FileText, 
  Music, 
  Search,
  Loader2,
  Check,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StorageFile {
  name: string;
  id: string;
  metadata?: {
    mimetype?: string;
    size?: number;
  };
  created_at?: string;
}

interface StorageFilePickerProps {
  bucket?: string;
  folder?: string;
  accept?: string[];
  onSelect: (url: string, fileName: string) => void;
  trigger?: React.ReactNode;
}

const getFileIcon = (name: string, mimeType?: string) => {
  const ext = name.split('.').pop()?.toLowerCase();
  
  if (mimeType?.startsWith('video/') || ['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext || '')) {
    return <Video className="w-5 h-5 text-purple-500" />;
  }
  if (mimeType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) {
    return <Image className="w-5 h-5 text-green-500" />;
  }
  if (mimeType?.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a'].includes(ext || '')) {
    return <Music className="w-5 h-5 text-amber-500" />;
  }
  if (ext === 'pdf' || mimeType === 'application/pdf') {
    return <FileText className="w-5 h-5 text-red-500" />;
  }
  return <File className="w-5 h-5 text-muted-foreground" />;
};

const formatFileSize = (bytes?: number) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function StorageFilePicker({
  bucket = 'affiliate-files',
  folder = '',
  accept,
  onSelect,
  trigger
}: StorageFilePickerProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState(folder);
  const [search, setSearch] = useState('');
  const [selectedFile, setSelectedFile] = useState<StorageFile | null>(null);

  const fetchFiles = async (path: string = currentPath) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(path, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) throw error;

      // Separate folders and files
      const folderItems: string[] = [];
      const fileItems: StorageFile[] = [];

      data?.forEach(item => {
        if (item.id === null) {
          // It's a folder
          folderItems.push(item.name);
        } else {
          // It's a file
          fileItems.push(item as StorageFile);
        }
      });

      setFolders(folderItems);
      setFiles(fileItems);
    } catch (error) {
      console.error('Error fetching storage files:', error);
      toast.error('Erro ao carregar arquivos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchFiles(currentPath);
    }
  }, [open, currentPath]);

  const handleFolderClick = (folderName: string) => {
    const newPath = currentPath ? `${currentPath}/${folderName}` : folderName;
    setCurrentPath(newPath);
  };

  const handleBack = () => {
    const parts = currentPath.split('/');
    parts.pop();
    setCurrentPath(parts.join('/'));
  };

  const handleSelectFile = (file: StorageFile) => {
    setSelectedFile(file);
  };

  const handleConfirm = () => {
    if (!selectedFile) return;

    const filePath = currentPath ? `${currentPath}/${selectedFile.name}` : selectedFile.name;
    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    
    onSelect(data.publicUrl, selectedFile.name);
    setOpen(false);
    setSelectedFile(null);
    toast.success('Arquivo selecionado!');
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(search.toLowerCase());
    
    if (accept && accept.length > 0) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      const matchesAccept = accept.some(a => {
        if (a.includes('/')) {
          // MIME type
          return file.metadata?.mimetype?.startsWith(a.replace('/*', ''));
        }
        // Extension
        return a.replace('.', '') === ext;
      });
      return matchesSearch && matchesAccept;
    }
    
    return matchesSearch;
  });

  const filteredFolders = folders.filter(f => 
    f.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button type="button" variant="outline" size="sm">
            <FolderOpen className="w-4 h-4 mr-2" />
            Selecionar do Storage
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            Gerencie Seus Arquivos
          </DialogTitle>
        </DialogHeader>

        {/* Search and Navigation */}
        <div className="flex items-center gap-2 mb-4">
          {currentPath && (
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar arquivos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="ghost" size="icon" onClick={() => fetchFiles()}>
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </Button>
        </div>

        {/* Current Path */}
        {currentPath && (
          <div className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
            <span className="font-medium">Caminho:</span>
            <code className="bg-muted px-2 py-0.5 rounded text-xs">{currentPath}</code>
          </div>
        )}

        {/* File List */}
        <ScrollArea className="h-[400px] border rounded-lg">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {/* Folders */}
              {filteredFolders.map((folderName) => (
                <button
                  key={folderName}
                  onClick={() => handleFolderClick(folderName)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                >
                  <FolderOpen className="w-5 h-5 text-amber-500" />
                  <span className="font-medium">{folderName}</span>
                </button>
              ))}

              {/* Files */}
              {filteredFiles.map((file) => (
                <button
                  key={file.id}
                  onClick={() => handleSelectFile(file)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
                    selectedFile?.id === file.id 
                      ? "bg-primary/10 border border-primary" 
                      : "hover:bg-muted/50"
                  )}
                >
                  {getFileIcon(file.name, file.metadata?.mimetype)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.metadata?.size)}
                      {file.created_at && ` • ${new Date(file.created_at).toLocaleDateString('pt-BR')}`}
                    </p>
                  </div>
                  {selectedFile?.id === file.id && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </button>
              ))}

              {/* Empty State */}
              {filteredFiles.length === 0 && filteredFolders.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <File className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum arquivo encontrado</p>
                  {search && <p className="text-sm mt-1">Tente outra busca</p>}
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Selected File Preview */}
        {selectedFile && (
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              {getFileIcon(selectedFile.name, selectedFile.metadata?.mimetype)}
              <div>
                <p className="font-medium text-sm">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(selectedFile.metadata?.size)}
                </p>
              </div>
            </div>
            <Button onClick={handleConfirm}>
              <Check className="w-4 h-4 mr-2" />
              Selecionar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}