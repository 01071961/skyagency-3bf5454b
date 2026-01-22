import { useState } from 'react';
import {
  Facebook,
  Instagram,
  MessageCircle,
  Calendar,
  Send,
  Settings,
  Plus,
  Image as ImageIcon,
  Video,
  FileText,
  Clock,
  Trash2,
  Edit,
  Zap,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { GlassCard } from '@/components/ui/glass-card';
import SocialConnections from './SocialConnections';
import { Link as LinkIcon } from 'lucide-react';

interface ScheduledPost {
  id: string;
  platform: string[];
  content: string;
  mediaType?: 'image' | 'video' | 'text';
  mediaUrl?: string;
  scheduledAt: string;
  status: 'scheduled' | 'published' | 'failed' | 'draft';
  createdAt: string;
}

const SocialPublishing = () => {
  const [activeTab, setActiveTab] = useState('accounts');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([
    {
      id: '1',
      platform: ['instagram', 'facebook'],
      content: 'Novo streamer parceiro! Bem-vindo à família SKY BRASIL 🚀',
      mediaType: 'image',
      scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      status: 'scheduled',
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      platform: ['whatsapp'],
      content: 'Lembrete: Live especial hoje às 20h!',
      mediaType: 'text',
      scheduledAt: new Date(Date.now() + 3600000).toISOString(),
      status: 'scheduled',
      createdAt: new Date().toISOString(),
    },
  ]);
  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null);

  const [postForm, setPostForm] = useState({
    content: '',
    platforms: [] as string[],
    mediaType: 'text' as 'text' | 'image' | 'video',
    scheduledAt: '',
    mediaUrl: '',
  });

  const platformIcons: Record<string, React.ReactNode> = {
    facebook: <Facebook className="h-5 w-5 text-blue-500" />,
    instagram: <Instagram className="h-5 w-5 text-pink-500" />,
    whatsapp: <MessageCircle className="h-5 w-5 text-green-500" />,
  };

  const platformColors: Record<string, string> = {
    facebook: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    instagram: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    whatsapp: 'bg-green-500/20 text-green-400 border-green-500/30',
  };

  const statusColors: Record<string, string> = {
    scheduled: 'bg-yellow-500/20 text-yellow-400',
    published: 'bg-green-500/20 text-green-400',
    failed: 'bg-red-500/20 text-red-400',
    draft: 'bg-gray-500/20 text-gray-400',
  };

  const handleCreatePost = () => {
    if (!postForm.content || postForm.platforms.length === 0) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o conteúdo e selecione ao menos uma plataforma.',
        variant: 'destructive',
      });
      return;
    }

    if (editingPost) {
      // Update existing post
      setScheduledPosts(prev => prev.map(p => 
        p.id === editingPost.id 
          ? { ...p, content: postForm.content, platform: postForm.platforms, mediaType: postForm.mediaType, mediaUrl: postForm.mediaUrl, scheduledAt: postForm.scheduledAt || p.scheduledAt }
          : p
      ));
      toast({ title: 'Post atualizado!', description: 'O post foi atualizado com sucesso.' });
      setEditingPost(null);
    } else {
      // Create new post
      const newPost: ScheduledPost = {
        id: crypto.randomUUID(),
        platform: postForm.platforms,
        content: postForm.content,
        mediaType: postForm.mediaType,
        mediaUrl: postForm.mediaUrl,
        scheduledAt: postForm.scheduledAt || new Date().toISOString(),
        status: postForm.scheduledAt ? 'scheduled' : 'draft',
        createdAt: new Date().toISOString(),
      };
      setScheduledPosts(prev => [newPost, ...prev]);
      toast({ title: 'Post criado!', description: postForm.scheduledAt ? 'O post foi agendado com sucesso.' : 'O post foi salvo como rascunho.' });
    }

    setIsCreateDialogOpen(false);
    setPostForm({
      content: '',
      platforms: [],
      mediaType: 'text',
      scheduledAt: '',
      mediaUrl: '',
    });
  };

  const handleEditPost = (post: ScheduledPost) => {
    setEditingPost(post);
    setPostForm({
      content: post.content,
      platforms: post.platform,
      mediaType: post.mediaType || 'text',
      scheduledAt: post.scheduledAt,
      mediaUrl: post.mediaUrl || '',
    });
    setIsCreateDialogOpen(true);
  };

  const handleDeletePost = (postId: string) => {
    setScheduledPosts(prev => prev.filter(p => p.id !== postId));
    toast({ title: 'Post excluído', description: 'O post foi removido com sucesso.' });
  };

  const togglePlatform = (platform: string) => {
    setPostForm(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Globe className="h-6 w-6 text-primary" />
            Publicações Automáticas
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie publicações em redes sociais e WhatsApp
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Publicação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Publicação</DialogTitle>
                <DialogDescription>
                  Crie uma publicação para uma ou mais plataformas
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {/* Platform Selection */}
                <div className="space-y-2">
                  <Label>Plataformas</Label>
                  <div className="flex flex-wrap gap-2">
                    {['facebook', 'instagram', 'whatsapp'].map(platform => (
                      <button
                        key={platform}
                        onClick={() => togglePlatform(platform)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                          postForm.platforms.includes(platform)
                            ? platformColors[platform]
                            : 'border-border/50 text-muted-foreground hover:border-border'
                        }`}
                      >
                        {platformIcons[platform]}
                        <span className="capitalize text-sm">{platform}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <Label>Conteúdo</Label>
                  <Textarea
                    placeholder="Digite o texto da sua publicação..."
                    value={postForm.content}
                    onChange={(e) => setPostForm(prev => ({ ...prev, content: e.target.value }))}
                    rows={4}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    {postForm.content.length}/2200 caracteres
                  </p>
                </div>

                {/* Media Type */}
                <div className="space-y-2">
                  <Label>Tipo de Mídia</Label>
                  <Select
                    value={postForm.mediaType}
                    onValueChange={(value: 'text' | 'image' | 'video') =>
                      setPostForm(prev => ({ ...prev, mediaType: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Apenas Texto
                        </div>
                      </SelectItem>
                      <SelectItem value="image">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="h-4 w-4" />
                          Imagem
                        </div>
                      </SelectItem>
                      <SelectItem value="video">
                        <div className="flex items-center gap-2">
                          <Video className="h-4 w-4" />
                          Vídeo
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Media URL */}
                {postForm.mediaType !== 'text' && (
                  <div className="space-y-2">
                    <Label>URL da Mídia</Label>
                    <Input
                      placeholder="https://..."
                      value={postForm.mediaUrl}
                      onChange={(e) => setPostForm(prev => ({ ...prev, mediaUrl: e.target.value }))}
                    />
                  </div>
                )}

                {/* Schedule */}
                <div className="space-y-2">
                  <Label>Agendar para</Label>
                  <Input
                    type="datetime-local"
                    value={postForm.scheduledAt}
                    onChange={(e) => setPostForm(prev => ({ ...prev, scheduledAt: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Deixe em branco para publicar imediatamente
                  </p>
                </div>

                {/* Preview */}
                {postForm.content && (
                  <div className="space-y-2">
                    <Label>Pré-visualização</Label>
                    <GlassCard className="p-4">
                      <p className="text-sm whitespace-pre-wrap">{postForm.content}</p>
                      {postForm.platforms.length > 0 && (
                        <div className="flex gap-2 mt-3">
                          {postForm.platforms.map(p => (
                            <span key={p}>{platformIcons[p]}</span>
                          ))}
                        </div>
                      )}
                    </GlassCard>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreatePost} className="gap-2">
                  {postForm.scheduledAt ? (
                    <>
                      <Calendar className="h-4 w-4" />
                      Agendar
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Publicar Agora
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Facebook className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">0</p>
              <p className="text-xs text-muted-foreground">Posts Facebook</p>
            </div>
          </div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-pink-500/20">
              <Instagram className="h-5 w-5 text-pink-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">0</p>
              <p className="text-xs text-muted-foreground">Posts Instagram</p>
            </div>
          </div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20">
              <MessageCircle className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">0</p>
              <p className="text-xs text-muted-foreground">Mensagens WhatsApp</p>
            </div>
          </div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/20">
              <Clock className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{scheduledPosts.filter(p => p.status === 'scheduled').length}</p>
              <p className="text-xs text-muted-foreground">Agendados</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="accounts" className="gap-2">
            <LinkIcon className="h-4 w-4" />
            Contas Conectadas
          </TabsTrigger>
          <TabsTrigger value="posts" className="gap-2">
            <FileText className="h-4 w-4" />
            Publicações
          </TabsTrigger>
          <TabsTrigger value="automations" className="gap-2">
            <Zap className="h-4 w-4" />
            Automações
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            Configurações
          </TabsTrigger>
        </TabsList>

        {/* Accounts Tab - New OAuth Component */}
        <TabsContent value="accounts" className="space-y-4 mt-4">
          <SocialConnections />
        </TabsContent>

        <TabsContent value="posts" className="space-y-4 mt-4">
          {scheduledPosts.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Nenhuma publicação agendada</h3>
              <p className="text-muted-foreground mb-4">
                Crie sua primeira publicação para começar
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Publicação
              </Button>
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {scheduledPosts.map(post => (
                <GlassCard key={post.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {post.platform.map(p => (
                          <span key={p}>{platformIcons[p]}</span>
                        ))}
                        <Badge className={statusColors[post.status]}>
                          {post.status === 'scheduled' && 'Agendado'}
                          {post.status === 'published' && 'Publicado'}
                          {post.status === 'failed' && 'Falhou'}
                          {post.status === 'draft' && 'Rascunho'}
                        </Badge>
                      </div>
                      <p className="text-sm">{post.content}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(post.scheduledAt).toLocaleString('pt-BR')}
                        </span>
                        {post.mediaType && post.mediaType !== 'text' && (
                          <span className="flex items-center gap-1">
                            {post.mediaType === 'image' ? <ImageIcon className="h-3 w-3" /> : <Video className="h-3 w-3" />}
                            {post.mediaType === 'image' ? 'Imagem' : 'Vídeo'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEditPost(post)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeletePost(post.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="automations" className="space-y-4 mt-4">
          <GlassCard className="p-6">
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Gatilhos Disponíveis
            </h3>
            <div className="grid gap-3">
              {[
                { id: 'new_product', trigger: 'Novo produto adicionado', action: 'Publicar no Instagram e Facebook', enabled: false },
                { id: 'new_streamer', trigger: 'Novo streamer parceiro', action: 'Enviar mensagem de boas-vindas no WhatsApp', enabled: true },
                { id: 'live_scheduled', trigger: 'Live agendada', action: 'Criar post de divulgação em todas as redes', enabled: false },
                { id: 'followers_goal', trigger: 'Meta de seguidores atingida', action: 'Publicar post de comemoração', enabled: false },
              ].map((automation) => (
                <div key={automation.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-sm">{automation.trigger}</p>
                    <p className="text-xs text-muted-foreground">→ {automation.action}</p>
                  </div>
                  <Switch 
                    defaultChecked={automation.enabled}
                    onCheckedChange={(checked) => {
                      toast({
                        title: checked ? 'Automação ativada' : 'Automação desativada',
                        description: `${automation.trigger} foi ${checked ? 'ativada' : 'desativada'}.`,
                      });
                    }}
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              * Configure as automações após conectar as contas de redes sociais. Acesse a aba "Automações" no menu principal para regras avançadas.
            </p>
          </GlassCard>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4 mt-4">
          <GlassCard className="p-6">
            <h3 className="text-lg font-medium mb-4">Informações de Configuração</h3>
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>
                As credenciais do Meta App (App ID e App Secret) são armazenadas de forma segura no servidor 
                e nunca são expostas no frontend.
              </p>
              <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <p className="text-green-400 font-medium mb-2">✓ Configuração Segura</p>
                <ul className="space-y-1 text-green-300/80">
                  <li>• App ID e Secret protegidos no backend</li>
                  <li>• Tokens OAuth criptografados no banco de dados</li>
                  <li>• Renovação automática de tokens antes da expiração</li>
                  <li>• Conexões podem ser revogadas a qualquer momento</li>
                </ul>
              </div>
              <p>
                Para modificar as credenciais do Meta App, entre em contato com o administrador do sistema.
              </p>
            </div>
          </GlassCard>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SocialPublishing;
