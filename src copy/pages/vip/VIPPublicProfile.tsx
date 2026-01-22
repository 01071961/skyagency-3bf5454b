import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, Mail, MapPin, Briefcase, Crown, Diamond, Star,
  Users, TrendingUp, Award, Calendar, ArrowLeft, UserPlus,
  Check, Globe, ExternalLink, MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const tierConfig: Record<string, { color: string; bgColor: string; label: string; icon: React.ReactNode }> = {
  bronze: { color: 'from-amber-600 to-amber-800', bgColor: 'bg-amber-500/10', label: 'Bronze', icon: <Star className="h-5 w-5" /> },
  silver: { color: 'from-slate-400 to-slate-600', bgColor: 'bg-slate-400/10', label: 'Prata', icon: <Star className="h-5 w-5" /> },
  gold: { color: 'from-yellow-400 to-yellow-600', bgColor: 'bg-yellow-500/10', label: 'Ouro', icon: <Crown className="h-5 w-5" /> },
  diamond: { color: 'from-cyan-400 to-blue-600', bgColor: 'bg-cyan-400/10', label: 'Diamante', icon: <Diamond className="h-5 w-5" /> },
  platinum: { color: 'from-violet-400 to-purple-600', bgColor: 'bg-violet-400/10', label: 'Platinum', icon: <Diamond className="h-5 w-5" /> },
};

