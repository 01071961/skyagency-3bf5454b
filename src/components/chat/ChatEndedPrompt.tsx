import { Button } from "@/components/ui/button";
import { MessageCircle, RefreshCw, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

interface ChatEndedPromptProps {
  visitorName: string;
  onResume: () => void;
  onNewChat: () => void;
  onClose: () => void;
}

export const ChatEndedPrompt = ({
  visitorName,
  onResume,
  onNewChat,
  onClose,
}: ChatEndedPromptProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center p-6 text-center bg-muted/30 rounded-lg mx-4 my-4"
    >
      <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-3">
        <CheckCircle className="h-6 w-6 text-green-500" />
      </div>

      <h3 className="text-base font-semibold text-foreground mb-2">
        Conversa encerrada
      </h3>

      <p className="text-sm text-muted-foreground mb-4">
        Obrigado, {visitorName}! Precisa de mais ajuda?
      </p>

      <div className="flex flex-col gap-2 w-full max-w-[200px]">
        <Button
          onClick={onResume}
          size="sm"
          variant="outline"
          className="w-full"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retomar conversa
        </Button>

        <Button
          onClick={onNewChat}
          size="sm"
          className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Nova conversa
        </Button>
      </div>
    </motion.div>
  );
};
