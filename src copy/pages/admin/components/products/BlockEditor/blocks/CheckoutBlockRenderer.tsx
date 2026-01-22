import { CheckoutBlock } from '../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, Shield, Lock, CheckCircle } from 'lucide-react';

interface CheckoutBlockRendererProps {
  block: CheckoutBlock;
  isPreview?: boolean;
  productPrice?: number;
  productName?: string;
}

const PROVIDER_LOGOS = {
  stripe: '💳 Stripe',
  pagbank: '🔵 PagBank',
  mercadopago: '🔵 Mercado Pago',
  eduzz: '🟢 Eduzz',
  hotmart: '🟠 Hotmart',
  kiwi: '🟣 Kiwify',
};

export const CheckoutBlockRenderer = ({ 
  block, 
  isPreview = true,
  productPrice = 97,
  productName = 'Produto'
}: CheckoutBlockRendererProps) => {
  const { content } = block;

  return (
    <div className="py-12 px-4 bg-gradient-to-b from-muted/50 to-background">
      <div className="max-w-lg mx-auto">
        <Card className="border-2 border-primary/20 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent border-b">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Checkout Seguro
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Processado via {PROVIDER_LOGOS[content.provider]}
            </p>
          </CardHeader>
          <CardContent className="p-6">
            {/* Resumo do Pedido */}
            <div className="mb-6 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold mb-2">Resumo do Pedido</h4>
              <div className="flex justify-between items-center">
                <span>{productName}</span>
                <span className="font-bold text-lg">R$ {productPrice.toFixed(2)}</span>
              </div>
            </div>

            {/* Checkout Preview */}
            <div className="space-y-4">
              {content.style === 'embedded' ? (
                <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center bg-muted/20">
                  <CreditCard className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Formulário de pagamento {content.provider} será carregado aqui
                  </p>
                  {content.priceId && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Price ID: {content.priceId}
                    </p>
                  )}
                </div>
              ) : (
                <Button 
                  className="w-full h-14 text-lg font-bold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500"
                  disabled={isPreview}
                >
                  <Lock className="mr-2 h-5 w-5" />
                  Finalizar Compra
                </Button>
              )}

              {/* Badges de segurança */}
              <div className="flex flex-wrap justify-center gap-4 pt-4 border-t">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Shield className="h-4 w-4 text-green-500" />
                  Compra Segura
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Lock className="h-4 w-4 text-green-500" />
                  SSL 256-bit
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Garantia 7 dias
                </div>
              </div>
            </div>

            {content.showBump && (
              <div className="mt-4 p-3 border-2 border-dashed border-orange-400/50 rounded-lg bg-orange-50 dark:bg-orange-900/10">
                <p className="text-sm text-orange-600 dark:text-orange-400 text-center">
                  📦 Order Bump configurado
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
