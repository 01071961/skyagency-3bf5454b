import { PixelBlock } from '../types';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Facebook, Chrome, TrendingUp, Check, AlertCircle } from 'lucide-react';

interface PixelBlockRendererProps {
  block: PixelBlock;
  isPreview?: boolean;
}

const EVENT_LABELS = {
  pageview: 'Page View',
  lead: 'Lead',
  purchase: 'Purchase',
  add_to_cart: 'Add to Cart',
  initiate_checkout: 'Initiate Checkout',
};

export const PixelBlockRenderer = ({ block, isPreview = true }: PixelBlockRendererProps) => {
  const { content } = block;

  const hasAnyPixel = content.facebookPixelId || content.googleTagId || content.googleAdsId || content.tiktokPixelId;

  return (
    <div className="py-8 px-4">
      <div className="max-w-lg mx-auto bg-card border border-border rounded-xl p-6 shadow-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h4 className="font-bold">Configuração de Pixels</h4>
            <p className="text-sm text-muted-foreground">Tracking de conversões</p>
          </div>
        </div>

        {!hasAnyPixel ? (
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-600 dark:text-yellow-400">Nenhum pixel configurado</p>
              <p className="text-sm text-muted-foreground">Configure os IDs dos pixels no painel de configurações.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Pixels Ativos */}
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-muted-foreground">Pixels Ativos</h5>
              <div className="grid gap-2">
                {content.facebookPixelId && (
                  <div className="flex items-center gap-3 p-3 bg-blue-500/10 rounded-lg">
                    <Facebook className="h-5 w-5 text-blue-500" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">Facebook Pixel</p>
                      <p className="text-xs text-muted-foreground font-mono">{content.facebookPixelId}</p>
                    </div>
                    <Check className="h-4 w-4 text-green-500" />
                  </div>
                )}
                {content.googleTagId && (
                  <div className="flex items-center gap-3 p-3 bg-red-500/10 rounded-lg">
                    <Chrome className="h-5 w-5 text-red-500" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">Google Analytics</p>
                      <p className="text-xs text-muted-foreground font-mono">{content.googleTagId}</p>
                    </div>
                    <Check className="h-4 w-4 text-green-500" />
                  </div>
                )}
                {content.googleAdsId && (
                  <div className="flex items-center gap-3 p-3 bg-yellow-500/10 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-yellow-600" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">Google Ads</p>
                      <p className="text-xs text-muted-foreground font-mono">{content.googleAdsId}</p>
                    </div>
                    <Check className="h-4 w-4 text-green-500" />
                  </div>
                )}
                {content.tiktokPixelId && (
                  <div className="flex items-center gap-3 p-3 bg-pink-500/10 rounded-lg">
                    <div className="h-5 w-5 text-pink-500 font-bold">T</div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">TikTok Pixel</p>
                      <p className="text-xs text-muted-foreground font-mono">{content.tiktokPixelId}</p>
                    </div>
                    <Check className="h-4 w-4 text-green-500" />
                  </div>
                )}
              </div>
            </div>

            {/* Eventos Rastreados */}
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-muted-foreground">Eventos Rastreados</h5>
              <div className="flex flex-wrap gap-2">
                {content.events.map((event) => (
                  <Badge key={event} variant="secondary" className="capitalize">
                    {EVENT_LABELS[event] || event}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Eventos Customizados */}
            {content.customEvents && content.customEvents.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-muted-foreground">Eventos Customizados</h5>
                <div className="space-y-1">
                  {content.customEvents.map((event, idx) => (
                    <div key={idx} className="text-sm p-2 bg-muted/50 rounded">
                      <span className="font-medium">{event.name}</span>
                      <span className="text-muted-foreground"> • Trigger: {event.trigger}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Os pixels são injetados no &lt;head&gt; da página publicada
          </p>
        </div>
      </div>
    </div>
  );
};
