import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Users,
  Radio,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useVIPFollow } from '@/hooks/useVIPSocial';
import { cn } from '@/lib/utils';

interface SuggestedUser {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  followers_count: number;
  is_vip?: boolean;
}

interface TrendingHashtag {
  tag: string;
  count: number;
}

interface LiveStream {
  id: string;
  title: string;
  author: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  viewers_count: number;
}

export function VIPRightSidebar() {
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [trendingHashtags, setTrendingHashtags] = useState<TrendingHashtag[]>([]);
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const { toggleFollow, isFollowing } = useVIPFollow();

  useEffect(() => {
    // Fetch suggested users
    const fetchSuggestions = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('user_id, name, avatar_url')
        .limit(5);

      if (data) {
        setSuggestedUsers(data.map(u => ({
          id: u.user_id,
          full_name: u.name,
          avatar_url: u.avatar_url,
          followers_count: Math.floor(Math.random() * 10000),
          is_vip: Math.random() > 0.7,
        })));
      }
    };

    // Fetch trending hashtags (mock data for now)
    const fetchTrending = () => {
      setTrendingHashtags([
        { tag: 'investimentos', count: 1234 },
        { tag: 'daytrading', count: 987 },
        { tag: 'cripto', count: 856 },
        { tag: 'educaçãofinanceira', count: 743 },
        { tag: 'bolsadevalores', count: 621 },
      ]);
    };

    // Fetch live streams
    const fetchLives = async () => {
      const { data } = await supabase
        .from('vip_posts')
        .select(`
          id,
          title,
          author:profiles!vip_posts_author_id_fkey(id, full_name, avatar_url)
        `)
        .eq('is_live', true)
        .limit(5);

      if (data) {
        setLiveStreams(data.map((stream: any) => ({
          ...stream,
          viewers_count: Math.floor(Math.random() * 500) + 10,
        })));
      }
    };

    fetchSuggestions();
    fetchTrending();
    fetchLives();
  }, []);

  const formatCount = (count: number) => {
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <aside className="hidden xl:block w-80 shrink-0">
      <div className="sticky top-20 space-y-4">
        {/* Live Streams */}
        {liveStreams.length > 0 && (
          <Card className="border-red-500/30 bg-red-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Radio className="h-4 w-4 text-red-500 animate-pulse" />
                Ao Vivo Agora
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {liveStreams.map((stream, index) => (
                  <Link key={stream.id} to={`/vip/network/post/${stream.id}`}>
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="relative">
                        <Avatar className="h-10 w-10 ring-2 ring-red-500">
                          <AvatarImage src={stream.author?.avatar_url || ''} />
                          <AvatarFallback>
                            {stream.author?.full_name?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-background animate-pulse" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {stream.author?.full_name || 'Usuário'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {stream.title || 'Live sem título'}
                        </p>
                        <p className="text-xs text-red-500">
                          {stream.viewers_count} assistindo
                        </p>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Suggested Users */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4" />
              Sugestões para você
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {suggestedUsers.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <Link to={`/vip/network/profile/${user.id}`}>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar_url || ''} />
                      <AvatarFallback>
                        {user.full_name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link 
                      to={`/vip/network/profile/${user.id}`}
                      className="flex items-center gap-1"
                    >
                      <span className="text-sm font-medium truncate hover:text-primary">
                        {user.full_name || 'Usuário'}
                      </span>
                      {user.is_vip && (
                        <Badge variant="secondary" className="text-[10px] px-1 py-0 bg-gradient-to-r from-pink-500 to-cyan-500 text-white border-0">
                          VIP
                        </Badge>
                      )}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {formatCount(user.followers_count)} seguidores
                    </p>
                  </div>
                  <Button
                    variant={isFollowing(user.id) ? 'secondary' : 'default'}
                    size="sm"
                    onClick={() => toggleFollow(user.id)}
                  >
                    {isFollowing(user.id) ? 'Seguindo' : 'Seguir'}
                  </Button>
                </motion.div>
              ))}
            </div>
            <Link to="/vip/network/explore">
              <Button variant="ghost" className="w-full mt-3 gap-2">
                Ver mais
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Trending Hashtags */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4" />
              Em Alta
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {trendingHashtags.map((hashtag, index) => (
                <Link
                  key={hashtag.tag}
                  to={`/vip/network/search?q=${encodeURIComponent('#' + hashtag.tag)}`}
                >
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-primary">
                        #{hashtag.tag}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCount(hashtag.count)} posts
                      </p>
                    </div>
                    <span className="text-lg font-bold text-muted-foreground">
                      {index + 1}
                    </span>
                  </motion.div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Footer Links */}
        <div className="text-xs text-muted-foreground space-y-2 px-2">
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            <Link to="/sobre" className="hover:underline">Sobre</Link>
            <Link to="/termos" className="hover:underline">Termos</Link>
            <Link to="/privacidade" className="hover:underline">Privacidade</Link>
            <Link to="/contato" className="hover:underline">Contato</Link>
          </div>
          <p>© 2024 VIP Network. Todos os direitos reservados.</p>
        </div>
      </div>
    </aside>
  );
}
