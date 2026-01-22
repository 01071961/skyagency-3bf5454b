import { OrderBumpBlock } from '../types';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Zap, TrendingUp } from 'lucide-react';

interface OrderBumpBlockRendererProps {
  block: OrderBumpBlock;
  isPreview?: boolean;
}

export const OrderBumpBlockRenderer = ({ block, isPreview = true }: OrderBumpBlockRendererProps) => {
  const { content } = block;

  const discount = content.originalPrice 
    ? Math.round(((content.originalPrice - content.price) / content.originalPrice) * 100)
    : 0;

  const styleClasses = {
    card: 'bg-card border border-border shadow-md',
    minimal: 'bg-muted/30 border border-muted',
    highlighted: 'bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border-2 border-orange-400 shadow-lg shadow-orange-500/10',
  };

  return (
    <div className="py-6 px-4">
      <div className={`max-w-lg mx-auto rounded-xl p-6 ${styleClasses[content.style]}`}>
        {/* Header com badge */}
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-yellow-500 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-bold text-lg">{content.title}</h4>
              {discount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  -{discount}% OFF
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-sm">{content.description}</p>
          </div>
        </div>

        {/* Imagem do produto (se houver) */}
        {content.imageUrl && (
          <div className="mb-4">
            <img 
              src={content.imageUrl} 
              alt={content.title}
              className="w-full h-32 object-cover rounded-lg"
            />
          </div>
        )}

        {/* Preço */}
        <div className="flex items-center gap-3 mb-4">
          {content.originalPrice && (
            <span className="text-lg text-muted-foreground line-through">
              R$ {content.originalPrice.toFixed(2)}
            </span>
          )}
          <span className="text-2xl font-bold text-green-600">
            R$ {content.price.toFixed(2)}
          </span>
        </div>

        {/* Checkbox */}
        <label className={`
          flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-all
          ${content.isCheckedByDefault 
            ? 'bg-green-500/10 border-2 border-green-500' 
            : 'bg-muted/50 border-2 border-transparent hover:border-primary/30'
          }
        `}>
          <Checkbox 
            checked={content.isCheckedByDefault}
            disabled={isPreview}
            className="h-5 w-5"
          />
          <span className="font-medium flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            {content.checkboxText}
          </span>
        </label>
      </div>
    </div>
  );
};
