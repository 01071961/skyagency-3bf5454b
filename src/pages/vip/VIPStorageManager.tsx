import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Upload, Folder, FolderPlus, Image, Video, FileText, 
  Download, Trash2, Search, Grid, List, Eye, MoreVertical,
  File, Music, Archive, RefreshCw, HardDrive, Filter
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface StorageFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

interface StorageFolder {
  name: string;
  path: string;
}

const BUCKET_NAME = 'affiliate-files';

const fileTypeIcons: Record<string, React.ElementType> = {
  image: Image,
  video: Video,
  audio: Music,
  document: FileText,
  archive: Archive,
  default: File
};

const getFileCategory = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return 'archive';
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return 'document';
  return 'default';
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const VIPStorageManager = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [folders, setFolders] = useState<StorageFolder[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFile, setSelectedFile] = useState<StorageFile | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [storageUsage, setStorageUsage] = useState({ used: 0, total: 104857600 }); // 100MB limit

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadFiles();
    calculateStorageUsage();
  }, [user, currentPath]);

  const getUserBasePath = () => {
    return user?.id || '';
  };

  const getFullPath = () => {
    const basePath = getUserBasePath();
    return currentPath ? `${basePath}/${currentPath}` : basePath;
  };

  const loadFiles = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const fullPath = getFullPath();
      
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list(fullPath, {
          limit: 100,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (error) throw error;

      const folderList: StorageFolder[] = [];
      const fileList: StorageFile[] = [];

      for (const item of data || []) {
        if (item.id === null) {
          // It's a folder
          folderList.push({
            name: item.name,
            path: currentPath ? `${currentPath}/${item.name}` : item.name
          });
        } else {
          // It's a file
          const { data: urlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(`${fullPath}/${item.name}`);

          fileList.push({
            id: item.id,
            name: item.name,
            size: item.metadata?.size || 0,
            type: item.metadata?.mimetype || 'application/octet-stream',
            url: urlData.publicUrl,
            created_at: item.created_at || new Date().toISOString(),
            metadata: item.metadata
          });
        }
      }

      setFolders(folderList);
      setFiles(fileList);
    } catch (error) {
      console.error('Error loading files:', error);
      toast.error('Erro ao carregar arquivos');
    } finally {
      setLoading(false);
    }
  };

  const calculateStorageUsage = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list(getUserBasePath(), {
          limit: 1000,
        });

      if (error) throw error;

      let totalSize = 0;
      for (const item of data || []) {
        if (item.metadata?.size) {
          totalSize += item.metadata.size;
        }
      }

      setStorageUsage({ used: totalSize, total: 104857600 });
    } catch (error) {
      console.error('Error calculating storage:', error);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !user) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fullPath = `${getFullPath()}/${file.name}`;
        
        const { error } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(fullPath, file, {
            cacheControl: '3600',
            upsert: true
          });

        if (error) throw error;
      }

      toast.success(`${files.length} arquivo(s) enviado(s) com sucesso!`);
      loadFiles();
      calculateStorageUsage();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Erro ao enviar arquivo');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !user) return;

    try {
      const folderPath = `${getFullPath()}/${newFolderName.trim()}/.placeholder`;
      
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(folderPath, new Blob([''], { type: 'text/plain' }), {
          cacheControl: '3600',
        });

      if (error) throw error;

      toast.success('Pasta criada com sucesso!');
      setNewFolderName('');
      setShowNewFolderDialog(false);
      loadFiles();
    } catch (error: any) {
      console.error('Create folder error:', error);
      toast.error(error.message || 'Erro ao criar pasta');
    }
  };

  const handleDeleteFile = async (file: StorageFile) => {
    if (!user) return;
    
    if (!confirm(`Deseja excluir "${file.name}"?`)) return;

    try {
      const fullPath = `${getFullPath()}/${file.name}`;
      
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([fullPath]);

      if (error) throw error;

      toast.success('Arquivo excluído com sucesso!');
      loadFiles();
      calculateStorageUsage();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Erro ao excluir arquivo');
    }
  };

  const handleDownload = async (file: StorageFile) => {
    try {
      const fullPath = `${getFullPath()}/${file.name}`;
      
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .download(fullPath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Download error:', error);
      toast.error(error.message || 'Erro ao baixar arquivo');
    }
  };

  const navigateToFolder = (folder: StorageFolder) => {
    setCurrentPath(folder.path);
  };

  const navigateUp = () => {
    const parts = currentPath.split('/');
    parts.pop();
    setCurrentPath(parts.join('/'));
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || getFileCategory(file.type) === filterType;
    return matchesSearch && matchesType;
  });

  const pathParts = currentPath.split('/').filter(Boolean);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/vip/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Meus Arquivos</h1>
              <p className="text-muted-foreground">Gerencie seus arquivos, imagens e vídeos</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={loadFiles} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            
            <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <FolderPlus className="h-4 w-4 mr-2" />
                  Nova Pasta
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Nova Pasta</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Nome da pasta"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                  />
                  <Button onClick={handleCreateFolder} className="w-full">
                    Criar Pasta
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            
            <label>
              <input
                type="file"
                multiple
                className="hidden"
                onChange={handleUpload}
                disabled={uploading}
              />
              <Button asChild disabled={uploading}>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? 'Enviando...' : 'Upload'}
                </span>
              </Button>
            </label>
          </div>
        </div>

        {/* Storage Usage */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Armazenamento</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {formatFileSize(storageUsage.used)} de {formatFileSize(storageUsage.total)} usados
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all"
                style={{ width: `${(storageUsage.used / storageUsage.total) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setCurrentPath('')}
            className="text-muted-foreground hover:text-foreground"
          >
            <Folder className="h-4 w-4 mr-1" />
            Raiz
          </Button>
          {pathParts.map((part, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="text-muted-foreground">/</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPath(pathParts.slice(0, index + 1).join('/'))}
                className="text-muted-foreground hover:text-foreground"
              >
                {part}
              </Button>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar arquivos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="image">Imagens</SelectItem>
              <SelectItem value="video">Vídeos</SelectItem>
              <SelectItem value="audio">Áudios</SelectItem>
              <SelectItem value="document">Documentos</SelectItem>
              <SelectItem value="archive">Arquivos</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center border rounded-lg">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Back button */}
            {currentPath && (
              <Button variant="ghost" onClick={navigateUp} className="mb-2">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            )}

            {/* Folders */}
            {folders.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Pastas</h3>
                <div className={viewMode === 'grid' 
                  ? 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4'
                  : 'space-y-2'
                }>
                  {folders.map((folder) => (
                    <motion.div
                      key={folder.path}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => navigateToFolder(folder)}
                      className={`cursor-pointer ${
                        viewMode === 'grid'
                          ? 'p-4 rounded-lg border bg-card hover:border-primary transition-colors text-center'
                          : 'p-3 rounded-lg border bg-card hover:border-primary transition-colors flex items-center gap-3'
                      }`}
                    >
                      <Folder className={`text-primary ${viewMode === 'grid' ? 'h-12 w-12 mx-auto mb-2' : 'h-5 w-5'}`} />
                      <span className="text-sm font-medium truncate">{folder.name}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Files */}
            {filteredFiles.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Arquivos</h3>
                <div className={viewMode === 'grid' 
                  ? 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4'
                  : 'space-y-2'
                }>
                  <AnimatePresence>
                    {filteredFiles.map((file) => {
                      const category = getFileCategory(file.type);
                      const IconComponent = fileTypeIcons[category] || fileTypeIcons.default;
                      
                      return (
                        <motion.div
                          key={file.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className={`group relative ${
                            viewMode === 'grid'
                              ? 'p-4 rounded-lg border bg-card hover:border-primary transition-colors'
                              : 'p-3 rounded-lg border bg-card hover:border-primary transition-colors flex items-center gap-4'
                          }`}
                        >
                          {viewMode === 'grid' ? (
                            <>
                              <div className="aspect-square rounded-lg bg-muted flex items-center justify-center mb-3 overflow-hidden">
                                {category === 'image' ? (
                                  <img 
                                    src={file.url} 
                                    alt={file.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : category === 'video' ? (
                                  <video 
                                    src={file.url}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <IconComponent className="h-12 w-12 text-muted-foreground" />
                                )}
                              </div>
                              <p className="text-sm font-medium truncate">{file.name}</p>
                              <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedFile(file);
                                    setPreviewOpen(true);
                                  }}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Visualizar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDownload(file)}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Baixar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteFile(file)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </>
                          ) : (
                            <>
                              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {category === 'image' ? (
                                  <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                                ) : (
                                  <IconComponent className="h-5 w-5 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{file.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatFileSize(file.size)} • {new Date(file.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <Badge variant="secondary">{category}</Badge>
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" onClick={() => {
                                  setSelectedFile(file);
                                  setPreviewOpen(true);
                                }}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDownload(file)}>
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteFile(file)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Empty State */}
            {folders.length === 0 && filteredFiles.length === 0 && (
              <div className="text-center py-12">
                <Folder className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum arquivo encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  Faça upload de seus arquivos para começar
                </p>
                <label>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleUpload}
                  />
                  <Button asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload de Arquivos
                    </span>
                  </Button>
                </label>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedFile?.name}</DialogTitle>
          </DialogHeader>
          {selectedFile && (
            <div className="mt-4">
              {getFileCategory(selectedFile.type) === 'image' ? (
                <img 
                  src={selectedFile.url} 
                  alt={selectedFile.name}
                  className="max-h-[70vh] mx-auto object-contain"
                />
              ) : getFileCategory(selectedFile.type) === 'video' ? (
                <video 
                  src={selectedFile.url}
                  controls
                  className="w-full max-h-[70vh]"
                />
              ) : getFileCategory(selectedFile.type) === 'audio' ? (
                <audio src={selectedFile.url} controls className="w-full" />
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Visualização não disponível para este tipo de arquivo
                  </p>
                  <Button 
                    onClick={() => handleDownload(selectedFile)}
                    className="mt-4"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Baixar Arquivo
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VIPStorageManager;
