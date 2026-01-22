import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Send, X, Loader2, Wand2, Mail, 
  Target, TrendingUp, MessageSquare 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface CampaignAIAssistantProps {
  campaignData: {
    name: string;
    subject: string;
    html_content: string;
    recipientCount: number;
  };
  onApplySuggestion?: (field: 'subject' | 'content', value: string) => void;
}

const QUICK_PROMPTS = [
  { icon: Mail, label: 'Melhorar assunto', prompt: 'Sugira 3 variações criativas para o assunto do meu e-mail que aumentem a taxa de abertura.' },
  { icon: Target, label: 'Otimizar CTA', prompt: 'Analise o conteúdo e sugira call-to-actions mais persuasivos.' },
  { icon: TrendingUp, label: 'Aumentar conversão', prompt: 'Como posso melhorar esta campanha para aumentar a taxa de conversão?' },
  { icon: MessageSquare, label: 'Tom de voz', prompt: 'Revise o tom de voz do e-mail para ser mais engajador e personalizado.' },
];

const CampaignAIAssistant = ({ campaignData, onApplySuggestion }: CampaignAIAssistantProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('admin-ai-assistant', {
        body: {
          message: messageText,
          context: 'email_campaign',
          campaignData: {
            name: campaignData.name,
            subject: campaignData.subject,
            contentPreview: campaignData.html_content.slice(0, 1000),
            recipientCount: campaignData.recipientCount,
          },
        },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || 'Desculpe, não consegui processar sua solicitação.',
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error calling AI assistant:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível obter resposta da IA.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    sendMessage(prompt);
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-gradient-to-r from-primary to-secondary shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-shadow"
          >
            <Wand2 className="w-6 h-6 text-primary-foreground" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 left-6 sm:left-auto z-50 sm:w-[420px] max-h-[600px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-border bg-gradient-to-r from-primary/10 to-secondary/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Assistente de Campanhas</h3>
                    <p className="text-xs text-muted-foreground">IA Evolutiva • Email Marketing</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Quick Prompts */}
            {messages.length === 0 && (
              <div className="p-4 border-b border-border">
                <p className="text-xs text-muted-foreground mb-3">Sugestões rápidas:</p>
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_PROMPTS.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickPrompt(item.prompt)}
                      className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left"
                    >
                      <item.icon className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-xs text-foreground">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[90%] sm:max-w-[85%] rounded-2xl px-4 py-3 text-sm break-words overflow-hidden ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-muted rounded-bl-md'
                      }`}
                      style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                    >
                      {msg.role === 'assistant' ? (
                        <div className="prose prose-sm prose-invert max-w-none">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        msg.content
                      )}
                    </div>
                  </motion.div>
                ))}
                
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">Analisando...</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t border-border">
              <div className="flex flex-col sm:flex-row gap-2 items-center justify-center">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Peça sugestões para sua campanha..."
                  className="min-h-[44px] max-h-[120px] bg-muted/50 border-border resize-none w-full"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(input);
                    }
                  }}
                />
                <Button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || isLoading}
                  className="bg-gradient-to-r from-primary to-secondary self-center sm:self-auto"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CampaignAIAssistant;
