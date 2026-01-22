import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface AITipCardProps {
  subject: string;
  htmlContent: string;
  recipientCount: number;
}

const AITipCard = ({ subject, htmlContent, recipientCount }: AITipCardProps) => {
  const [tip, setTip] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchTip = async () => {
    if (!subject && !htmlContent) {
      setTip('Configure o assunto e conteúdo para receber dicas personalizadas da IA.');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-ai-assistant', {
        body: {
          message: 'Analise rapidamente esta campanha de email e dê UMA dica curta e prática (máximo 2 frases) para melhorar a taxa de abertura ou conversão.',
          context: 'email_campaign',
          campaignData: {
            subject,
            contentPreview: htmlContent.slice(0, 500),
            recipientCount,
          },
        },
      });

      if (error) throw error;
      setTip(data.response || 'Sua campanha parece bem estruturada! Considere testar com um grupo menor antes do envio completo.');
      setHasLoaded(true);
    } catch (error) {
      console.error('Error fetching AI tip:', error);
      setTip('Dica: Emojis no assunto podem aumentar a taxa de abertura em até 56%.');
      setHasLoaded(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!hasLoaded && (subject || htmlContent)) {
      fetchTip();
    }
  }, [subject, htmlContent, hasLoaded]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20"
    >
      <div className="flex items-start gap-3">
        <div className="p-1.5 rounded-lg bg-primary/20">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium text-foreground">Dica de IA</p>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0"
              onClick={fetchTip}
              disabled={isLoading}
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          {isLoading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" />
              Analisando campanha...
            </div>
          ) : (
            <p className="text-xs text-muted-foreground leading-relaxed">
              {tip}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default AITipCard;
