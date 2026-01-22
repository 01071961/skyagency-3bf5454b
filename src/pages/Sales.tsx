import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Check, Star, Zap, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCart } from "@/contexts/CartContext";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  featured?: boolean;
  badge?: string;
}

const products: Product[] = [
  {
    id: 1,
    name: "Pacote Sky Starter",
    description: "Ideal para começar sua jornada digital com as ferramentas essenciais.",
    price: 497,
    originalPrice: 997,
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&h=300&fit=crop",
    category: "Digital",
    featured: true,
    badge: "Mais Vendido"
  },
  {
    id: 2,
    name: "Pacote Sky Pro",
    description: "Solução completa para profissionais que querem resultados extraordinários.",
    price: 997,
    originalPrice: 1997,
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&h=300&fit=crop",
    category: "Premium",
    featured: true,
    badge: "Recomendado"
  },
  {
    id: 3,
    name: "Consultoria Sky VIP",
    description: "Atendimento personalizado com estratégias exclusivas para seu negócio.",
    price: 2497,
    image: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=500&h=300&fit=crop",
    category: "VIP",
    badge: "Exclusivo"
  },
  {
    id: 4,
    name: "Pacote Sky Growth",
    description: "Acelere seu crescimento com ferramentas avançadas de marketing digital.",
    price: 1497,
    originalPrice: 2497,
    image: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=500&h=300&fit=crop",
    category: "Premium"
  },
  {
    id: 5,
    name: "Sky Academy",
    description: "Acesso completo à nossa plataforma de treinamentos e mentorias.",
    price: 697,
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&h=300&fit=crop",
    category: "Digital"
  },
  {
    id: 6,
    name: "Pacote Sky Enterprise",
    description: "Soluções corporativas para empresas que buscam transformação digital.",
    price: 4997,
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=500&h=300&fit=crop",
    category: "Enterprise",
    badge: "Novo"
  }
];

type SortOption = "relevance" | "price-asc" | "price-desc" | "popular" | "newest";
type CategoryFilter = "all" | "Digital" | "Premium" | "VIP" | "Enterprise";

