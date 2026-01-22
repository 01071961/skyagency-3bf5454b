import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, Download, ExternalLink, Play, FileText,
  BookOpen, Video, Users, Zap, Lock, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Enrollment {
  id: string;
  product_id: string;
  status: string;
  progress_percent: number;
  enrolled_at: string;
  expires_at: string | null;
  product: {
    id: string;
    name: string;
    description: string | null;
    short_description: string | null;
    cover_image_url: string | null;
    product_type: string;
    download_url: string | null;
    saas_url: string | null;
    gumroad_link: string | null;
  };
}

const productTypeConfig: Record<string, { icon: any; label: string; color: string }> = {
  course: { icon: Video, label: 'Curso Online', color: 'text-blue-500' },
  ebook: { icon: BookOpen, label: 'E-book', color: 'text-green-500' },
  mentoring: { icon: Users, label: 'Mentoria', color: 'text-purple-500' },
  live_event: { icon: Play, label: 'Evento ao Vivo', color: 'text-red-500' },
  files: { icon: FileText, label: 'Arquivos', color: 'text-orange-500' },
  combo: { icon: Package, label: 'Combo', color: 'text-pink-500' },
  software: { icon: Download, label: 'Software', color: 'text-cyan-500' },
  saas: { icon: Zap, label: 'SaaS', color: 'text-yellow-500' },
};

export default function VIPMyProducts() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?redirect=/vip/my-products');
      return;
    }
    if (user) {
      loadEnrollments();
    }
  }, [user, authLoading, navigate]);

  const loadEnrollments = async () => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          id, product_id, status, progress_percent, enrolled_at, expires_at,
          product:products (
            id, name, description, short_description, cover_image_url,
            product_type, download_url, saas_url, gumroad_link
          )
        `)
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .order('enrolled_at', { ascending: false });

      if (error) throw error;
      setEnrollments((data as any) || []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar seus produtos.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccessProduct = (enrollment: Enrollment) => {
    const product = enrollment.product;

    switch (product.product_type) {
      case 'course':
        // Navigate to course player/viewer within member area
        navigate(`/members/courses/${product.id}`);
        break;
      
      case 'ebook':
      case 'files':
      case 'software':
        // Download file
        if (product.download_url) {
          window.open(product.download_url, '_blank');
          toast({
            title: 'Download iniciado!',
            description: 'Seu arquivo está sendo baixado.',
          });
        } else {
          toast({
            title: 'Link não disponível',
            description: 'Entre em contato com o suporte.',
            variant: 'destructive',
          });
        }
        break;

      case 'saas':
        // Open SaaS tool
        if (product.saas_url) {
          window.open(product.saas_url, '_blank');
        } else {
          toast({
            title: 'Acesso não disponível',
            description: 'Entre em contato com o suporte.',
            variant: 'destructive',
          });
        }
        break;

      case 'mentoring':
      case 'live_event':
        // Open event/mentoring details
        toast({
          title: 'Em breve!',
          description: 'Você receberá instruções por email.',
        });
        break;

      default:
        if (product.gumroad_link) {
          window.open(product.gumroad_link, '_blank');
        }
    }
  };

  const getActionButton = (enrollment: Enrollment) => {
    const product = enrollment.product;
    const config = productTypeConfig[product.product_type] || productTypeConfig.files;

    switch (product.product_type) {
      case 'course':
        return (
          <Button onClick={() => handleAccessProduct(enrollment)} className="w-full">
            <Play className="w-4 h-4 mr-2" />
            Assistir Curso
          </Button>
        );
      
      case 'ebook':
        return (
          <Button onClick={() => handleAccessProduct(enrollment)} className="w-full" variant="default">
            <Download className="w-4 h-4 mr-2" />
            Baixar E-book
          </Button>
        );

      case 'files':
      case 'software':
        return (
          <Button onClick={() => handleAccessProduct(enrollment)} className="w-full" variant="default">
            <Download className="w-4 h-4 mr-2" />
            Baixar Arquivo
          </Button>
        );

      case 'saas':
        return (
          <Button onClick={() => handleAccessProduct(enrollment)} className="w-full">
            <ExternalLink className="w-4 h-4 mr-2" />
            Acessar Ferramenta
          </Button>
        );

      case 'mentoring':
        return (
          <Button onClick={() => handleAccessProduct(enrollment)} className="w-full" variant="outline">
            <Users className="w-4 h-4 mr-2" />
            Ver Detalhes
          </Button>
        );

      case 'live_event':
        return (
          <Button onClick={() => handleAccessProduct(enrollment)} className="w-full" variant="outline">
            <Play className="w-4 h-4 mr-2" />
            Acessar Evento
          </Button>
        );

      default:
        return (
          <Button onClick={() => handleAccessProduct(enrollment)} className="w-full">
            <ExternalLink className="w-4 h-4 mr-2" />
            Acessar
          </Button>
        );
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-background border-b border-border">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-foreground">Meus Produtos</h1>
          <p className="text-muted-foreground mt-1">
            Acesse os produtos que você comprou
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {enrollments.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Nenhum produto ainda</h3>
            <p className="text-muted-foreground mb-4">
              Você ainda não adquiriu nenhum produto.
            </p>
            <Button onClick={() => navigate('/vendas')}>
              Ver Produtos Disponíveis
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrollments.map((enrollment, index) => {
              const product = enrollment.product;
              const config = productTypeConfig[product.product_type] || productTypeConfig.files;
              const IconComponent = config.icon;

              return (
                <motion.div
                  key={enrollment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="overflow-hidden hover:border-primary/50 transition-all duration-300 h-full flex flex-col">
                    {/* Product Image */}
                    <div className="relative aspect-video bg-muted">
                      {product.cover_image_url ? (
                        <img
                          src={product.cover_image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                          <IconComponent className={`w-12 h-12 ${config.color}`} />
                        </div>
                      )}
                      <Badge className="absolute top-3 left-3 bg-background/80 text-foreground backdrop-blur-sm">
                        <IconComponent className={`w-3 h-3 mr-1 ${config.color}`} />
                        {config.label}
                      </Badge>
                    </div>

                    <CardContent className="p-5 space-y-4 flex-1 flex flex-col">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground text-lg mb-1 line-clamp-2">
                          {product.name}
                        </h3>
                        {product.short_description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {product.short_description}
                          </p>
                        )}
                      </div>

                      {/* Progress (for courses) */}
                      {product.product_type === 'course' && enrollment.progress_percent > 0 && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Progresso</span>
                            <span>{enrollment.progress_percent}%</span>
                          </div>
                          <Progress value={enrollment.progress_percent} className="h-2" />
                        </div>
                      )}

                      {/* Expiration */}
                      {enrollment.expires_at && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>
                            Expira em {format(new Date(enrollment.expires_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </span>
                        </div>
                      )}

                      {/* Action Button */}
                      {getActionButton(enrollment)}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
