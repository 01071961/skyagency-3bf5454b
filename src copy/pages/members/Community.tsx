import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, 
  ThumbsUp, 
  Send,
  Users,
  TrendingUp,
  Clock,
  Search,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useCommunity } from '@/hooks/useCommunity';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Community = () => {
  const { posts, stats, isLoading, createPost, toggleLike, fetchPosts, refetch } = useCommunity();
  const [searchQuery, setSearchQuery] = useState('');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'recent' | 'popular'>('recent');

  const handleSubmit = async () => {
    if (!newPostContent.trim()) return;
    
    setIsSubmitting(true);
    const success = await createPost(
      newPostTitle.trim() || 'Nova discussão',
      newPostContent.trim()
    );
    
    if (success) {
      setNewPostTitle('');
      setNewPostContent('');
    }
    setIsSubmitting(false);
  };

  const filteredPosts = posts.filter(post => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      post.title.toLowerCase().includes(query) ||
      post.content.toLowerCase().includes(query) ||
      post.author?.name?.toLowerCase().includes(query)
    );
  });

  const sortedPosts = activeTab === 'popular'
    ? [...filteredPosts].sort((a, b) => b.likes_count - a.likes_count)
    : filteredPosts;

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true, 
        locale: ptBR 
      });
    } catch {
      return dateString;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Comunidade</h1>
          <p className="text-muted-foreground">Conecte-se com outros alunos</p>
        </div>
        <Button variant="outline" size="sm" onClick={refetch}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Users className="h-8 w-8 mx-auto text-primary mb-2" />
            <p className="text-2xl font-bold">{stats.totalMembers.toLocaleString('pt-BR')}</p>
            <p className="text-sm text-muted-foreground">Membros</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <MessageSquare className="h-8 w-8 mx-auto text-primary mb-2" />
            <p className="text-2xl font-bold">{stats.totalPosts.toLocaleString('pt-BR')}</p>
            <p className="text-sm text-muted-foreground">Discussões</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <TrendingUp className="h-8 w-8 mx-auto text-primary mb-2" />
            <p className="text-2xl font-bold">{stats.activeToday.toLocaleString('pt-BR')}</p>
            <p className="text-sm text-muted-foreground">Ativos Hoje</p>
          </CardContent>
        </Card>
      </div>

      {/* New Post */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <Input
            placeholder="Título da discussão (opcional)"
            value={newPostTitle}
            onChange={(e) => setNewPostTitle(e.target.value)}
          />
          <Textarea 
            placeholder="Compartilhe algo com a comunidade..."
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end">
            <Button 
              onClick={handleSubmit} 
              disabled={!newPostContent.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Publicar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Buscar discussões..." 
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'recent' | 'popular')}>
        <TabsList>
          <TabsTrigger value="recent">
            <Clock className="h-4 w-4 mr-2" />
            Recentes
          </TabsTrigger>
          <TabsTrigger value="popular">
            <TrendingUp className="h-4 w-4 mr-2" />
            Populares
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="mt-6 space-y-4">
          {sortedPosts.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma discussão encontrada.</p>
                <p className="text-sm">Seja o primeiro a iniciar uma conversa!</p>
              </CardContent>
            </Card>
          ) : (
            sortedPosts.map((discussion) => (
              <Card key={discussion.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <Avatar>
                      <AvatarImage src={discussion.author?.avatar_url || undefined} />
                      <AvatarFallback>
                        {getInitials(discussion.author?.name || 'U')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold">{discussion.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {discussion.author?.name || 'Usuário'} • {formatDate(discussion.created_at)}
                          </p>
                        </div>
                        {discussion.course?.name && (
                          <Badge variant="outline">{discussion.course.name}</Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground mt-2 line-clamp-2">
                        {discussion.content}
                      </p>
                      <div className="flex items-center gap-4 mt-4">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => toggleLike(discussion.id)}
                          className={discussion.hasLiked ? 'text-primary' : ''}
                        >
                          <ThumbsUp className={`h-4 w-4 mr-1 ${discussion.hasLiked ? 'fill-current' : ''}`} />
                          {discussion.likes_count}
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          {discussion.replies_count} respostas
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="popular" className="mt-6 space-y-4">
          {sortedPosts.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma discussão popular ainda.</p>
              </CardContent>
            </Card>
          ) : (
            sortedPosts.map((discussion) => (
              <Card key={discussion.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <Avatar>
                      <AvatarImage src={discussion.author?.avatar_url || undefined} />
                      <AvatarFallback>
                        {getInitials(discussion.author?.name || 'U')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold">{discussion.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {discussion.author?.name || 'Usuário'} • {formatDate(discussion.created_at)}
                          </p>
                        </div>
                        {discussion.course?.name && (
                          <Badge variant="outline">{discussion.course.name}</Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground mt-2 line-clamp-2">
                        {discussion.content}
                      </p>
                      <div className="flex items-center gap-4 mt-4">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => toggleLike(discussion.id)}
                          className={discussion.hasLiked ? 'text-primary' : ''}
                        >
                          <ThumbsUp className={`h-4 w-4 mr-1 ${discussion.hasLiked ? 'fill-current' : ''}`} />
                          {discussion.likes_count}
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          {discussion.replies_count} respostas
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Community;
