import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Star, Zap, Filter, Sparkles, Crown, Search, Package, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useCart } from "@/contexts/CartContext";
import { ShopHeroScene } from "@/components/3d/ShopHeroScene";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ProductPreviewModal } from "@/components/ProductPreviewModal";
import { ProductCard } from "@/components/ProductCard";
import { formatProductPrice } from "@/lib/products";

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
  created_at: string;
  affiliate_free?: boolean;
  pricing_type?: 'one_time' | 'subscription' | 'free';
}

type SortOption = "relevance" | "price-asc" | "price-desc" | "popular" | "newest";
type CategoryFilter = "all" | "course" | "ebook" | "mentoring" | "live_event" | "files" | "combo";

const categoryLabels: Record<string, string> = {
  all: "Todos",
  course: "Cursos",
  ebook: "E-books",
  mentoring: "Mentorias",
  live_event: "Eventos",
  files: "Arquivos",
  combo: "Combos",
};

const Sales = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("relevance");
  const [searchQuery, setSearchQuery] = useState("");
  const [addedProducts, setAddedProducts] = useState<Set<string>>(new Set());
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { addItem, items } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Capture referral code (consistent key with Home.tsx)
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      localStorage.setItem('affiliate_ref_code', refCode);
      localStorage.setItem('affiliate_ref_timestamp', Date.now().toString());
    }
  }, [searchParams]);

  // Load products from database
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('id, name, slug, description, short_description, cover_image_url, price, original_price, product_type, created_at, affiliate_free, pricing_type')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os produtos.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.cover_image_url || "",
    });
    setAddedProducts(prev => new Set(prev).add(product.id));
    toast({
      title: "Adicionado ao carrinho!",
      description: `${product.name} foi adicionado.`,
    });
  };

  const handleOpenModal = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleBuyNow = (product: Product) => {
    // Add to cart and navigate to checkout
    if (!isInCart(product.id)) {
      handleAddToCart(product);
    }
    setIsModalOpen(false);
    navigate('/checkout');
  };

  const isInCart = (productId: string) => {
    return items.some(item => item.id === productId) || addedProducts.has(productId);
  };

  // formatPrice using utility function
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };
  
  // Get formatted price info for product
  const getPriceDisplay = (product: Product) => {
    return formatProductPrice({
      price: product.price,
      original_price: product.original_price,
      affiliate_free: product.affiliate_free,
      pricing_type: product.pricing_type,
    });
  };

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // Search filter
    if (searchQuery) {
      result = result.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter !== "all") {
      result = result.filter((product) => product.product_type === categoryFilter);
    }

    // Sort
    switch (sortOption) {
      case "price-asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "newest":
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      default:
        break;
    }

    return result;
  }, [products, categoryFilter, sortOption, searchQuery]);

  return (
    <div className="min-h-screen bg-gradient-tech">
      {/* Hero Section - Responsive */}
      <section className="relative py-12 sm:py-16 md:py-24 px-4 overflow-hidden min-h-[40vh] sm:min-h-[50vh] md:min-h-[60vh] flex items-center">
        <ShopHeroScene />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
        
        <div className="absolute top-1/4 left-1/4 w-48 sm:w-72 md:w-96 h-48 sm:h-72 md:h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-36 sm:w-56 md:w-72 h-36 sm:h-56 md:h-72 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="container mx-auto text-center relative z-10 px-2"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-full bg-background/20 backdrop-blur-xl border border-white/10 shadow-lg mb-4 sm:mb-8"
          >
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-primary animate-pulse" />
            <span className="text-xs sm:text-sm font-medium text-gradient-primary">Ofertas Exclusivas</span>
            <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-secondary" />
          </motion.div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-3 sm:mb-6 drop-shadow-glow">
            Loja <span className="text-gradient-primary">SKY</span>
          </h1>
          <p className="text-sm sm:text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto mb-4 sm:mb-8 drop-shadow-lg px-2">
            Descubra nossos produtos e serviços premium para transformar seu negócio digital
          </p>

          {/* Cart Button */}
          <Button
            variant="glass"
            size="default"
            onClick={() => navigate('/checkout')}
            className="gap-2 text-sm sm:text-base"
          >
            <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
            Ver Carrinho ({items.length})
          </Button>
        </motion.div>
      </section>

      {/* Filters - Responsive */}
      <section className="py-4 sm:py-6 md:py-8 px-3 sm:px-4 relative">
        <div className="container mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl bg-background/40 backdrop-blur-xl border border-border/30 shadow-xl"
          >
            <div className="flex flex-col gap-3 sm:gap-4 md:gap-6">
              {/* Search */}
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar produtos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background/50 backdrop-blur-sm border-border/30 text-sm"
                />
              </div>

              {/* Category Filters */}
              <div className="w-full overflow-x-auto pb-1">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <div className="p-1 sm:p-1.5 rounded-lg bg-primary/10">
                    <Filter className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-muted-foreground">Categoria:</span>
                </div>
                <Tabs value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as CategoryFilter)}>
                  <TabsList className="inline-flex w-auto min-w-full sm:min-w-0 bg-background/50 backdrop-blur-sm border border-border/30 h-auto p-1">
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <TabsTrigger 
                        key={key} 
                        value={key} 
                        className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 data-[state=active]:bg-primary/20 whitespace-nowrap"
                      >
                        {label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>

              {/* Sort Options */}
              <div className="w-full sm:w-auto">
                <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
                  <SelectTrigger className="w-full sm:w-[180px] bg-background/50 backdrop-blur-sm border-border/30 text-sm">
                    <SelectValue placeholder="Ordenar" />
                  </SelectTrigger>
                  <SelectContent className="bg-background/90 backdrop-blur-xl border-border/30">
                    <SelectItem value="relevance">Relevância</SelectItem>
                    <SelectItem value="newest">Mais Recentes</SelectItem>
                    <SelectItem value="price-asc">Menor Preço</SelectItem>
                    <SelectItem value="price-desc">Maior Preço</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border/20">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Mostrando <span className="text-primary font-semibold">{filteredAndSortedProducts.length}</span> {filteredAndSortedProducts.length === 1 ? "produto" : "produtos"}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Products Grid - Responsive */}
      <section className="py-8 sm:py-12 md:py-16 px-3 sm:px-4">
        <div className="container mx-auto">
          {isLoading ? (
            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Card key={i} className="h-[280px] sm:h-[320px] bg-background/40 backdrop-blur-xl border-border/30 animate-pulse">
                  <div className="h-32 sm:h-40 bg-muted" />
                  <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                    <div className="h-4 sm:h-5 bg-muted rounded w-3/4" />
                    <div className="h-3 sm:h-4 bg-muted rounded w-full" />
                    <div className="h-6 sm:h-8 bg-muted rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredAndSortedProducts.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 sm:py-12 px-4 sm:px-8 rounded-xl sm:rounded-2xl bg-background/40 backdrop-blur-xl border border-border/30"
            >
              <Package className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-muted-foreground" />
              <p className="text-muted-foreground text-sm sm:text-lg mb-3 sm:mb-4">
                Nenhum produto encontrado.
              </p>
              <Button onClick={() => { setCategoryFilter("all"); setSearchQuery(""); }} variant="glass" size="sm">
                Ver todos os produtos
              </Button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {filteredAndSortedProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={index}
                  isInCart={isInCart(product.id)}
                  onAddToCart={handleAddToCart}
                  onOpenModal={handleOpenModal}
                  formatPrice={formatPrice}
                  categoryLabels={categoryLabels}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        
        <div className="container mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Por que comprar na <span className="text-gradient-primary">SKY</span>?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Oferecemos a melhor experiência de compra com garantias exclusivas
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Check, title: "Garantia de Qualidade", desc: "Todos os produtos com garantia de satisfação ou seu dinheiro de volta", color: "primary" },
              { icon: Star, title: "Suporte Premium", desc: "Atendimento especializado para tirar todas as suas dúvidas", color: "secondary" },
              { icon: Zap, title: "Acesso Instantâneo", desc: "Receba acesso imediato após a confirmação do pagamento", color: "accent" },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="p-8 rounded-2xl bg-background/40 backdrop-blur-xl border border-white/10 hover:border-primary/30 text-center transition-all duration-300"
              >
                <div className={`w-16 h-16 mx-auto mb-5 rounded-2xl bg-${feature.color}/10 border border-${feature.color}/20 flex items-center justify-center`}>
                  <feature.icon className={`w-8 h-8 text-${feature.color}`} />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      {/* Product Preview Modal */}
      <ProductPreviewModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddToCart={(product) => {
          handleAddToCart(product);
          setIsModalOpen(false);
        }}
        onBuyNow={handleBuyNow}
        isInCart={selectedProduct ? isInCart(selectedProduct.id) : false}
      />
    </div>
  );
};

export default Sales;
