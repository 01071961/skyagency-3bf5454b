import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Image, FileText, Copy, Download, ExternalLink, 
  Share2, Check, Lightbulb, Smartphone, Monitor,
  Instagram, Facebook, MessageCircle, Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';

interface Banner {
  id: string;
  name: string;
  url: string;
  size: string;
}

interface PostTemplate {
  id: string;
  title: string;
  content: string;
  platform: string;
}

export default function VIPMaterials() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [affiliate, setAffiliate] = useState<any>(null);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [postTemplates, setPostTemplates] = useState<PostTemplate[]>([]);
  const [tips, setTips] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?redirect=/vip/materials');
      return;
    }
    if (user) {
      loadData();
    }
  }, [user, authLoading, navigate]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;

      if (!token) {
        navigate('/auth?redirect=/vip/materials');
        return;
      }

      // Get affiliate info
      const affiliateRes = await supabase.functions.invoke('affiliate-actions', {
        body: { action: 'get_stats' },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (affiliateRes.data?.success) {
        setAffiliate(affiliateRes.data.affiliate);
      }

      // Get marketing materials
      const materialsRes = await supabase.functions.invoke('affiliate-actions', {
        body: { action: 'get_marketing_materials' },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (materialsRes.data?.success) {
        setBanners(materialsRes.data.materials.banners || []);
        setPostTemplates(materialsRes.data.materials.postTemplates || []);
        setTips(materialsRes.data.materials.tips || []);
      }
    } catch (error) {
      console.error('Erro ao carregar materiais:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    const finalText = text.replace('{LINK}', `${window.location.origin}/vendas?ref=${affiliate?.referral_code || ''}`);
    navigator.clipboard.writeText(finalText);
    setCopiedId(id);
    toast({ title: 'Copiado!', description: 'Texto copiado para a área de transferência.' });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram': return <Instagram className="h-4 w-4" />;
      case 'facebook': return <Facebook className="h-4 w-4" />;
      case 'whatsapp': return <MessageCircle className="h-4 w-4" />;
      case 'telegram': return <Send className="h-4 w-4" />;
      default: return <Share2 className="h-4 w-4" />;
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Carregando materiais...</p>
        </div>
      </div>
    );
  }

  if (!affiliate || affiliate.status !== 'approved') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-2">Acesso Restrito</h2>
            <p className="text-muted-foreground mb-4">
              Você precisa ser um afiliado aprovado para acessar os materiais de marketing.
            </p>
            <Button onClick={() => navigate('/vip/affiliate/register')}>
              Tornar-se Afiliado
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-background border-b border-border">
        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Image className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary">Materiais de Marketing</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground">
              Materiais Prontos para Divulgação
            </h1>
            <p className="text-muted-foreground mt-2">
              Banners, templates de posts e dicas para maximizar suas conversões
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Affiliate Link Reminder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-foreground">Seu Link de Afiliado</p>
                  <code className="text-sm text-muted-foreground">
                    {window.location.origin}/vendas?ref={affiliate?.referral_code}
                  </code>
                </div>
                <Button 
                  size="sm"
                  onClick={() => copyToClipboard(`${window.location.origin}/vendas?ref=${affiliate?.referral_code}`, 'main-link')}
                >
                  {copiedId === 'main-link' ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                  {copiedId === 'main-link' ? 'Copiado!' : 'Copiar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <Tabs defaultValue="templates" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="templates">
              <FileText className="h-4 w-4 mr-2" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="banners">
              <Image className="h-4 w-4 mr-2" />
              Banners
            </TabsTrigger>
            <TabsTrigger value="tips">
              <Lightbulb className="h-4 w-4 mr-2" />
              Dicas
            </TabsTrigger>
          </TabsList>

          {/* Post Templates */}
          <TabsContent value="templates">
            <div className="grid gap-4">
              {postTemplates.map((template, index) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {getPlatformIcon(template.platform)}
                          {template.title}
                        </CardTitle>
                        <Badge variant="secondary" className="capitalize">
                          {template.platform}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4 whitespace-pre-wrap">
                        {template.content.replace('{LINK}', `${window.location.origin}/vendas?ref=${affiliate?.referral_code}`)}
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => copyToClipboard(template.content, template.id)}
                      >
                        {copiedId === template.id ? (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-1" />
                            Copiar Texto
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Banners */}
          <TabsContent value="banners">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {banners.map((banner, index) => (
                <motion.div
                  key={banner.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{banner.name}</CardTitle>
                        <Badge variant="outline">{banner.size}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted rounded-lg p-4 flex items-center justify-center mb-4 min-h-[100px]">
                        {banner.size === '728x90' && <Monitor className="h-12 w-12 text-muted-foreground" />}
                        {banner.size === '300x250' && <Image className="h-12 w-12 text-muted-foreground" />}
                        {banner.size === '160x600' && <Image className="h-12 w-12 text-muted-foreground" />}
                        {banner.size === '1080x1920' && <Smartphone className="h-12 w-12 text-muted-foreground" />}
                      </div>
                      <p className="text-xs text-muted-foreground mb-4">
                        Dimensões: {banner.size}px
                      </p>
                      <Button variant="outline" size="sm" className="w-full" disabled>
                        <Download className="h-4 w-4 mr-1" />
                        Baixar Banner (Em breve)
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
            
            <Card className="mt-6 bg-muted/50">
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">
                  🎨 Novos banners personalizados em breve! Enquanto isso, use os templates de texto acima.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tips */}
          <TabsContent value="tips">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  Dicas para Aumentar suas Conversões
                </CardTitle>
                <CardDescription>
                  Estratégias comprovadas para maximizar suas comissões
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {tips.map((tip, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-primary">{index + 1}</span>
                      </div>
                      <p className="text-muted-foreground pt-1">{tip}</p>
                    </motion.li>
                  ))}
                </ul>

                <div className="mt-8 p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Links Úteis
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigate('/vip/affiliate/products')}>
                      Ver Produtos
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigate('/vip/referrals')}>
                      Minhas Indicações
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigate('/vip/rewards')}>
                      Recompensas
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Equipment Guide */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5 text-primary" />
                  Guia de Equipamentos para Streamers
                </CardTitle>
                <CardDescription>
                  O que recomendar para sua audiência
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 text-emerald-500">Setup Mínimo</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Smartphone com boa câmera</li>
                      <li>• Ring light básico</li>
                      <li>• Microfone lapela</li>
                      <li>• Internet estável (mínimo 10Mbps upload)</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3 text-primary">Setup Avançado</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Câmera DSLR ou mirrorless</li>
                      <li>• Interface de áudio</li>
                      <li>• Iluminação profissional (softbox)</li>
                      <li>• OBS Studio ou StreamYard</li>
                      <li>• Microfone condensador</li>
                    </ul>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Nichos que Mais Monetizam</h4>
                  <div className="flex flex-wrap gap-2">
                    {['Reações', 'Games', 'Aulas', 'Mentorias', 'Entretenimento', 'Vendas ao Vivo', 'Lifestyle'].map((niche) => (
                      <Badge key={niche} variant="secondary">{niche}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
