import { memo } from "react";
import ReactMarkdown from "react-markdown";
import DOMPurify from "dompurify";
import { Bot, User, UserCheck, Paperclip, Download, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { AIFeedback } from "./AIFeedback";
import { VoiceButton } from "../VoiceButton";

interface ChatMessageProps {
  id?: string;
  conversationId?: string;
  role: "user" | "assistant" | "admin" | "system";
  content: string;
  timestamp?: string;
  isAiResponse?: boolean;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  showFeedback?: boolean;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

const isImageFile = (fileType?: string): boolean => {
  return fileType?.startsWith("image/") ?? false;
};

export const ChatMessage = memo(({
  id,
  conversationId,
  role,
  content,
  timestamp,
  isAiResponse,
  fileUrl,
  fileName,
  fileType,
  fileSize,
  showFeedback = false,
}: ChatMessageProps) => {
  const isUser = role === "user";
  const isAdmin = role === "admin";
  const isSystem = role === "system";
  const shouldShowFeedback = showFeedback && isAiResponse && id && conversationId;

  // Sanitize content with strict configuration to prevent XSS
  const sanitizedContent = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'code'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input', 'object', 'embed'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
  });

  if (isSystem) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex justify-center my-4"
      >
        <span className="text-xs text-muted-foreground/80 bg-gradient-to-r from-muted/40 to-muted/20 backdrop-blur-md px-5 py-2 rounded-full border border-white/10 shadow-sm">
          {content}
        </span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {/* Avatar for non-user messages */}
      {!isUser && (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.1 }}
          className="relative flex-shrink-0"
        >
          {/* Outer glow ring */}
          <div className={`absolute -inset-1 rounded-full blur-md opacity-60 ${
            isAdmin 
              ? "bg-gradient-to-br from-green-400 to-emerald-500" 
              : "bg-gradient-to-br from-primary to-secondary"
          }`} />
          
          {/* Avatar container */}
          <div className={`relative h-9 w-9 rounded-full flex items-center justify-center ${
            isAdmin 
              ? "bg-gradient-to-br from-green-500/30 to-emerald-600/30 border border-green-400/30" 
              : "bg-gradient-to-br from-primary/30 to-secondary/30 border border-primary/30"
          } backdrop-blur-sm`}>
            {isAdmin ? (
              <UserCheck className="h-4 w-4 text-green-300" />
            ) : (
              <div className="relative">
                <Bot className="h-4 w-4 text-primary" />
                <Sparkles className="absolute -top-1 -right-1 h-2.5 w-2.5 text-secondary animate-pulse" />
              </div>
            )}
          </div>
        </motion.div>
      )}
      
      {/* Message bubble with premium glassmorphism */}
      <div
        className={`relative max-w-[85%] sm:max-w-[80%] md:max-w-[75%] overflow-hidden group ${
          isUser
            ? "rounded-2xl rounded-br-sm"
            : "rounded-2xl rounded-bl-sm"
        }`}
      >
        {/* Animated gradient border for AI messages */}
        {!isUser && isAiResponse && (
          <div className="absolute -inset-[1px] rounded-2xl rounded-bl-sm bg-gradient-to-r from-primary/50 via-secondary/50 to-primary/50 opacity-60 blur-[0.5px] animate-pulse" />
        )}
        
        {/* Background with premium glass effect */}
        <div className={`absolute inset-0 ${
          isUser
            ? "bg-gradient-to-br from-primary via-primary to-secondary"
            : isAdmin
            ? "bg-gradient-to-br from-green-500/15 to-emerald-600/10 backdrop-blur-xl border border-green-400/20"
            : "bg-gradient-to-br from-muted/80 to-muted/60 backdrop-blur-xl border border-white/10"
        }`} />
        
        {/* Subtle inner glow for AI messages */}
        {!isUser && (
          <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/5" />
        )}
        
        {/* Content container */}
        <div className={`relative px-4 py-3 ${
          isUser ? "text-white" : ""
        }`}>
          {/* File Attachment */}
          {fileUrl && (
            <div className="mb-3">
              {isImageFile(fileType) ? (
                <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="block">
                  <motion.img
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                    src={fileUrl}
                    alt={fileName || "Imagem"}
                    className="max-w-full rounded-xl max-h-48 object-contain shadow-xl ring-1 ring-white/10"
                  />
                </a>
              ) : (
                <motion.a
                  whileHover={{ scale: 1.02 }}
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                    isUser 
                      ? "bg-white/15 hover:bg-white/25 border border-white/10" 
                      : "bg-background/60 hover:bg-background/80 border border-white/10"
                  }`}
                >
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                    isUser ? "bg-white/15" : "bg-gradient-to-br from-primary/20 to-secondary/20"
                  }`}>
                    <Paperclip className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{fileName || "Arquivo"}</p>
                    {fileSize && (
                      <p className={`text-xs ${isUser ? "text-white/60" : "text-muted-foreground"}`}>
                        {formatFileSize(fileSize)}
                      </p>
                    )}
                  </div>
                  <Download className="h-4 w-4 opacity-60 group-hover:opacity-100 transition-opacity" />
                </motion.a>
              )}
            </div>
          )}

          {/* Message Content with Markdown */}
          {content && (
            <div className={`prose prose-sm max-w-none break-words overflow-hidden [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:break-words [&_a]:break-all [&_code]:break-all ${
              isUser ? "prose-invert" : "prose-neutral dark:prose-invert"
            }`}>
              <ReactMarkdown
                components={{
                  p: ({ children }) => (
                    <p className="mb-1.5 last:mb-0 text-[15px] leading-relaxed">{children}</p>
                  ),
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`underline underline-offset-2 decoration-1 hover:no-underline transition-all ${
                        isUser ? "text-white/90 decoration-white/40" : "text-primary decoration-primary/40"
                      }`}
                    >
                      {children}
                    </a>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold">{children}</strong>
                  ),
                  em: ({ children }) => <em className="italic">{children}</em>,
                  ul: ({ children }) => (
                    <ul className="list-disc ml-4 my-2 space-y-1">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal ml-4 my-2 space-y-1">{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-sm leading-relaxed">{children}</li>
                  ),
                  code: ({ children }) => (
                    <code className={`px-1.5 py-0.5 rounded-md text-xs font-mono ${
                      isUser ? "bg-white/15" : "bg-muted/80"
                    }`}>
                      {children}
                    </code>
                  ),
                }}
              >
                {sanitizedContent}
              </ReactMarkdown>
            </div>
          )}

          {/* Timestamp and Voice Button with premium styling */}
          {timestamp && (
            <div className={`flex items-center justify-between gap-2 mt-2 ${
              isUser ? "text-white/50" : "text-muted-foreground/50"
            }`}>
              <div className="flex items-center gap-2 text-[11px]">
                <span>{format(new Date(timestamp), "HH:mm", { locale: ptBR })}</span>
                {isAiResponse && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-current opacity-50" />
                    <span className="flex items-center gap-1">
                      <Sparkles className="h-2.5 w-2.5" />
                      IA
                    </span>
                  </>
                )}
                {isAdmin && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-current opacity-50" />
                    <span className="flex items-center gap-1">
                      <UserCheck className="h-2.5 w-2.5" />
                      Admin
                    </span>
                  </>
                )}
              </div>
              
              {/* Voice Button for AI/Admin messages */}
              {!isUser && content && (
                <VoiceButton 
                  text={content} 
                  size="icon" 
                  variant="ghost" 
                  className="h-6 w-6 opacity-60 hover:opacity-100 transition-opacity"
                />
              )}
            </div>
          )}

          {/* AI Feedback with improved styling */}
          {shouldShowFeedback && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-3 pt-3 border-t border-white/10"
            >
              <AIFeedback 
                messageId={id} 
                conversationId={conversationId} 
              />
            </motion.div>
          )}
        </div>
      </div>

      {/* User avatar with premium styling */}
      {isUser && (
        <motion.div
          initial={{ scale: 0, rotate: 180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.1 }}
          className="relative flex-shrink-0"
        >
          {/* Outer glow */}
          <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-secondary to-accent blur-md opacity-60" />
          
          {/* Avatar */}
          <div className="relative h-9 w-9 rounded-full bg-gradient-to-br from-secondary to-accent flex items-center justify-center border border-white/20">
            <User className="h-4 w-4 text-white" />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
});

ChatMessage.displayName = "ChatMessage";