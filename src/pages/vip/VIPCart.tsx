import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ShoppingCart, Trash2, Plus, Minus, ArrowLeft,
  Diamond, CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/contexts/CartContext';

export default function VIPCart() {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, total: totalPrice, clearCart } = useCart();

  const pointsToEarn = Math.floor(totalPrice);

  if (items.length === 0) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => navigate('/vip/shop')} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar à Loja
        </Button>

        <Card>
          <CardContent className="py-16 text-center">
            <ShoppingCart className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Carrinho vazio</h2>
            <p className="text-muted-foreground mb-6">
              Adicione produtos para continuar comprando
            </p>
            <Button onClick={() => navigate('/vip/shop')}>
              Explorar Loja
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Button variant="ghost" onClick={() => navigate('/vip/shop')} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Continuar Comprando
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Carrinho ({items.length} {items.length === 1 ? 'item' : 'itens'})
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={clearCart} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Limpar
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex gap-4">
                    {/* Image */}
                    <div className="w-20 h-20 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingCart className="h-6 w-6 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground line-clamp-1">{item.name}</h3>
                      <p className="text-sm text-primary flex items-center gap-1 mt-1">
                        <Diamond className="h-3 w-3" />
                        +{Math.floor(item.price * item.quantity)} pontos
                      </p>
                    </div>

                    {/* Quantity & Price */}
                    <div className="flex flex-col items-end gap-2">
                      <p className="font-bold text-foreground">
                        R$ {(item.price * item.quantity).toFixed(2)}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  {index < items.length - 1 && <Separator className="mt-4" />}
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground">R$ {totalPrice.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">R$ {totalPrice.toFixed(2)}</span>
              </div>
              
              {/* Points Highlight */}
              <div className="p-4 bg-primary/10 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Diamond className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">Pontos a ganhar</span>
                  </div>
                  <span className="font-bold text-primary">+{pointsToEarn}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  1 ponto para cada R$1 gasto
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-3">
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => navigate('/vip/checkout')}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Finalizar Compra
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Pagamento seguro via Cartão de Crédito
              </p>
            </CardFooter>
          </Card>

          {/* Payment Methods */}
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium mb-3">Formas de pagamento</p>
              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CreditCard className="h-5 w-5" />
                  Cartão até 12x
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
