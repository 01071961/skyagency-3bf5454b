import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Star, Clock, Users, Play, FileText, Video, Sparkles, Filter, Search, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { ProductShareButton } from '@/components/ProductShareButton';
import SEOHead from '@/components/SEOHead';

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
  pricing_type: string;
  max_installments: number | null;
}

const productTypeIcons: Record<string, React.ReactNode> = {
  course: <Play className="w-4 h-4" />,
  ebook: <FileText className="w-4 h-4" />,
  mentoring: <Users className="w-4 h-4" />,
  live_event: <Video className="w-4 h-4" />,
  files: <FileText className="w-4 h-4" />,
  combo: <Sparkles className="w-4 h-4" />,
};

const productTypeLabels: Record<string, string> = {
  course: 'Curso',
  ebook: 'E-book',
  mentoring: 'Mentoria',
  live_event: 'Evento ao Vivo',
  files: 'Arquivos',
  combo: 'Combo',
};

const Shop = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addItem } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  // Capturar código de afiliado da URL e salvar no localStorage
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      localStorage.setItem('affiliate_ref_code', refCode);
      localStorage.setItem('affiliate_ref_timestamp', Date.now().toString());
    }
  }, [searchParams]);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterAndSortProducts();
  }, [products, searchQuery, selectedType, sortBy]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os produtos.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortProducts = () => {
    let filtered = [...products];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(p => p.product_type === selectedType);
    }

    // Sort
    switch (sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        // Already sorted by created_at desc
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    setFilteredProducts(filtered);
  };

  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.cover_image_url || undefined,
    });
    toast({
      title: 'Adicionado ao carrinho!',
      description: `${product.name} foi adicionado ao seu carrinho.`,
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const calculateDiscount = (price: number, originalPrice: number | null) => {
    if (!originalPrice || originalPrice <= price) return null;
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  };

  return (
    <>
      <SEOHead
        title="Loja | SKY BRASIL - Produtos Digitais para Streamers"
        description="Cursos, mentorias, e-books e ferramentas exclusivas para streamers. Aprenda com os melhores e acelere sua carreira no streaming."
        keywords="cursos streaming, mentoria streamer, e-book streaming, produtos digitais streamer"
      />

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative py-12 sm:py-20 overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-48 sm:w-96 h-48 sm:h-96 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-48 sm:w-96 h-48 sm:h-96 bg-secondary/10 rounded-full blur-3xl" />
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-3xl mx-auto"
            >
              <Badge className="mb-3 sm:mb-4 bg-primary/10 text-primary border-primary/20 text-xs sm:text-sm">
                <Sparkles className="w-3 h-3 mr-1" />
                Produtos Exclusivos
              </Badge>
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-foreground mb-3 sm:mb-4">
                Loja de Produtos Digitais
              </h1>
              <p className="text-sm sm:text-lg text-muted-foreground px-4">
                Cursos, mentorias e ferramentas para impulsionar sua carreira no streaming
              </p>
            </motion.div>
          </div>
        </section>

        {/* Filters */}
        <section className="py-4 sm:py-8 border-b border-border">
          <div className="container mx-auto px-3 sm:px-4">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar produtos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 text-sm"
                  />
                </div>
                
                <div className="flex gap-2 sm:gap-4 w-full sm:w-auto">
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="w-full sm:w-36">
                      <Filter className="w-4 h-4 mr-2 flex-shrink-0" />
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

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Ordenar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Mais recentes</SelectItem>
                      <SelectItem value="price-asc">Menor preço</SelectItem>
                      <SelectItem value="price-desc">Maior preço</SelectItem>
                      <SelectItem value="name">Nome A-Z</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Products Grid */}
        <section className="py-6 sm:py-12">
          <div className="container mx-auto px-3 sm:px-4">
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-card rounded-xl sm:rounded-2xl overflow-hidden animate-pulse">
                    <div className="aspect-video bg-muted" />
                    <div className="p-3 sm:p-6 space-y-3 sm:space-y-4">
                      <div className="h-3 sm:h-4 bg-muted rounded w-1/4" />
                      <div className="h-4 sm:h-6 bg-muted rounded w-3/4" />
                      <div className="h-3 sm:h-4 bg-muted rounded w-full" />
                      <div className="h-8 sm:h-10 bg-muted rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12 sm:py-20">
                <ShoppingCart className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
                  Nenhum produto encontrado
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Tente ajustar os filtros ou a busca
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {filteredProducts.map((product, index) => {
                  const discount = calculateDiscount(product.price, product.original_price);
                  
                  return (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group bg-card border border-border rounded-xl sm:rounded-2xl overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5"
                    >
                      {/* Product Image */}
                      <div 
                        className="relative aspect-video bg-muted overflow-hidden cursor-pointer"
                        onClick={() => navigate(`/produto/${product.slug}`)}
                      >
                        {product.cover_image_url ? (
                          <img
                            src={product.cover_image_url}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                            {productTypeIcons[product.product_type] || <ShoppingCart className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground" />}
                          </div>
                        )}
                        
                        {/* Discount Badge */}
                        {discount && (
                          <Badge className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-destructive text-destructive-foreground text-xs">
                            -{discount}%
                          </Badge>
                        )}
                        
                        {/* Type Badge */}
                        <Badge className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-background/80 text-foreground backdrop-blur-sm text-xs">
                          {productTypeIcons[product.product_type]}
                          <span className="ml-1 hidden sm:inline">{productTypeLabels[product.product_type]}</span>
                        </Badge>
                      </div>

                      {/* Product Info */}
                      <div className="p-3 sm:p-5">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 
                            className="font-semibold text-foreground text-sm sm:text-lg line-clamp-2 group-hover:text-primary transition-colors flex-1 cursor-pointer"
                            onClick={() => navigate(`/produto/${product.slug}`)}
                          >
                            {product.name}
                          </h3>
                          <div className="flex-shrink-0">
                            <ProductShareButton 
                              productName={product.name}
                              productSlug={product.slug}
                              productUrl={`${window.location.origin}/produto/${product.slug}`}
                              price={product.price}
                              productImage={product.cover_image_url || undefined}
                            />
                          </div>
                        </div>
                        
                        {product.short_description && (
                          <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 line-clamp-2">
                            {product.short_description}
                          </p>
                        )}

                        {/* Price */}
                        <div className="mb-3 sm:mb-4">
                          {product.original_price && product.original_price > product.price && (
                            <span className="text-xs sm:text-sm text-muted-foreground line-through mr-2">
                              {formatPrice(product.original_price)}
                            </span>
                          )}
                          <span className="text-lg sm:text-2xl font-bold text-primary">
                            {formatPrice(product.price)}
                          </span>
                          {product.max_installments && product.max_installments > 1 && (
                            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                              ou {product.max_installments}x de {formatPrice(product.price / product.max_installments)}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                          <Button
                            onClick={() => handleAddToCart(product)}
                            className="w-full bg-primary hover:bg-primary/90 text-sm"
                            size="sm"
                          >
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Adicionar
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => navigate(`/produto/${product.slug}`)}
                            className="w-full text-sm"
                            size="sm"
                          >
                            Ver Detalhes
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-10 sm:py-16 bg-gradient-to-r from-primary/10 to-secondary/10">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-xl sm:text-3xl font-bold text-foreground mb-3 sm:mb-4">
              Quer criar seus próprios produtos?
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
              Seja um afiliado SKY BRASIL e ganhe comissões vendendo nossos produtos ou crie sua própria linha de produtos digitais.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-center w-full max-w-md mx-auto px-4">
              <Button
                size="default"
                onClick={() => navigate('/auth?portal=affiliate')}
                className="w-full sm:w-auto bg-gradient-to-r from-primary to-secondary"
              >
                Tornar-se Afiliado
              </Button>
              <Button
                size="default"
                variant="outline"
                onClick={() => navigate('/contato')}
                className="w-full sm:w-auto"
              >
                Fale Conosco
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Shop;
