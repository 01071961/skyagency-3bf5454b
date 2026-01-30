import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  HardDrive, Cloud, Upload, Trash2, Download, 
  FolderOpen, FileText, Image, Video, Music,
  AlertCircle, RefreshCw, Search, Crown, Shield,
  Users, Share2, Settings, ExternalLink
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
  AlertDialogHeader, AlertDialogTitle 
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

interface UserRole {
  role: 'user' | 'vip' | 'admin';
  isVip: boolean;
  isAdmin: boolean;
  plan?: string;
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

export default function UnifiedFiles() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [userRole, setUserRole] = useState<UserRole>({ role: 'user', isVip: false, isAdmin: false });
  const [internalFiles, setInternalFiles] = useState<FileItem[]>([]);
  const [driveFiles, setDriveFiles] = useState<FileItem[]>([]);
  const [usedStorage, setUsedStorage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadDest, setUploadDest] = useState<'internal' | 'drive'>('internal');
  const [search, setSearch] = useState('');
  const [fileToDelete, setFileToDelete] = useState<FileItem | null>(null);
  const [connectingDrive, setConnectingDrive] = useState(false);
  const [driveFolderId, setDriveFolderId] = useState<string | null>(null);

  const driveConnected = profile?.drive_connected || false;

  useEffect(() => {
    if (!user) {
      navigate('/auth?redirect=/files');
      return;
    }
    loadUserData();
  }, [user]);

  useEffect(() => {
    if (profile && user) {
      loadInternalFiles();
      if (driveConnected) {
        initializeDrive();
      }
    }
  }, [profile, user, driveConnected]);

  useEffect(() => {
    if (driveFolderId) {
      loadDriveFiles();
    }
  }, [driveFolderId]);

