import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingCart, Check, CreditCard, Share2, Package, Zap, Star, Shield, ArrowRight, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { ProductShareButton } from "./ProductShareButton";
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

interface ProductPreviewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  onBuyNow: (product: Product) => void;
  isInCart: boolean;
}

const categoryLabels: Record<string, string> = {
  course: "Curso",
  ebook: "E-book",
  mentoring: "Mentoria",
  live_event: "Evento",
  files: "Arquivos",
  combo: "Combo",
};

export const ProductPreviewModal = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onBuyNow,
  isInCart,
}: ProductPreviewModalProps) => {
  const navigate = useNavigate();
  
  if (!product) return null;

  const handleViewDetails = () => {
    onClose();
    navigate(`/produto/${product.slug}`);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const discountPercent = product.original_price && product.original_price > product.price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  const productUrl = `${window.location.origin}/produto/${product.slug}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 bg-background/95 backdrop-blur-xl border-white/10 overflow-hidden">
        <VisuallyHidden.Root>
          <DialogTitle>{product.name}</DialogTitle>
        </VisuallyHidden.Root>
        <div className="grid md:grid-cols-2 gap-0">
          {/* Image Section */}
          <div className="relative aspect-square md:aspect-auto md:h-full min-h-[300px]">
            {product.cover_image_url ? (
              <img
                src={product.cover_image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <Package className="w-24 h-24 text-muted-foreground" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent md:bg-gradient-to-r" />
            
            {/* Badges */}
            <div className="absolute top-4 left-4 flex gap-2">
              <Badge variant="outline" className="bg-background/80 backdrop-blur-sm border-white/20">
                {categoryLabels[product.product_type] || product.product_type}
              </Badge>
              {discountPercent > 0 && (
                <Badge className="bg-accent/90 backdrop-blur-sm text-accent-foreground border-0">
                  <Zap className="w-3 h-3 mr-1" />
                  {discountPercent}% OFF
                </Badge>
              )}
            </div>

            {/* Share Button on Image */}
            <div className="absolute top-4 right-4">
              <ProductShareButton
                productName={product.name}
                productUrl={productUrl}
                price={product.price}
                productImage={product.cover_image_url || undefined}
                className="bg-background/80 backdrop-blur-sm hover:bg-background/90"
              />
            </div>
          </div>

          {/* Content Section */}
          <div className="p-6 md:p-8 flex flex-col">
            <div className="flex-1">
              <h2 className="text-2xl md:text-3xl font-bold mb-3 text-gradient-primary">
                {product.name}
              </h2>
              
              <p className="text-muted-foreground mb-6 leading-relaxed">
                {product.description || product.short_description || "Sem descrição disponível."}
              </p>

              {/* Price */}
              {(() => {
                const priceInfo = formatProductPrice(product);
                return (
                  <div className="mb-6 p-4 rounded-xl bg-background/50 border border-white/10">
                    <div className="flex flex-wrap items-baseline gap-3 mb-2">
                      <span className={`text-4xl font-bold ${priceInfo.isFree ? priceInfo.color : 'text-gradient-primary'}`}>
                        {priceInfo.display}
                      </span>
                      {priceInfo.badge && (
                        <Badge className={priceInfo.badgeColor}>
                          <Crown className="w-3 h-3 mr-1" />
                          {priceInfo.badge}
                        </Badge>
                      )}
                      {!priceInfo.isFree && product.original_price && product.original_price > product.price && (
                        <span className="text-lg text-muted-foreground line-through">
                          {formatPrice(product.original_price)}
                        </span>
                      )}
                    </div>
                    {!priceInfo.isFree && discountPercent > 0 && (
                      <p className="text-sm text-accent">
                        Você economiza {formatPrice(product.original_price! - product.price)}
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Features */}
              <div className="space-y-3 mb-6">
                {[
                  { icon: Shield, text: "Garantia de 7 dias" },
                  { icon: Zap, text: "Acesso imediato após pagamento" },
                  { icon: Star, text: "Suporte especializado" },
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <feature.icon className="w-4 h-4 text-primary" />
                    {feature.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                onClick={() => onBuyNow(product)}
                variant="glow"
                size="lg"
                className="w-full"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Comprar Agora
              </Button>
              
              <Button
                onClick={() => onAddToCart(product)}
                variant={isInCart ? "default" : "glass"}
                size="lg"
                className="w-full"
                disabled={isInCart}
              >
                {isInCart ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Já está no Carrinho
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Adicionar ao Carrinho
                  </>
                )}
              </Button>

              <Button
                onClick={handleViewDetails}
                variant="outline"
                size="lg"
                className="w-full border-primary/30 hover:border-primary hover:bg-primary/10"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Saiba Mais - Ver Detalhes
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductPreviewModal;
