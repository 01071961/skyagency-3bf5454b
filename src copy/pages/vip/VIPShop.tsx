import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ShoppingCart, Search, Filter, Star, Diamond,
  ArrowUpDown, Plus, Check, ChevronDown, ChevronUp, Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';
import { useCart } from '@/contexts/CartContext';

interface Product {
  id: string;
  name: string;
  description: string;
  short_description: string;
  price: number;
  original_price: number | null;
  cover_image_url: string | null;
  product_type: string;
  pricing_type: string;
}

type Category = 'all' | 'low_cost' | 'premium';
type SortOption = 'price_asc' | 'price_desc' | 'name' | 'newest';

// Componente de descrição expansível
function ExpandableDescription({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 60;
  
  return (
    <div>
      <p className="text-xs sm:text-sm text-muted-foreground">
        {expanded ? text : text.slice(0, 60)}
        {isLong && !expanded && "..."}
      </p>
      {isLong && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="inline-flex items-center gap-0.5 text-xs text-primary hover:text-primary/80 mt-1 font-medium"
        >
          {expanded ? (
            <>Ver menos <ChevronUp className="w-3 h-3" /></>
          ) : (
            <>Ler mais <ChevronDown className="w-3 h-3" /></>
          )}
        </button>
      )}
    </div>
  );
}

export default function VIPShop() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { addItem, items } = useCart();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<Category>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [addedProducts, setAddedProducts] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os produtos.',
        variant: 'destructive',
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
      image: product.cover_image_url || undefined,
    });
    setAddedProducts(prev => new Set(prev).add(product.id));
    toast({
      title: 'Produto adicionado!',
      description: `${product.name} foi adicionado ao carrinho.`,
    });
    
    setTimeout(() => {
      setAddedProducts(prev => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }, 2000);
  };

  const isInCart = (productId: string) => {
    return items.some(item => item.id === productId);
  };

  const filteredProducts = products
    .filter(p => {
      if (search) {
        return p.name.toLowerCase().includes(search.toLowerCase()) ||
               p.description?.toLowerCase().includes(search.toLowerCase());
      }
      return true;
    })
    .filter(p => {
      if (category === 'low_cost') return p.price < 100;
      if (category === 'premium') return p.price >= 100;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price_asc': return a.price - b.price;
        case 'price_desc': return b.price - a.price;
        case 'name': return a.name.localeCompare(b.name);
        default: return 0;
      }
    });

  const cartItemsCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="p-3 sm:p-4 md:p-6">
      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6 md:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Loja VIP</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Produtos exclusivos • 1 ponto = R$1 gasto
          </p>
        </div>
        <Button onClick={() => navigate('/vip/cart')} size="sm" className="relative w-full sm:w-auto">
          <ShoppingCart className="mr-2 h-4 w-4" />
          Carrinho
          {cartItemsCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
              {cartItemsCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Filters - Responsive */}
      <div className="flex flex-col gap-3 mb-4 sm:mb-6">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>
        <div className="flex flex-col xs:flex-row gap-2 sm:gap-3">
          <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
            <SelectTrigger className="w-full xs:w-1/2 sm:w-48 text-sm">
              <Filter className="mr-2 h-4 w-4 flex-shrink-0" />
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="low_cost">Baixo Custo</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-full xs:w-1/2 sm:w-48 text-sm">
              <ArrowUpDown className="mr-2 h-4 w-4 flex-shrink-0" />
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Mais Recentes</SelectItem>
              <SelectItem value="price_asc">Menor Preço</SelectItem>
              <SelectItem value="price_desc">Maior Preço</SelectItem>
              <SelectItem value="name">Nome A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Products Grid - Responsive */}
      {isLoading ? (
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-32 sm:h-40 bg-muted" />
              <CardContent className="p-3 sm:p-4">
                <div className="h-3 sm:h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 sm:h-4 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {filteredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.03, 0.3) }}
            >
              <Card className="group overflow-hidden h-full flex flex-col hover:border-primary/50 transition-colors">
                {/* Image - Responsive */}
                <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                  {product.cover_image_url ? (
                    <img
                      src={product.cover_image_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground/30" />
                    </div>
                  )}
                  
                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                    {product.price >= 100 && (
                      <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-xs px-1.5 py-0.5">
                        <Star className="mr-0.5 h-2.5 w-2.5" />
                        Premium
                      </Badge>
                    )}
                    {product.original_price && product.original_price > product.price && (
                      <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                        -{Math.round((1 - product.price / product.original_price) * 100)}%
                      </Badge>
                    )}
                  </div>

                  {/* Points Badge */}
                  <div className="absolute bottom-2 right-2">
                    <Badge variant="secondary" className="bg-primary/90 text-primary-foreground text-xs px-1.5 py-0.5">
                      <Diamond className="mr-0.5 h-2.5 w-2.5" />
                      +{Math.floor(product.price)} pts
                    </Badge>
                  </div>
                </div>

                <CardContent className="flex-1 p-3 sm:p-4">
                  <Badge variant="outline" className="mb-1.5 sm:mb-2 capitalize text-xs">
                    {product.product_type}
                  </Badge>
                  <h3 className="font-semibold text-foreground text-sm sm:text-base line-clamp-2 mb-1.5">
                    {product.name}
                  </h3>
                  <ExpandableDescription text={product.short_description || product.description || ""} />
                </CardContent>

                <CardFooter className="p-3 sm:p-4 pt-0 flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2">
                  <div className="flex-shrink-0">
                    <p className="text-base sm:text-lg font-bold text-primary">
                      R$ {product.price.toFixed(2)}
                    </p>
                    {product.original_price && product.original_price > product.price && (
                      <p className="text-xs text-muted-foreground line-through">
                        R$ {product.original_price.toFixed(2)}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAddToCart(product)}
                    disabled={addedProducts.has(product.id)}
                    className={`w-full xs:w-auto text-xs ${addedProducts.has(product.id) ? 'bg-green-500' : ''}`}
                  >
                    {addedProducts.has(product.id) ? (
                      <>
                        <Check className="mr-1 h-3 w-3" />
                        OK
                      </>
                    ) : (
                      <>
                        <Plus className="mr-1 h-3 w-3" />
                        <span className="hidden xs:inline">Adicionar</span>
                        <span className="xs:hidden">Add</span>
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 sm:py-12 text-center">
            <Package className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-xl font-semibold text-foreground mb-2">
              Nenhum produto encontrado
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Tente ajustar os filtros ou busca
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
