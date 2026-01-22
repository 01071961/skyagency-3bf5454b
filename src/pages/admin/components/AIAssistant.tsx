import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, Sparkles, Mail, MessageSquare, Lightbulb, Loader2, X, Minimize2, Maximize2, Brain, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { AddLearningDialog } from './ai';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

type AIContext = 'email_campaign' | 'chat_support' | 'general';

const contextInfo = {
  email_campaign: {
    icon: Mail,
    label: 'Campanhas',
    description: 'Ajuda com criação e otimização de e-mails',
    color: 'text-blue-400'
  },
  chat_support: {
    icon: MessageSquare,
    label: 'Suporte',
    description: 'Auxílio no atendimento ao cliente',
    color: 'text-green-400'
  },
  general: {
    icon: Lightbulb,
    label: 'Geral',
    description: 'Assistente geral do negócio',
    color: 'text-purple-400'
  }
};

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [context, setContext] = useState<AIContext>('general');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedLearning, setSuggestedLearning] = useState<{
    pattern?: string;
    category?: string;
    keywords?: string[];
    response_template?: string;
  } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const conversationHistory = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const { data, error } = await supabase.functions.invoke('admin-ai-assistant', {
        body: {
          message: userMessage.content,
          context,
          conversationHistory
        }
      });

      if (error) throw error;

      if (data?.success && data?.response) {
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);

        // Check if AI suggests a learning pattern
        if (data.response.toLowerCase().includes('padrão de aprendizado') || 
            data.response.toLowerCase().includes('novo padrão') ||
            data.response.toLowerCase().includes('adicionar ao aprendizado')) {
          // Extract suggestion from response
          const patternMatch = data.response.match(/padrão[:\s]+["']?([^"'\n]+)["']?/i);
          setSuggestedLearning({
            pattern: patternMatch?.[1] || 'novo_padrao',
            category: context === 'chat_support' ? 'support' : 'general',
          });
        }
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('AI Assistant error:', error);
      toast.error('Erro ao processar sua mensagem. Tente novamente.');
      
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setSuggestedLearning(null);
  };

  const handleLearningAdded = () => {
    setSuggestedLearning(null);
    toast.success('Padrão adicionado ao aprendizado da IA!');
  };

  const ContextIcon = contextInfo[context].icon;

  if (!isOpen) {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-primary to-cyan-500 shadow-lg shadow-primary/30 flex items-center justify-center text-white"
      >
        <Bot className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: 1,
        height: isMinimized ? 'auto' : 'auto'
      }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed bottom-6 right-6 z-50 w-[400px] max-w-[calc(100vw-3rem)] max-h-[80vh]"
    >
      <Card className="border-primary/20 shadow-xl shadow-primary/10 overflow-hidden">
        <CardHeader className="pb-2 bg-gradient-to-r from-primary/10 to-cyan-500/10 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-cyan-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">Assistente IA</CardTitle>
                <p className="text-xs text-muted-foreground">{contextInfo[context].description}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <AnimatePresence>
          {!isMinimized && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <CardContent className="p-3 space-y-3">
                {/* Context Tabs */}
                <Tabs value={context} onValueChange={(v) => setContext(v as AIContext)}>
                  <TabsList className="w-full grid grid-cols-3 h-8">
                    {Object.entries(contextInfo).map(([key, info]) => {
                      const Icon = info.icon;
                      return (
                        <TabsTrigger key={key} value={key} className="text-xs gap-1 px-2">
                          <Icon className={`h-3 w-3 ${context === key ? info.color : ''}`} />
                          {info.label}
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                </Tabs>

                {/* Messages Area */}
                <ScrollArea className="h-[250px] sm:h-[300px] pr-3" ref={scrollRef}>
                  <div className="space-y-3">
                    {messages.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <ContextIcon className={`w-10 h-10 mx-auto mb-3 ${contextInfo[context].color}`} />
                        <p className="text-sm font-medium">Como posso ajudar?</p>
                        <p className="text-xs mt-1">
                          {context === 'email_campaign' && 'Pergunte sobre campanhas, templates ou métricas'}
                          {context === 'chat_support' && 'Peça ajuda com atendimento ou scripts'}
                          {context === 'general' && 'Tire dúvidas sobre o negócio ou peça análises'}
                        </p>
                      </div>
                    )}

                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[90%] sm:max-w-[85%] rounded-lg px-3 py-2 text-sm break-words overflow-hidden word-break-break-word ${
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                          style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                        >
                          {message.role === 'assistant' ? (
                            <div className="prose prose-sm dark:prose-invert max-w-none [&>*]:break-words [&_pre]:overflow-x-auto [&_pre]:max-w-full [&_code]:break-all">
                              <ReactMarkdown>{message.content}</ReactMarkdown>
                            </div>
                          ) : (
                            <span className="break-words">{message.content}</span>
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
                        <div className="bg-muted rounded-lg px-4 py-3 flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          <span className="text-sm text-muted-foreground">Pensando...</span>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="flex flex-col sm:flex-row gap-2 items-center justify-center">
                  <Textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Digite sua mensagem..."
                    className="min-h-[40px] max-h-[100px] resize-none text-sm w-full"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!input.trim() || isLoading}
                    size="icon"
                    className="shrink-0 self-center sm:self-auto"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Suggested Learning Pattern */}
                {suggestedLearning && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-lg bg-primary/10 border border-primary/20"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Padrão de Aprendizado Sugerido</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      A IA identificou uma oportunidade de aprendizado nesta conversa.
                    </p>
                    <AddLearningDialog
                      initialData={suggestedLearning}
                      onLearningAdded={handleLearningAdded}
                      trigger={
                        <Button size="sm" variant="secondary" className="gap-1 w-full">
                          <Plus className="h-3 w-3" />
                          Adicionar ao Aprendizado
                        </Button>
                      }
                    />
                  </motion.div>
                )}

                {/* Quick Actions */}
                {messages.length > 0 && (
                  <div className="flex flex-col sm:flex-row justify-center sm:justify-between items-center gap-2 pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7"
                      onClick={clearConversation}
                    >
                      Limpar conversa
                    </Button>
                    <Badge variant="outline" className="text-xs">
                      {messages.length} mensagens
                    </Badge>
                  </div>
                )}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
