import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Facebook,
  Instagram,
  Send,
  Image as ImageIcon,
  Video,
  FileText,
  Calendar,
  Clock,
  CheckCircle,
  Loader2,
  Plus,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { GlassCard } from '@/components/ui/glass-card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/auth/context/AuthContext';
import { useScheduledPosts } from '@/hooks/useScheduledPosts';

const AutoPublishing = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [autoPublishEnabled, setAutoPublishEnabled] = useState(true);
  const { toast } = useToast();
  const { session } = useAuthContext();
  
  // Use real scheduled posts hook
  const { 
    posts, 
    isLoading, 
    createPost, 
    publishNow, 
    deletePost, 
    pendingCount 
  } = useScheduledPosts();

  // New post form state
  const [newPost, setNewPost] = useState({
    platform: 'both' as 'facebook' | 'instagram' | 'both',
    content: '',
    mediaUrl: '',
    mediaType: 'image' as 'image' | 'video',
    scheduleType: 'now' as 'now' | 'scheduled',
    scheduledDate: '',
    scheduledTime: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreatePost = async () => {
    if (!newPost.content) {
      toast({
        title: 'Erro',
        description: 'O conteúdo do post é obrigatório.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const scheduledAt = newPost.scheduleType === 'now'
        ? new Date().toISOString()
        : new Date(`${newPost.scheduledDate}T${newPost.scheduledTime}`).toISOString();

      const postId = await createPost({
        platform: newPost.platform,
        content: newPost.content,
        mediaUrl: newPost.mediaUrl || undefined,
        mediaType: newPost.mediaType,
        scheduledAt
      });

      if (postId && newPost.scheduleType === 'now') {
        await publishNow(postId);
      }

      setIsDialogOpen(false);
      setNewPost({
        platform: 'both',
        content: '',
        mediaUrl: '',
        mediaType: 'image',
        scheduleType: 'now',
        scheduledDate: '',
        scheduledTime: '',
      });
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    await deletePost(id);
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'facebook':
        return <Facebook className="h-4 w-4 text-blue-500" />;
      case 'instagram':
        return <Instagram className="h-4 w-4 text-pink-500" />;
      case 'both':
        return (
          <div className="flex gap-1">
            <Facebook className="h-4 w-4 text-blue-500" />
            <Instagram className="h-4 w-4 text-pink-500" />
          </div>
        );
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
            <Clock className="h-3 w-3 mr-1" />
            Agendado
          </Badge>
        );
      case 'published':
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Publicado
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30">
            <AlertCircle className="h-3 w-3 mr-1" />
            Falhou
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Publicação Automática</h2>
          <p className="text-sm text-muted-foreground">
            Crie e agende posts para Facebook e Instagram
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="auto-publish"
              checked={autoPublishEnabled}
              onCheckedChange={setAutoPublishEnabled}
            />
            <Label htmlFor="auto-publish" className="text-sm">
              Publicação automática
            </Label>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Novo Post</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Novo Post</DialogTitle>
                <DialogDescription>
                  Publique ou agende um post para suas redes sociais
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Platform Selection */}
                <div className="space-y-2">
                  <Label>Plataforma</Label>
                  <Select
                    value={newPost.platform}
                    onValueChange={(value: 'facebook' | 'instagram' | 'both') => 
                      setNewPost(prev => ({ ...prev, platform: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="both">
                        <div className="flex items-center gap-2">
                          <Facebook className="h-4 w-4 text-blue-500" />
                          <Instagram className="h-4 w-4 text-pink-500" />
                          <span>Facebook e Instagram</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="facebook">
                        <div className="flex items-center gap-2">
                          <Facebook className="h-4 w-4 text-blue-500" />
                          <span>Apenas Facebook</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="instagram">
                        <div className="flex items-center gap-2">
                          <Instagram className="h-4 w-4 text-pink-500" />
                          <span>Apenas Instagram</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <Label>Conteúdo</Label>
                  <Textarea
                    value={newPost.content}
                    onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Escreva o texto do seu post..."
                    rows={4}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {newPost.content.length}/2200 caracteres
                  </p>
                </div>

                {/* Media URL */}
                <div className="space-y-2">
                  <Label>URL da Mídia (opcional)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newPost.mediaUrl}
                      onChange={(e) => setNewPost(prev => ({ ...prev, mediaUrl: e.target.value }))}
                      placeholder="https://exemplo.com/imagem.jpg"
                    />
                    <Select
                      value={newPost.mediaType}
                      onValueChange={(value: 'image' | 'video') => 
                        setNewPost(prev => ({ ...prev, mediaType: value }))
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="image">
                          <div className="flex items-center gap-2">
                            <ImageIcon className="h-4 w-4" />
                            <span>Imagem</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="video">
                          <div className="flex items-center gap-2">
                            <Video className="h-4 w-4" />
                            <span>Vídeo</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Schedule */}
                <div className="space-y-2">
                  <Label>Quando publicar</Label>
                  <Select
                    value={newPost.scheduleType}
                    onValueChange={(value: 'now' | 'scheduled') => 
                      setNewPost(prev => ({ ...prev, scheduleType: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="now">Publicar agora</SelectItem>
                      <SelectItem value="scheduled">Agendar</SelectItem>
                    </SelectContent>
                  </Select>

                  {newPost.scheduleType === 'scheduled' && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <Input
                        type="date"
                        value={newPost.scheduledDate}
                        onChange={(e) => setNewPost(prev => ({ ...prev, scheduledDate: e.target.value }))}
                        min={new Date().toISOString().split('T')[0]}
                      />
                      <Input
                        type="time"
                        value={newPost.scheduledTime}
                        onChange={(e) => setNewPost(prev => ({ ...prev, scheduledTime: e.target.value }))}
                      />
                    </div>
                  )}
                </div>

                {/* Preview */}
                {newPost.mediaUrl && (
                  <div className="space-y-2">
                    <Label>Preview</Label>
                    <div className="rounded-lg border overflow-hidden bg-muted/50">
                      <img
                        src={newPost.mediaUrl}
                        alt="Preview"
                        className="w-full h-40 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://placehold.co/400x300?text=Erro+ao+carregar';
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreatePost} disabled={isLoading} className="gap-2">
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : newPost.scheduleType === 'now' ? (
                    <Send className="h-4 w-4" />
                  ) : (
                    <Calendar className="h-4 w-4" />
                  )}
                  {newPost.scheduleType === 'now' ? 'Publicar' : 'Agendar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {posts.map((post, index) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <GlassCard className="p-4">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-2">
                  {getPlatformIcon(post.platform)}
                  {getStatusBadge(post.status)}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDeletePost(post.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {post.media_url && (
                <div className="rounded-lg overflow-hidden mb-3">
                  <img
                    src={post.media_url}
                    alt="Post media"
                    className="w-full h-32 object-cover"
                  />
                </div>
              )}

              <p className="text-sm text-foreground/80 line-clamp-3 mb-3">
                {post.content}
              </p>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(post.scheduled_at).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                {post.status === 'pending' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => publishNow(post.id)}
                  >
                    <Send className="h-3 w-3" />
                    Publicar agora
                  </Button>
                )}
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {posts.length === 0 && (
        <GlassCard className="p-8 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-medium mb-2">Nenhum post agendado</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Crie seu primeiro post para começar a publicar automaticamente
          </p>
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Criar Post
          </Button>
        </GlassCard>
      )}
    </div>
  );
};

export default AutoPublishing;
