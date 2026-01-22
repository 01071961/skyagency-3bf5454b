import { UpsellBlock } from '../types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, X, Gift, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';

interface UpsellBlockRendererProps {
  block: UpsellBlock;
  isPreview?: boolean;
}

export const UpsellBlockRenderer = ({ block, isPreview = true }: UpsellBlockRendererProps) => {
  const { content } = block;
  const [timeLeft, setTimeLeft] = useState(content.countdownSeconds || 300);

  useEffect(() => {
    if (!content.countdownSeconds || isPreview) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [content.countdownSeconds, isPreview]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const discount = content.originalPrice 
    ? Math.round(((content.originalPrice - content.price) / content.originalPrice) * 100)
    : 0;

  const styleClasses = {
    fullpage: 'min-h-[60vh] py-16',
    modal: 'py-12',
    inline: 'py-8',
  };

  return (
    <div className={`px-4 bg-gradient-to-b from-purple-900/20 via-background to-background ${styleClasses[content.style]}`}>
      <div className="max-w-2xl mx-auto text-center">
        {/* Contador */}
        {content.countdownSeconds && (
          <div className="mb-6 inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-full px-4 py-2">
            <Clock className="h-4 w-4 text-red-500 animate-pulse" />
            <span className="text-red-500 font-mono font-bold">{formatTime(timeLeft)}</span>
            <span className="text-sm text-red-400">restantes</span>
          </div>
        )}

        {/* Badge de oferta */}
        <Badge className="mb-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1">
          <Gift className="h-3 w-3 mr-1" />
          OFERTA EXCLUSIVA
        </Badge>

        {/* Título */}
        <h2 className="text-3xl md:text-4xl font-bold mb-4">{content.title}</h2>
        
        {/* Descrição */}
        <p className="text-lg text-muted-foreground mb-6 max-w-xl mx-auto">
          {content.description}
        </p>

        {/* Imagem (se houver) */}
        {content.imageUrl && (
          <div className="mb-8">
            <img 
              src={content.imageUrl} 
              alt={content.title}
              className="max-w-sm mx-auto rounded-2xl shadow-2xl"
            />
          </div>
        )}

        {/* Preço */}
        <div className="mb-8">
          {content.originalPrice && (
            <div className="text-xl text-muted-foreground line-through mb-1">
              De R$ {content.originalPrice.toFixed(2)}
            </div>
          )}
          <div className="text-4xl font-bold text-green-500">
            Por apenas R$ {content.price.toFixed(2)}
          </div>
          {discount > 0 && (
            <Badge variant="destructive" className="mt-2 text-lg px-4 py-1">
              {discount}% DE DESCONTO
            </Badge>
          )}
        </div>

        {/* Benefícios rápidos */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>One-click purchase</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Acesso imediato</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Garantia de 7 dias</span>
          </div>
        </div>

        {/* Botões */}
        <div className="space-y-4">
          <Button
            size="lg"
            className="w-full max-w-md h-16 text-xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 shadow-lg shadow-green-500/30"
            disabled={isPreview}
          >
            {content.acceptButtonText}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          
          <button 
            className="text-sm text-muted-foreground hover:text-foreground underline flex items-center gap-1 mx-auto"
            disabled={isPreview}
          >
            <X className="h-3 w-3" />
            {content.declineButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};