export default function VIPPublicProfile() {
  const { affiliateId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [affiliate, setAffiliate] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [myAffiliate, setMyAffiliate] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (affiliateId) {
      loadProfile();
      loadMyAffiliate();
    }
  }, [affiliateId, user]);

  const loadMyAffiliate = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('vip_affiliates')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();
    
    if (data) {
      setMyAffiliate(data);
      checkFollowing(data.id);
    }
  };

  const checkFollowing = async (myAffiliateId: string) => {
    const { data } = await supabase
      .from('affiliate_follows')
      .select('id')
      .eq('follower_id', myAffiliateId)
      .eq('following_id', affiliateId)
      .single();
    
    setIsFollowing(!!data);
  };

  const loadProfile = async () => {
    try {
      setLoading(true);

      // Load affiliate data
      const { data: affiliateData, error: affError } = await supabase
        .from('vip_affiliates')
        .select('*')
        .eq('id', affiliateId)
        .single();

      if (affError) throw affError;
      setAffiliate(affiliateData);

      // Load profile data
      const { data: profileData, error: profError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', affiliateData.user_id)
        .single();

      if (profError) throw profError;
      setProfile(profileData);

      // Load follower/following counts
      const [{ count: followers }, { count: following }] = await Promise.all([
        supabase.from('affiliate_follows').select('*', { count: 'exact', head: true }).eq('following_id', affiliateId),
        supabase.from('affiliate_follows').select('*', { count: 'exact', head: true }).eq('follower_id', affiliateId),
      ]);
      
      setFollowersCount(followers || 0);
      setFollowingCount(following || 0);

      // Load posts
      const { data: postsData } = await supabase
        .from('affiliate_posts')
        .select('*')
        .eq('author_id', affiliateId)
        .order('created_at', { ascending: false })
        .limit(5);

      setPosts(postsData || []);
    } catch (error: any) {
      console.error('Error loading profile:', error);
      toast({
        title: 'Erro',
        description: 'Perfil não encontrado.',
        variant: 'destructive',
      });
      navigate('/vip/network');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!myAffiliate) {
      toast({
        title: 'Atenção',
        description: 'Você precisa ser um afiliado VIP para seguir outros afiliados.',
        variant: 'destructive',
      });
      return;
    }

    if (myAffiliate.id === affiliateId) {
      toast({
        title: 'Atenção',
        description: 'Você não pode seguir você mesmo.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setFollowLoading(true);

      if (isFollowing) {
        await supabase
          .from('affiliate_follows')
          .delete()
          .eq('follower_id', myAffiliate.id)
          .eq('following_id', affiliateId);
        
        setIsFollowing(false);
        setFollowersCount(prev => prev - 1);
        toast({ title: 'Deixou de seguir' });
      } else {
        await supabase
          .from('affiliate_follows')
          .insert({
            follower_id: myAffiliate.id,
            following_id: affiliateId,
          });
        
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
        toast({ title: 'Seguindo!' });
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!affiliate || !profile) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Perfil não encontrado.</p>
        <Button variant="link" onClick={() => navigate('/vip/network')}>
          Voltar para a rede
        </Button>
      </div>
    );
  }

  const tier = tierConfig[affiliate.tier] || tierConfig.bronze;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate('/vip/network')}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar para a rede
      </Button>

      {/* Cover & Avatar */}
      <Card className="overflow-hidden mb-6">
        <div className={`h-32 sm:h-48 bg-gradient-to-r ${tier.color}`}>
          {profile.cover_image_url && (
            <img 
              src={profile.cover_image_url} 
              alt="Cover" 
              className="w-full h-full object-cover opacity-50"
            />
          )}
        </div>
        <CardContent className="relative pt-0">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 sm:-mt-16">
            <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-background shadow-lg">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                {profile.name?.charAt(0) || 'A'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-foreground">
                      {profile.name || 'Afiliado VIP'}
                    </h1>
                    <Badge className={`bg-gradient-to-r ${tier.color} text-white flex items-center gap-1`}>
                      {tier.icon}
                      {tier.label}
                    </Badge>
                    {affiliate.is_creator && (
                      <Badge variant="outline">
                        <Briefcase className="h-3 w-3 mr-1" />
                        Creator
                      </Badge>
                    )}
                  </div>
                  {profile.headline && (
                    <p className="text-muted-foreground mt-1">{profile.headline}</p>
                  )}
                  {profile.location && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {profile.location}
                    </p>
                  )}
                </div>
                
                {myAffiliate?.id !== affiliateId && (
                  <Button
                    onClick={handleFollow}
                    disabled={followLoading}
                    variant={isFollowing ? "outline" : "default"}
                  >
                    {followLoading ? (
                      'Carregando...'
                    ) : isFollowing ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Seguindo
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Seguir
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-6 mt-6 pt-6 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{followersCount}</p>
              <p className="text-sm text-muted-foreground">Seguidores</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{followingCount}</p>
              <p className="text-sm text-muted-foreground">Seguindo</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{affiliate.referral_count || 0}</p>
              <p className="text-sm text-muted-foreground">Indicações</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{posts.length}</p>
              <p className="text-sm text-muted-foreground">Posts</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="about" className="space-y-6">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="about">Sobre</TabsTrigger>
          <TabsTrigger value="posts">Publicações</TabsTrigger>
          <TabsTrigger value="network">Rede</TabsTrigger>
        </TabsList>

        <TabsContent value="about">
          <div className="grid gap-6">
            {/* Bio */}
            {profile.bio && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Sobre
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">{profile.bio}</p>
                </CardContent>
              </Card>
            )}

            {/* Social Links */}
            {(profile.linkedin_url || profile.website_url || profile.instagram_url) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Links
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {profile.linkedin_url && (
                    <a 
                      href={profile.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      LinkedIn
                    </a>
                  )}
                  {profile.website_url && (
                    <a 
                      href={profile.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Website
                    </a>
                  )}
                  {profile.instagram_url && (
                    <a 
                      href={profile.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Instagram
                    </a>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Member Since */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Calendar className="h-5 w-5" />
                  <span>
                    Membro desde {format(new Date(affiliate.created_at), "MMMM 'de' yyyy", { locale: ptBR })}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="posts">
          {posts.length === 0 ? (
            <Card className="p-12 text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma publicação</h3>
              <p className="text-muted-foreground">
                Este afiliado ainda não publicou nada.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {posts.map(post => (
                <Card key={post.id}>
                  <CardContent className="p-4">
                    <h3 className="font-semibold">{post.title}</h3>
                    <p className="text-muted-foreground mt-2 line-clamp-3">{post.content}</p>
                    <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                      <span>{post.likes_count || 0} curtidas</span>
                      <span>{post.comments_count || 0} comentários</span>
                      <span>{format(new Date(post.created_at), 'dd/MM/yyyy')}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/vip/network/blog')}
              >
                Ver todas as publicações no blog
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="network">
          <Card className="p-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Rede de Conexões</h3>
            <p className="text-muted-foreground mb-4">
              Veja quem {profile.name} segue e quem o segue.
            </p>
            <Button onClick={() => navigate('/vip/network')}>
              Explorar a Rede
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