const Sales = () => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("relevance");
  const { addItem } = useCart();

  const handleBuyClick = (product: Product) => {
    setSelectedProduct(product);
    setIsDialogOpen(true);
  };

  const handleConfirmPurchase = () => {
    if (selectedProduct) {
      addItem({
        id: selectedProduct.id,
        name: selectedProduct.name,
        price: selectedProduct.price,
        image: selectedProduct.image,
      });
    }
    setIsDialogOpen(false);
  };

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // Apply category filter
    if (categoryFilter !== "all") {
      result = result.filter((product) => product.category === categoryFilter);
    }

    // Apply sorting
    switch (sortOption) {
      case "price-asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "popular":
        // Featured products first, then by badge priority
        result.sort((a, b) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return 0;
        });
        break;
      case "newest":
        // Products with "Novo" badge first
        result.sort((a, b) => {
          if (a.badge === "Novo" && b.badge !== "Novo") return -1;
          if (a.badge !== "Novo" && b.badge === "Novo") return 1;
          return 0;
        });
        break;
      default:
        // Relevance: featured products first
        result.sort((a, b) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return 0;
        });
    }

    return result;
  }, [categoryFilter, sortOption]);

  return (
    <div className="min-h-screen bg-gradient-tech">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary opacity-10"></div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="container mx-auto text-center relative z-10"
        >
          <Badge className="mb-4 bg-primary/20 text-primary border-primary">
            <Zap className="w-3 h-3 mr-1" />
            Ofertas Exclusivas
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Loja <span className="text-gradient-primary">SKY</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Descubra nossos produtos e serviços premium para transformar seu negócio digital
          </p>
        </motion.div>
      </section>

      {/* Filters and Sorting */}
      <section className="py-8 px-4 border-b border-border/30">
        <div className="container mx-auto">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            {/* Category Filters */}
            <div className="w-full lg:w-auto">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Filtrar por categoria:</span>
              </div>
              <Tabs value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as CategoryFilter)}>
                <TabsList className="grid grid-cols-5 w-full lg:w-auto">
                  <TabsTrigger value="all">Todos</TabsTrigger>
                  <TabsTrigger value="Digital">Digital</TabsTrigger>
                  <TabsTrigger value="Premium">Premium</TabsTrigger>
                  <TabsTrigger value="VIP">VIP</TabsTrigger>
                  <TabsTrigger value="Enterprise">Enterprise</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Sort Options */}
            <div className="w-full lg:w-auto">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium text-muted-foreground">Ordenar por:</span>
              </div>
              <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
                <SelectTrigger className="w-full lg:w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevância</SelectItem>
                  <SelectItem value="popular">Mais Vendidos</SelectItem>
                  <SelectItem value="newest">Lançamentos</SelectItem>
                  <SelectItem value="price-asc">Menor Preço</SelectItem>
                  <SelectItem value="price-desc">Maior Preço</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results count */}
          <div className="mt-6">
            <p className="text-sm text-muted-foreground">
              Mostrando {filteredAndSortedProducts.length} {filteredAndSortedProducts.length === 1 ? "produto" : "produtos"}
              {categoryFilter !== "all" && ` na categoria ${categoryFilter}`}
            </p>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          {filteredAndSortedProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg mb-4">
                Nenhum produto encontrado nesta categoria.
              </p>
              <Button onClick={() => setCategoryFilter("all")} variant="outline">
                Ver todos os produtos
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredAndSortedProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full group hover:shadow-glow-primary transition-smooth overflow-hidden border-border/50">
                  <div className="relative overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-48 object-cover group-hover:scale-110 transition-smooth"
                    />
                    {product.badge && (
                      <Badge className="absolute top-4 right-4 bg-accent text-accent-foreground">
                        {product.badge}
                      </Badge>
                    )}
                    <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-20 transition-smooth"></div>
                  </div>

                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-xl">{product.name}</CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {product.category}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {product.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-gradient-primary">
                        R$ {product.price}
                      </span>
                      {product.originalPrice && (
                        <span className="text-sm text-muted-foreground line-through">
                          R$ {product.originalPrice}
                        </span>
                      )}
                    </div>
                    {product.originalPrice && (
                      <p className="text-sm text-accent mt-2">
                        Economize R$ {product.originalPrice - product.price}
                      </p>
                    )}
                  </CardContent>

                  <CardFooter className="flex gap-2">
                    <Button
                      onClick={() => handleBuyClick(product)}
                      className="flex-1 bg-gradient-primary hover:shadow-glow-primary"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Comprar Agora
                    </Button>
                  </CardFooter>
                </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-card/30">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-6"
            >
              <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Garantia de Qualidade</h3>
              <p className="text-muted-foreground">
                Todos os produtos com garantia de satisfação ou seu dinheiro de volta
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="p-6"
            >
              <div className="w-16 h-16 mx-auto mb-4 bg-secondary/10 rounded-full flex items-center justify-center">
                <Star className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Suporte Premium</h3>
              <p className="text-muted-foreground">
                Atendimento especializado para tirar todas as suas dúvidas
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="p-6"
            >
              <div className="w-16 h-16 mx-auto mb-4 bg-accent/10 rounded-full flex items-center justify-center">
                <Zap className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-2">Acesso Instantâneo</h3>
              <p className="text-muted-foreground">
                Receba acesso imediato após a confirmação do pagamento
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Purchase Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Confirmar Compra</DialogTitle>
            <DialogDescription>
              Você está prestes a adquirir um produto premium
            </DialogDescription>
          </DialogHeader>

          {selectedProduct && (
            <div className="space-y-4">
              <img
                src={selectedProduct.image}
                alt={selectedProduct.name}
                className="w-full h-40 object-cover rounded-lg"
              />
              
              <div>
                <h3 className="font-bold text-lg mb-1">{selectedProduct.name}</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {selectedProduct.description}
                </p>
                
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-3xl font-bold text-gradient-primary">
                    R$ {selectedProduct.price}
                  </span>
                  {selectedProduct.originalPrice && (
                    <span className="text-sm text-muted-foreground line-through">
                      R$ {selectedProduct.originalPrice}
                    </span>
                  )}
                </div>

                <div className="space-y-2 bg-muted/20 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary" />
                    <span>Acesso imediato ao conteúdo</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary" />
                    <span>Suporte premium incluído</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary" />
                    <span>Garantia de 30 dias</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmPurchase}
                  className="flex-1 bg-gradient-primary hover:shadow-glow-primary"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Adicionar ao Carrinho
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Sales;
