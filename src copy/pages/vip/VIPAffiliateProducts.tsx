import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Link2, Copy, ExternalLink, Search, Filter, 
  TrendingUp, DollarSign, ShoppingBag, CheckCircle,
  Package, Eye, Zap, Share2, Crown, Unlock, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';
import { useNavigate } from 'react-router-dom';
import ShareProductDialog from '@/components/ShareProductDialog';
import { formatProductPrice, calculateCommission as calcCommission, canAccessAffiliateFreeProduct } from '@/lib/products';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  cover_image_url: string | null;
  price: number;
  original_price: number | null;
  product_type: string;
  affiliate_enabled: boolean;
  affiliate_commission_rate: number | null;
  affiliate_free?: boolean;
  affiliate_free_tiers?: string[];
  pricing_type?: 'one_time' | 'subscription' | 'free';
}

interface Affiliate {
  id: string;
  referral_code: string;
  commission_rate: number;
  status: string;
  tier?: string;
}

interface Enrollment {
  product_id: string;
}

const productTypeLabels: Record<string, string> = {
  course: 'Curso',
  ebook: 'E-book',
  mentoring: 'Mentoria',
  live_event: 'Evento ao Vivo',
  files: 'Arquivos',
  combo: 'Combo',
};

export default function VIPAffiliateProducts() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [accessingProduct, setAccessingProduct] = useState<string | null>(null);
  
  // Product detail dialog
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  // Share dialog
  const [shareProduct, setShareProduct] = useState<Product | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?redirect=/vip/affiliate/products');
      return;
    }
    if (user) {
      loadData();
    }
  }, [user, authLoading, navigate]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      const { data: affiliateData, error: affiliateError } = await supabase
        .from('vip_affiliates')
        .select('id, referral_code, commission_rate, status, tier')
        .eq('user_id', user?.id)
        .single();

      if (affiliateError || !affiliateData || affiliateData.status !== 'approved') {
        toast({
          title: 'Acesso Restrito',
          description: 'Você precisa ser um afiliado aprovado para acessar esta página.',
          variant: 'destructive',
        });
        navigate('/vip/dashboard');
        return;
      }

      setAffiliate(affiliateData);

      // Fetch products with affiliate program enabled
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, slug, description, short_description, cover_image_url, price, original_price, product_type, affiliate_enabled, affiliate_commission_rate, affiliate_free, affiliate_free_tiers, pricing_type')
        .eq('status', 'published')
        .eq('affiliate_enabled', true)
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;
      setProducts(productsData || []);

      // Fetch user's enrollments to check which products they already have access to
      const { data: enrollmentsData } = await supabase
        .from('enrollments')
        .select('product_id')
        .eq('user_id', user?.id)
        .eq('status', 'active');
      
      setEnrollments(enrollmentsData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os produtos.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isEnrolled = (productId: string): boolean => {
    return enrollments.some(e => e.product_id === productId);
  };

  const handleFreeAccess = async (product: Product) => {
    if (!user || !product.affiliate_free) return;
    
    setAccessingProduct(product.id);
    
    try {
      // Check if already enrolled
      if (isEnrolled(product.id)) {
        toast({
          title: 'Acesso Existente',
          description: 'Você já tem acesso a este produto!',
        });
        navigate('/vip/my-products');
        return;
      }

      // Create enrollment for VIP affiliate
      const { error: enrollError } = await supabase
        .from('enrollments')
        .insert({
          user_id: user.id,
          product_id: product.id,
          status: 'active',
          enrolled_at: new Date().toISOString(),
        });

      if (enrollError) {
        console.error('[VIPAffiliateProducts] Enrollment error:', enrollError);
        toast({
          title: 'Erro',
          description: 'Não foi possível liberar o acesso. Tente novamente.',
          variant: 'destructive',
        });
        return;
      }

      // Create notification for the user
      await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type: 'success',
          title: '🎁 Produto Liberado!',
          message: `Você tem acesso gratuito a "${product.name}" como benefício VIP.`,
          action_url: '/vip/my-products',
          data: { product_id: product.id, product_name: product.name, benefit: 'vip_affiliate_free' }
        });

      // Update local state
      setEnrollments(prev => [...prev, { product_id: product.id }]);
      
      toast({
        title: 'Acesso Liberado! 🎉',
        description: `Você agora tem acesso gratuito a "${product.name}" como benefício VIP!`,
      });
      
      // Navigate to course viewer
      navigate('/vip/my-products');
    } catch (err) {
      console.error('[VIPAffiliateProducts] Free access error:', err);
      toast({
        title: 'Erro',
        description: 'Erro ao processar. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setAccessingProduct(null);
    }
  };

  const getAffiliateLink = (productSlug: string) => {
    // Link direto para a página do produto com SEO próprio
    return `${window.location.origin}/produto/${productSlug}?ref=${affiliate?.referral_code}`;
  };

  const copyLink = (productId: string, productSlug: string) => {
    const link = getAffiliateLink(productSlug);
    navigator.clipboard.writeText(link);
    setCopiedId(productId);
    toast({
      title: 'Link copiado!',
      description: 'O link de afiliado foi copiado para sua área de transferência.',
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatPriceFn = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const calculateCommission = (price: number, productCommissionRate?: number | null) => {
    // Use product-specific commission rate if available, otherwise use affiliate's base rate
    const commissionRate = productCommissionRate ?? affiliate?.commission_rate ?? 0;
    return (price * commissionRate) / 100;
  };

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsDetailOpen(true);
  };

  const handleBuyNow = () => {
    if (selectedProduct) {
      // Open affiliate link in new tab (customer would buy through affiliate link)
      window.open(getAffiliateLink(selectedProduct.slug), '_blank');
    }
    setIsDetailOpen(false);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || product.product_type === selectedType;
    return matchesSearch && matchesType;
  });

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
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Meus Links de Afiliado</h1>
              <p className="text-muted-foreground mt-1">
                Compartilhe os links abaixo e ganhe {affiliate?.commission_rate}% de comissão por venda
              </p>
            </div>
            <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-sm">
              <DollarSign className="w-4 h-4 mr-1" />
              {affiliate?.commission_rate}% de comissão
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-primary/10 to-background border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Produtos Disponíveis</p>
                  <p className="text-3xl font-bold text-foreground">{products.length}</p>
                </div>
                <ShoppingBag className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500/10 to-background border-green-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Sua Comissão</p>
                  <p className="text-3xl font-bold text-foreground">{affiliate?.commission_rate}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-background border-blue-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Seu Código</p>
                  <p className="text-xl font-bold text-foreground font-mono">{affiliate?.referral_code}</p>
                </div>
                <Link2 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produtos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-full md:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="course">Cursos</SelectItem>
              <SelectItem value="ebook">E-books</SelectItem>
              <SelectItem value="mentoring">Mentorias</SelectItem>
              <SelectItem value="live_event">Eventos</SelectItem>
              <SelectItem value="combo">Combos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Nenhum produto encontrado</h3>
            <p className="text-muted-foreground">Tente ajustar os filtros ou a busca</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`overflow-hidden hover:border-primary/50 transition-all duration-300 h-full flex flex-col ${product.affiliate_free ? 'ring-2 ring-green-500/30' : ''}`}>
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
                        <Package className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                    <Badge className="absolute top-3 left-3 bg-background/80 text-foreground backdrop-blur-sm">
                      {productTypeLabels[product.product_type]}
                    </Badge>
                    {/* VIP Free Access Badge */}
                    {product.affiliate_free && (
                      <Badge className="absolute top-3 right-3 bg-green-500 text-white">
                        <Crown className="w-3 h-3 mr-1" />
                        Grátis para Você
                      </Badge>
                    )}
                    {!product.affiliate_free && product.original_price && product.original_price > product.price && (
                      <Badge className="absolute top-3 right-3 bg-accent text-accent-foreground">
                        <Zap className="w-3 h-3 mr-1" />
                        {Math.round(((product.original_price - product.price) / product.original_price) * 100)}% OFF
                      </Badge>
                    )}
                  </div>

                  <CardContent className="p-5 space-y-4 flex-1">
                    <div>
                      <h3 className="font-semibold text-foreground text-lg mb-1 line-clamp-2">
                        {product.name}
                      </h3>
                      {product.short_description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {product.short_description}
                        </p>
                      )}
                    </div>

                    {/* Price and Commission - VIP Affiliate sees special pricing */}
                    {(() => {
                      const priceInfo = formatProductPrice(product, true, affiliate?.tier || null);
                      const commissionRate = product.affiliate_commission_rate || affiliate?.commission_rate || 0;
                      const commissionAmount = calcCommission(product.price, commissionRate, product.affiliate_free);
                      const hasAccess = isEnrolled(product.id);
                      
                      return (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              {hasAccess ? (
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="w-5 h-5 text-green-500" />
                                  <span className="text-green-500 font-semibold">Você tem acesso</span>
                                </div>
                              ) : (
                                <>
                                  <p className={`text-2xl font-bold ${priceInfo.color}`}>{priceInfo.display}</p>
                                  {priceInfo.regularPrice && (
                                    <p className="text-xs text-muted-foreground">
                                      Valor regular: {priceInfo.regularPrice}
                                    </p>
                                  )}
                                  {priceInfo.badge && (
                                    <Badge className={`${priceInfo.badgeColor} text-xs mt-1`}>
                                      <Crown className="w-3 h-3 mr-1" />
                                      {priceInfo.badge}
                                    </Badge>
                                  )}
                                </>
                              )}
                            </div>
                            {!product.affiliate_free && (
                              <div className="text-right">
                                <p className="text-sm text-muted-foreground">
                                  Sua comissão ({commissionRate}%)
                                </p>
                                <p className="text-lg font-bold text-green-500">
                                  {formatPriceFn(commissionAmount)}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* VIP Free Access Button */}
                          {product.affiliate_free && !hasAccess && (
                            <Button
                              className="w-full bg-green-500 hover:bg-green-600 text-white"
                              onClick={() => handleFreeAccess(product)}
                              disabled={accessingProduct === product.id}
                            >
                              {accessingProduct === product.id ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Liberando acesso...
                                </>
                              ) : (
                                <>
                                  <Unlock className="w-4 h-4 mr-2" />
                                  Acessar Gratuitamente
                                </>
                              )}
                            </Button>
                          )}

                          {/* Already has access button */}
                          {hasAccess && (
                            <Button
                              className="w-full"
                              variant="default"
                              onClick={() => navigate('/vip/my-products')}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Ir para Meus Cursos
                            </Button>
                          )}
                        </div>
                      );
                    })()}

                    {/* Affiliate Link */}
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Seu link de afiliado:</p>
                      <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                        <code className="flex-1 text-xs truncate">
                          {getAffiliateLink(product.slug)}
                        </code>
                        <Button
                          size="sm"
                          variant={copiedId === product.id ? 'default' : 'outline'}
                          onClick={() => copyLink(product.id, product.slug)}
                          className="shrink-0"
                        >
                          {copiedId === product.id ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>

                  {/* Actions */}
                  <CardFooter className="p-5 pt-0 flex gap-2">
                    <Button
                      variant="gradient-outline"
                      className="flex-1"
                      onClick={() => handleViewProduct(product)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Detalhes
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setShareProduct(product);
                        setIsShareOpen(true);
                      }}
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Compartilhar
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Product Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedProduct?.name}</DialogTitle>
            <DialogDescription>
              Visualize os detalhes e compartilhe seu link de afiliado
            </DialogDescription>
          </DialogHeader>

          {selectedProduct && (
            <div className="space-y-4">
              {/* Image */}
              {selectedProduct.cover_image_url ? (
                <img
                  src={selectedProduct.cover_image_url}
                  alt={selectedProduct.name}
                  className="w-full h-48 object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center">
                  <Package className="w-16 h-16 text-muted-foreground" />
                </div>
              )}

              {/* Details */}
              <div>
                <Badge className="mb-2">{productTypeLabels[selectedProduct.product_type]}</Badge>
                <p className="text-muted-foreground">
                  {selectedProduct.description || selectedProduct.short_description}
                </p>
              </div>

              {/* Pricing */}
              {(() => {
                const priceInfo = formatProductPrice(selectedProduct, true, affiliate?.tier || null);
                const commissionRate = selectedProduct.affiliate_commission_rate || affiliate?.commission_rate || 0;
                const commissionAmount = calcCommission(selectedProduct.price, commissionRate, selectedProduct.affiliate_free);
                const hasAccess = isEnrolled(selectedProduct.id);
                
                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div>
                        {hasAccess ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="text-green-500 font-semibold text-lg">Você tem acesso!</span>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm text-muted-foreground">
                              {selectedProduct.affiliate_free ? 'Seu benefício VIP' : 'Preço de Venda'}
                            </p>
                            <p className={`text-2xl font-bold ${priceInfo.color}`}>{priceInfo.display}</p>
                            {priceInfo.regularPrice && (
                              <p className="text-xs text-muted-foreground">
                                Valor regular: {priceInfo.regularPrice}
                              </p>
                            )}
                            {priceInfo.badge && (
                              <Badge className={`${priceInfo.badgeColor} text-xs mt-1`}>
                                <Crown className="w-3 h-3 mr-1" />
                                {priceInfo.badge}
                              </Badge>
                            )}
                          </>
                        )}
                      </div>
                      {!selectedProduct.affiliate_free && !hasAccess && (
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Sua Comissão ({commissionRate}%)</p>
                          <p className="text-2xl font-bold text-green-500">
                            {formatPriceFn(commissionAmount)}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* VIP Free Access Button in Dialog */}
                    {selectedProduct.affiliate_free && !hasAccess && (
                      <Button
                        className="w-full bg-green-500 hover:bg-green-600 text-white"
                        onClick={() => handleFreeAccess(selectedProduct)}
                        disabled={accessingProduct === selectedProduct.id}
                      >
                        {accessingProduct === selectedProduct.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Liberando acesso...
                          </>
                        ) : (
                          <>
                            <Unlock className="w-4 h-4 mr-2" />
                            Acessar Gratuitamente (Benefício VIP)
                          </>
                        )}
                      </Button>
                    )}

                    {hasAccess && (
                      <Button
                        className="w-full"
                        onClick={() => navigate('/members/courses')}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ir para Meus Cursos
                      </Button>
                    )}
                  </div>
                );
              })()}

              {/* Affiliate Link */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Seu Link de Afiliado:</p>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <code className="flex-1 text-xs break-all">
                    {getAffiliateLink(selectedProduct.slug)}
                  </code>
                  <Button
                    size="sm"
                    variant={copiedId === selectedProduct.id ? 'default' : 'outline'}
                    onClick={() => copyLink(selectedProduct.id, selectedProduct.slug)}
                  >
                    {copiedId === selectedProduct.id ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
              Fechar
            </Button>
            {selectedProduct && !selectedProduct.affiliate_free && !isEnrolled(selectedProduct.id) && (
              <Button onClick={handleBuyNow}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Abrir Link de Venda
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      {shareProduct && affiliate && (
        <ShareProductDialog
          isOpen={isShareOpen}
          onClose={() => {
            setIsShareOpen(false);
            setShareProduct(null);
          }}
          productName={shareProduct.name}
          affiliateLink={getAffiliateLink(shareProduct.slug)}
          productImage={shareProduct.cover_image_url || undefined}
        />
      )}
    </div>
  );
}
