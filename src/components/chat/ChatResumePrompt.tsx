import { Button } from "@/components/ui/button";
import { MessageCircle, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

interface ChatSession {
  visitorName: string;
  subject: string;
  status: "active" | "closed";
}

interface ChatResumePromptProps {
  session: ChatSession;
  onResume: () => void;
  onNewChat: () => void;
  isLoading?: boolean;
}

export const ChatResumePrompt = ({
  session,
  onResume,
  onNewChat,
  isLoading = false,
}: ChatResumePromptProps) => {
  const isActive = session.status === "active";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 flex flex-col items-center justify-center p-6 text-center"
    >
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4">
        <MessageCircle className="h-8 w-8 text-primary-foreground" />
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-2">
        {isActive ? "Conversa em andamento" : "Conversa anterior encontrada"}
      </h3>

      <p className="text-sm text-muted-foreground mb-1">
        Olá, <span className="font-medium text-foreground">{session.visitorName}</span>!
      </p>
      
      <p className="text-xs text-muted-foreground mb-6">
        Assunto: {session.subject}
      </p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button
          onClick={onResume}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
        >
          {isActive ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Continuar conversa
            </>
          ) : (
            <>
              <MessageCircle className="h-4 w-4 mr-2" />
              Retomar conversa
            </>
          )}
        </Button>

        <Button
          onClick={onNewChat}
          disabled={isLoading}
          variant="outline"
          className="w-full"
        >
          Iniciar nova conversa
        </Button>
      </div>

      {!isActive && (
        <p className="text-xs text-muted-foreground mt-4">
          Sua conversa anterior foi encerrada. Você pode retomá-la ou iniciar uma nova.
        </p>
      )}
    </motion.div>
  );
};