  const loadUserData = async () => {
    try {
      // Load profile - only select existing columns
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();
      
      setProfile(profileData || { drive_connected: false });
      setUsedStorage((profileData as any)?.storage_used || 0);

      // Check user roles
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id);

      const roles = rolesData?.map(r => r.role) || [];
      const isAdmin = roles.includes('admin' as any) || roles.includes('owner' as any);
      
      // Check VIP status
      const { data: affiliateData } = await supabase
        .from('vip_affiliates')
        .select('status, tier')
        .eq('user_id', user?.id)
        .maybeSingle();

      const isVip = affiliateData?.status === 'approved' || 
                    (profileData as any)?.plan === 'gold' || 
                    (profileData as any)?.plan === 'diamond';

      setUserRole({
        role: isAdmin ? 'admin' : isVip ? 'vip' : 'user',
        isVip,
        isAdmin,
        plan: (profileData as any)?.plan
      });
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInternalFiles = async () => {
    try {
      // Use storage API to list files instead of non-existent table
      const { data: storageFiles, error } = await supabase.storage
        .from('user-files')
        .list(user?.id || '', { limit: 100 });

      if (error) {
        console.error('Storage error:', error);
        return;
      }

      if (storageFiles) {
        const formatted: FileItem[] = storageFiles.map(f => ({
          id: f.id || f.name,
          name: f.name,
          size: (f.metadata as any)?.size || 0,
          type: (f.metadata as any)?.mimetype,
          source: 'internal' as const,
          created_at: f.created_at,
          path: `${user?.id}/${f.name}`,
        }));
        setInternalFiles(formatted);
        
        const total = formatted.reduce((acc, f) => acc + (f.size || 0), 0);
        setUsedStorage(total);
      }
    } catch (error) {
      console.error('Error loading internal files:', error);
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
          source: 'drive' as const,
          created_at: f.modifiedTime,
          webViewLink: f.webViewLink,
        }));
        setDriveFiles(formatted);
      }
    } catch (error) {
      console.error('Error loading Drive files:', error);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (uploadDest === 'internal' && usedStorage + file.size > MAX_STORAGE) {
      toast.error('Limite de armazenamento atingido (15GB)');
      return;
    }

    setUploading(true);
    try {
      if (uploadDest === 'internal') {
        const filePath = `${user.id}/${Date.now()}-${file.name}`;
        
        const { error: uploadError } = await supabase.storage
          .from('user-files')
          .upload(filePath, file, { upsert: false });

        if (uploadError) throw uploadError;

        toast.success('Arquivo enviado com sucesso!');
        loadInternalFiles();
      } else if (uploadDest === 'drive' && driveFolderId) {
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
        await supabase.storage
          .from('user-files')
          .remove([file.path]);

        toast.success('Arquivo excluído');
        loadInternalFiles();
      } else if (file.source === 'drive') {
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
      const { data, error } = await supabase.functions.invoke('google-drive-manager', {
        body: { action: 'get-auth-url', user_id: user.id, origin: window.location.origin }
      });

      if (error) throw error;
      
      if (data?.authUrl) {
        sessionStorage.setItem('drive_oauth_return', '/files');
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

  const getRoleBadge = () => {
    if (userRole.isAdmin) {
      return (
        <Badge className="bg-red-500/10 text-red-600 border-red-500/30">
          <Shield className="h-3 w-3 mr-1" />
          Admin
        </Badge>
      );
    }
    if (userRole.isVip) {
      return (
        <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30">
          <Crown className="h-3 w-3 mr-1" />
          VIP
        </Badge>
      );
    }
    return (
      <Badge variant="outline">
        <Users className="h-3 w-3 mr-1" />
        Aluno
      </Badge>
    );
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FolderOpen className="h-6 w-6 text-primary" />
              Meus Arquivos
            </h1>
            {getRoleBadge()}
          </div>
          <p className="text-muted-foreground">
            Armazenamento híbrido: interno (15GB) + Google Drive ilimitado
          </p>
        </div>

        {userRole.isAdmin && (
          <Button variant="outline" onClick={() => navigate('/admin')}>
            <Settings className="h-4 w-4 mr-2" />
            Gerenciar Plataforma
          </Button>
        )}
      </motion.div>

      {/* Storage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Internal Storage */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <HardDrive className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Armazenamento Interno</p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(usedStorage)} de 15 GB usados
                </p>
              </div>
              <Badge variant="outline">Lovable Cloud</Badge>
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
              {!driveConnected ? (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleConnectDrive}
                  disabled={connectingDrive}
                >
                  {connectingDrive ? 'Conectando...' : 'Conectar Drive'}
                </Button>
              ) : (
                <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
                  Pronto para usar
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upload Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <h3 className="font-medium mb-1">Enviar Arquivo</h3>
              <p className="text-sm text-muted-foreground">
                Escolha onde salvar seu arquivo
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={uploadDest === 'internal' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUploadDest('internal')}
              >
                <HardDrive className="h-4 w-4 mr-2" />
                Interno
              </Button>
              <Button
                variant={uploadDest === 'drive' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUploadDest('drive')}
                disabled={!driveConnected}
              >
                <Cloud className="h-4 w-4 mr-2" />
                Drive
              </Button>
            </div>
            <div>
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={handleUpload}
                disabled={uploading}
              />
              <label htmlFor="file-upload">
                <Button asChild disabled={uploading}>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? 'Enviando...' : 'Upload'}
                  </span>
                </Button>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Files List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Arquivos</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
                getFileIcon={getFileIcon}
                formatFileSize={formatFileSize}
              />
            </TabsContent>
            <TabsContent value="internal" className="mt-4">
              <FileList 
                files={filteredInternal} 
                onDownload={handleDownload} 
                onDelete={setFileToDelete}
                getFileIcon={getFileIcon}
                formatFileSize={formatFileSize}
              />
            </TabsContent>
            <TabsContent value="drive" className="mt-4">
              <FileList 
                files={filteredDrive} 
                onDownload={handleDownload} 
                onDelete={setFileToDelete}
                getFileIcon={getFileIcon}
                formatFileSize={formatFileSize}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={!!fileToDelete} onOpenChange={() => setFileToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir arquivo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O arquivo "{fileToDelete?.name}" será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => fileToDelete && handleDelete(fileToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface FileListProps {
  files: FileItem[];
  onDownload: (file: FileItem) => void;
  onDelete: (file: FileItem) => void;
  getFileIcon: (type?: string) => typeof FileText;
  formatFileSize: (bytes: number) => string;
}

function FileList({ files, onDownload, onDelete, getFileIcon, formatFileSize }: FileListProps) {
  if (files.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Nenhum arquivo encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {files.map((file) => {
        const Icon = getFileIcon(file.type);
        return (
          <div
            key={file.id}
            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">{file.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatFileSize(file.size)}</span>
                  <span>•</span>
                  <Badge variant="outline" className="text-xs">
                    {file.source === 'drive' ? (
                      <><Cloud className="h-3 w-3 mr-1" /> Drive</>
                    ) : (
                      <><HardDrive className="h-3 w-3 mr-1" /> Interno</>
                    )}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => onDownload(file)}>
                {file.source === 'drive' ? (
                  <ExternalLink className="h-4 w-4" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onDelete(file)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}