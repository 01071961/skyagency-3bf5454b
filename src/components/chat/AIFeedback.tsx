import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AIFeedbackProps {
  messageId: string;
  conversationId: string;
  initialScore?: number | null;
}

export const AIFeedback = ({ messageId, conversationId, initialScore }: AIFeedbackProps) => {
  const [feedbackScore, setFeedbackScore] = useState<number | null>(initialScore ?? null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleFeedback = async (score: number) => {
    if (isSubmitting || feedbackScore === score) return;
    
    setIsSubmitting(true);
    try {
      // Save to ai_feedback table
      const { error: feedbackError } = await supabase
        .from('ai_feedback')
        .insert({
          message_id: messageId,
          conversation_id: conversationId,
          rating: score,
        });

      if (feedbackError) throw feedbackError;

      setFeedbackScore(score);
      
      toast({
        title: score === 1 ? "Obrigado!" : "Entendido!",
        description: score === 1 
          ? "Fico feliz em ajudar! 😊" 
          : "Vou melhorar minhas respostas.",
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar o feedback.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-1 mt-1"
      >
        <span className="text-[10px] text-muted-foreground mr-1">Útil?</span>
        
        <button
          onClick={() => handleFeedback(1)}
          disabled={isSubmitting || feedbackScore !== null}
          className={`p-1 rounded-md transition-all ${
            feedbackScore === 1
              ? "bg-emerald-500/20 text-emerald-400"
              : feedbackScore !== null
              ? "opacity-30 cursor-not-allowed text-muted-foreground"
              : "hover:bg-emerald-500/20 text-muted-foreground hover:text-emerald-400"
          }`}
          title="Resposta útil"
        >
          <ThumbsUp className="w-3 h-3" />
        </button>
        
        <button
          onClick={() => handleFeedback(-1)}
          disabled={isSubmitting || feedbackScore !== null}
          className={`p-1 rounded-md transition-all ${
            feedbackScore === -1
              ? "bg-red-500/20 text-red-400"
              : feedbackScore !== null
              ? "opacity-30 cursor-not-allowed text-muted-foreground"
              : "hover:bg-red-500/20 text-muted-foreground hover:text-red-400"
          }`}
          title="Resposta pode melhorar"
        >
          <ThumbsDown className="w-3 h-3" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};
