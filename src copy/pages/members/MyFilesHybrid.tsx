import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  HardDrive, Cloud, Upload, Trash2, Download, 
  FolderOpen, Eye, FileText, Image, Video, Music,
  Lock, AlertCircle, RefreshCw, Search
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, 
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter, 
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';

interface FileItem {
  id: string;
  name: string;
  size: number;
  type?: string;
  source: 'internal' | 'drive';
  created_at?: string;
  path?: string;
  webViewLink?: string;
}

const MAX_STORAGE = 15 * 1024 * 1024 * 1024; // 15GB

const getFileIcon = (type?: string) => {
  if (!type) return FileText;
  if (type.startsWith('image/')) return Image;
  if (type.startsWith('video/')) return Video;
  if (type.startsWith('audio/')) return Music;
  return FileText;
};

const formatFileSize = (bytes: number) => {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
};

export default function MyFilesHybrid() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [internalFiles, setInternalFiles] = useState<FileItem[]>([]);
  const [driveFiles, setDriveFiles] = useState<FileItem[]>([]);
  const [usedStorage, setUsedStorage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadDest, setUploadDest] = useState<'internal' | 'drive'>('internal');
  const [search, setSearch] = useState('');
  const [fileToDelete, setFileToDelete] = useState<FileItem | null>(null);
  const [connectingDrive, setConnectingDrive] = useState(false);

  // Allow all logged-in users to access storage (remove premium restriction for now)
  const driveConnected = profile?.drive_connected || false;

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  useEffect(() => {
    if (profile && user) {
      loadInternalFiles();
      if (driveConnected) {
        loadDriveFiles();
      }
    }
  }, [profile, user, driveConnected]);

  const loadProfile = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('plan, drive_connected, storage_used, default_storage')
      .eq('user_id', user?.id)
      .single();
    
    if (error) {
      console.error('Error loading profile:', error);
    }
    setProfile(data || { drive_connected: false });
    setUsedStorage(data?.storage_used || 0);
    setLoading(false);
  };

  const loadInternalFiles = async () => {
    try {
      // List files from user_files table
      const { data: filesData } = await supabase
        .from('user_files')
        .select('*')
        .eq('user_id', user?.id)
        .eq('storage_type', 'internal')
        .order('created_at', { ascending: false });

      if (filesData) {
        const formatted: FileItem[] = filesData.map(f => ({
          id: f.id,
          name: f.file_name,
          size: f.file_size,
          type: f.file_type,
          source: 'internal',
          created_at: f.created_at,
          path: f.file_path,
        }));
        setInternalFiles(formatted);
        
        // Calculate total used storage
        const total = filesData.reduce((acc, f) => acc + (f.file_size || 0), 0);
        setUsedStorage(total);
      }
    } catch (error) {
      console.error('Error loading internal files:', error);
    }
  };

  const [driveFolderId, setDriveFolderId] = useState<string | null>(null);

  const loadDriveFiles = async () => {
    if (!user || !driveFolderId) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('google-drive-manager', {
        body: { 
          action: 'list-files', 
          user_id: user.id,
          folderId: driveFolderId 
        }
      });

      if (error) throw error;
      
      if (data?.files) {
        const formatted: FileItem[] = data.files.map((f: any) => ({
          id: f.id,
          name: f.name,
          size: parseInt(f.size) || 0,
          type: f.mimeType,
          source: 'drive',
          created_at: f.modifiedTime,
          webViewLink: f.webViewLink,
        }));
        setDriveFiles(formatted);
      }
    } catch (error) {
      console.error('Error loading Drive files:', error);
    }
  };

  const initializeDrive = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('google-drive-manager', {
        body: { action: 'create-root-folder', user_id: user.id }
      });

      if (error) throw error;
      
      if (data?.folderId) {
        setDriveFolderId(data.folderId);
      }
    } catch (error) {
      console.error('Error initializing Drive:', error);
    }
  };

  useEffect(() => {
    if (driveConnected && user && !driveFolderId) {
      initializeDrive();
    }
  }, [driveConnected, user]);

  useEffect(() => {
    if (driveFolderId) {
      loadDriveFiles();
    }
  }, [driveFolderId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Check storage limit for internal storage
    if (uploadDest === 'internal' && usedStorage + file.size > MAX_STORAGE) {
      toast.error('Limite de armazenamento atingido (15GB)');
      return;
    }

    setUploading(true);
    try {
      if (uploadDest === 'internal') {
        const filePath = `${user.id}/${Date.now()}-${file.name}`;
        
        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('user-files')
          .upload(filePath, file, { upsert: false });

        if (uploadError) throw uploadError;

        // Save metadata to user_files table
        const { error: dbError } = await supabase
          .from('user_files')
          .insert({
            user_id: user.id,
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
            file_type: file.type,
            storage_type: 'internal',
          });

        if (dbError) throw dbError;

        toast.success('Arquivo enviado com sucesso!');
        loadInternalFiles();
      } else if (uploadDest === 'drive' && driveFolderId) {
        // Google Drive upload
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = reader.result as string;

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
          
          if (data?.file) {
            toast.success('Arquivo enviado para o Google Drive!');
            loadDriveFiles();
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast.error('Erro ao enviar arquivo: ' + error.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDownload = async (file: FileItem) => {
    if (file.source === 'internal' && file.path) {
      try {
        const { data, error } = await supabase.storage
          .from('user-files')
          .download(file.path);

        if (error) throw error;

        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
      } catch (error: any) {
        toast.error('Erro ao baixar arquivo');
      }
    } else if (file.webViewLink) {
      window.open(file.webViewLink, '_blank');
    }
  };

  const handleDelete = async (file: FileItem) => {
    try {
      if (file.source === 'internal' && file.path) {
        // Delete from storage
        await supabase.storage
          .from('user-files')
          .remove([file.path]);

        // Delete from database
        await supabase
          .from('user_files')
          .delete()
          .eq('id', file.id);

        toast.success('Arquivo excluído');
        loadInternalFiles();
      } else if (file.source === 'drive') {
        // Google Drive delete
        const { error } = await supabase.functions.invoke('google-drive-manager', {
          body: { action: 'delete', user_id: user?.id, fileId: file.id }
        });

        if (error) throw error;
        
        toast.success('Arquivo movido para lixeira do Drive');
        loadDriveFiles();
      }
    } catch (error: any) {
      toast.error('Erro ao excluir arquivo');
    }
    setFileToDelete(null);
  };

  const handleConnectDrive = async () => {
    if (!user) {
      toast.error('Você precisa estar logado');
      return;
    }

    setConnectingDrive(true);
    try {
      // Get OAuth URL from edge function
      const { data, error } = await supabase.functions.invoke('google-drive-manager', {
        body: { action: 'get-auth-url', user_id: user.id, origin: window.location.origin }
      });

      if (error) throw error;
      
      if (data?.authUrl) {
        // Save current page to return after OAuth
        sessionStorage.setItem('drive_oauth_return', window.location.pathname);
        
        // Redirect directly instead of popup (Google blocks popups)
        window.location.href = data.authUrl;
      } else {
        throw new Error('Não foi possível obter URL de autorização');
      }
    } catch (error: any) {
      console.error('Error connecting Drive:', error);
      toast.error('Erro ao conectar Google Drive: ' + (error.message || 'Tente novamente'));
      setConnectingDrive(false);
    }
  };

  // Filter files by search
  const filteredInternal = internalFiles.filter(f => 
    f.name.toLowerCase().includes(search.toLowerCase())
  );
  const filteredDrive = driveFiles.filter(f => 
    f.name.toLowerCase().includes(search.toLowerCase())
  );
  const allFiles = [...filteredInternal, ...filteredDrive].sort((a, b) => 
    new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  );

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  // All logged-in users can access storage now
  if (!user) {
    return (
      <div className="p-6">
        <Card className="max-w-lg mx-auto text-center py-12">
          <Lock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Faça login</h2>
          <p className="text-muted-foreground mb-6">
            Você precisa estar logado para acessar seus arquivos.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FolderOpen className="h-6 w-6 text-primary" />
          Meus Arquivos
        </h1>
        <p className="text-muted-foreground">
          Armazenamento híbrido: interno (15GB) + Google Drive
        </p>
      </div>

      {/* Storage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Internal Storage */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <HardDrive className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Armazenamento Interno</p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(usedStorage)} de 15 GB usados
                </p>
              </div>
            </div>
            <Progress value={(usedStorage / MAX_STORAGE) * 100} className="h-2" />
          </CardContent>
        </Card>

        {/* Google Drive */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Cloud className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium">Google Drive</p>
                  <p className="text-sm text-muted-foreground">
                    {driveConnected ? 'Conectado ✓ (ilimitado)' : 'Não conectado'}
                  </p>
                </div>
              </div>
              {!driveConnected && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleConnectDrive}
                  disabled={connectingDrive}
                >
                  {connectingDrive ? 'Conectando...' : 'Conectar Drive'}
                </Button>
              )}
              {driveConnected && (
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                  Pronto para usar
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upload Section */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Enviar novo arquivo</span>
              </div>
              
              <div className="flex items-center gap-2 sm:ml-auto">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={handleUpload}
                  disabled={uploading}
                />
                <label htmlFor="file-upload">
                  <Button asChild disabled={uploading} className="cursor-pointer">
                    <span>{uploading ? 'Enviando...' : 'Escolher Arquivo'}</span>
                  </Button>
                </label>
              </div>
            </div>
            
            {/* Storage destination selection - always visible */}
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t">
              <span className="text-sm text-muted-foreground">Salvar em:</span>
              <div className="flex items-center gap-2">
                <Button
                  variant={uploadDest === 'internal' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setUploadDest('internal')}
                >
                  <HardDrive className="h-4 w-4 mr-1" />
                  Interno (15GB)
                </Button>
                <Button
                  variant={uploadDest === 'drive' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => driveConnected ? setUploadDest('drive') : handleConnectDrive()}
                  disabled={connectingDrive}
                >
                  <Cloud className="h-4 w-4 mr-1" />
                  {driveConnected ? 'Google Drive' : 'Conectar Drive'}
                </Button>
              </div>
              {!driveConnected && (
                <p className="text-xs text-muted-foreground">
                  Conecte seu Google Drive para armazenamento ilimitado
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar arquivos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Files List */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Todos ({allFiles.length})</TabsTrigger>
          <TabsTrigger value="internal">Interno ({filteredInternal.length})</TabsTrigger>
          <TabsTrigger value="drive">Drive ({filteredDrive.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <FileList 
            files={allFiles} 
            onDownload={handleDownload} 
            onDelete={setFileToDelete} 
          />
        </TabsContent>
        <TabsContent value="internal" className="mt-4">
          <FileList 
            files={filteredInternal} 
            onDownload={handleDownload} 
            onDelete={setFileToDelete} 
          />
        </TabsContent>
        <TabsContent value="drive" className="mt-4">
          {driveConnected ? (
            <FileList 
              files={filteredDrive} 
              onDownload={handleDownload} 
              onDelete={setFileToDelete} 
            />
          ) : (
            <Card className="p-8 text-center">
              <Cloud className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Conecte o Google Drive para ver seus arquivos
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!fileToDelete} onOpenChange={() => setFileToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir arquivo?</AlertDialogTitle>
            <AlertDialogDescription>
              "{fileToDelete?.name}" será {fileToDelete?.source === 'internal' 
                ? 'excluído permanentemente' 
                : 'movido para a lixeira do Google Drive'}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => fileToDelete && handleDelete(fileToDelete)}
              className="bg-destructive text-destructive-foreground"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function FileList({ 
  files, 
  onDownload, 
  onDelete 
}: { 
  files: FileItem[]; 
  onDownload: (f: FileItem) => void;
  onDelete: (f: FileItem) => void;
}) {
  if (files.length === 0) {
    return (
      <Card className="p-8 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Nenhum arquivo encontrado</p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {files.map((file) => {
        const FileIcon = getFileIcon(file.type);
        
        return (
          <motion.div
            key={file.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              {file.source === 'internal' ? (
                <HardDrive className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Cloud className="h-5 w-5 text-blue-500" />
              )}
              <FileIcon className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-sm">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                  {file.created_at && ` • ${new Date(file.created_at).toLocaleDateString('pt-BR')}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => onDownload(file)}>
                <Download className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => onDelete(file)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
