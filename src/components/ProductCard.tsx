import { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Check, Zap, Package, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProductShareButton } from "@/components/ProductShareButton";

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
}

interface ProductCardProps {
  product: Product;
  index: number;
  isInCart: boolean;
  onAddToCart: (product: Product) => void;
  onOpenModal: (product: Product) => void;
  formatPrice: (price: number) => string;
  categoryLabels?: Record<string, string>;
}

const defaultCategoryLabels: Record<string, string> = {
  all: "Todos",
  course: "Cursos",
  ebook: "E-books",
  mentoring: "Mentorias",
  live_event: "Eventos",
  files: "Arquivos",
  combo: "Combos",
};

export function ProductCard({
  product,
  index,
  isInCart,
  onAddToCart,
  onOpenModal,
  formatPrice,
  categoryLabels = defaultCategoryLabels,
}: ProductCardProps) {
  const [showFullDescription, setShowFullDescription] = useState(false);

  const description = product.short_description || product.description || "";
  const isLongDescription = description.length > 80;
  const displayDescription = showFullDescription ? description : description.slice(0, 80);

  const handleDescriptionToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowFullDescription(!showFullDescription);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3) }}
      className="group h-full"
    >
      <Card 
        className="h-full flex flex-col overflow-hidden bg-background/40 backdrop-blur-xl border-border/50 hover:border-primary/50 hover:shadow-glow-primary transition-all duration-300 cursor-pointer"
        onClick={() => onOpenModal(product)}
      >
        {/* Image - Responsive height */}
        <div className="relative overflow-hidden aspect-[4/3] sm:aspect-video">
          {product.cover_image_url ? (
            <img
              src={product.cover_image_url}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <Package className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
          
          {/* Category Badge */}
          <Badge 
            variant="outline" 
            className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-background/70 backdrop-blur-sm border-border/30 text-xs"
          >
            {categoryLabels[product.product_type] || product.product_type}
          </Badge>

          {/* Discount & Share */}
          <div 
            className="absolute top-2 right-2 sm:top-3 sm:right-3 flex flex-wrap gap-1 sm:gap-2 items-start justify-end max-w-[60%]"
            onClick={(e) => e.stopPropagation()}
          >
            {product.original_price && product.original_price > product.price && (
              <Badge className="bg-accent/90 backdrop-blur-sm text-accent-foreground border-0 shadow-lg text-xs">
                <Zap className="w-3 h-3 mr-1" />
                {Math.round(((product.original_price - product.price) / product.original_price) * 100)}%
              </Badge>
            )}
            <ProductShareButton
              productName={product.name}
              productUrl={`${window.location.origin}/produto/${product.slug}`}
              price={product.price}
              productImage={product.cover_image_url || undefined}
              className="bg-background/60 backdrop-blur-sm hover:bg-background/80 h-7 w-7 sm:h-8 sm:w-8"
            />
          </div>
        </div>

        {/* Content */}
        <CardHeader className="flex-grow p-3 sm:p-4 pb-1 sm:pb-2">
          <CardTitle className="text-base sm:text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">
            {product.name}
          </CardTitle>
          
          {/* Description with Read More */}
          <div className="mt-1.5">
            <CardDescription className="text-xs sm:text-sm leading-relaxed">
              {displayDescription}
              {isLongDescription && !showFullDescription && "..."}
            </CardDescription>
            {isLongDescription && (
              <button
                onClick={handleDescriptionToggle}
                className="inline-flex items-center gap-0.5 text-xs text-primary hover:text-primary/80 mt-1 font-medium transition-colors"
              >
                {showFullDescription ? (
                  <>
                    Ver menos <ChevronUp className="w-3 h-3" />
                  </>
                ) : (
                  <>
                    Ler mais <ChevronDown className="w-3 h-3" />
                  </>
                )}
              </button>
            )}
          </div>
        </CardHeader>

        {/* Price */}
        <CardContent className="p-3 sm:p-4 pt-2">
          <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2">
            <span className="text-xl sm:text-2xl font-bold text-gradient-primary">
              {formatPrice(product.price)}
            </span>
            {product.original_price && product.original_price > product.price && (
              <span className="text-xs sm:text-sm text-muted-foreground line-through">
                {formatPrice(product.original_price)}
              </span>
            )}
          </div>
        </CardContent>

        {/* Button */}
        <CardFooter className="p-3 sm:p-4 pt-0" onClick={(e) => e.stopPropagation()}>
          <Button
            onClick={() => onAddToCart(product)}
            variant={isInCart ? "default" : "gradient-outline"}
            size="default"
            className="w-full text-sm"
            disabled={isInCart}
          >
            {isInCart ? (
              <>
                <Check className="w-4 h-4 mr-1.5" />
                No Carrinho
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4 mr-1.5" />
                <span className="hidden xs:inline">Adicionar ao </span>Carrinho
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
