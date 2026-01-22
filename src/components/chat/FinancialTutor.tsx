import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  GraduationCap, Send, Lightbulb, BookOpen, Target, 
  Brain, Sparkles, ChevronDown, ChevronUp, X, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const QUICK_QUESTIONS = [
  'O que é um fundo de investimento?',
  'Explique a diferença entre renda fixa e variável',
  'Como funciona o imposto de renda sobre investimentos?',
  'O que é suitability?',
  'Quais são os tipos de fundos imobiliários?',
];

const CERTIFICATION_TOPICS: Record<string, string[]> = {
  ancord: ['Mercado de Capitais', 'Renda Fixa', 'Derivativos', 'Ética', 'Regulamentação'],
  cea: ['Planejamento Financeiro', 'Produtos de Investimento', 'Tributação'],
  cfp: ['Gestão Patrimonial', 'Previdência', 'Seguros'],
  cpa_10: ['Produtos Bancários', 'Fundos', 'Ética'],
  cpa_20: ['Produtos Avançados', 'Derivativos', 'Gestão de Risco'],
};

export default function FinancialTutor({ 
  certification = 'ancord',
  isOpen,
  onClose 
}: { 
  certification?: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickQuestions, setShowQuickQuestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initial greeting
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting: Message = {
        id: 'greeting',
        role: 'assistant',
        content: `Olá! 👋 Sou seu **Tutor Financeiro IA** especializado em preparação para certificações.

Estou aqui para ajudar você a:
- 📚 Entender conceitos complexos de forma simples
- 🎯 Praticar com questões direcionadas
- 💡 Tirar dúvidas sobre qualquer tema financeiro

Sobre qual assunto você gostaria de aprender hoje?`,
        timestamp: new Date(),
      };
      setMessages([greeting]);
    }
  }, [isOpen]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setShowQuickQuestions(false);

    try {
      // Create context for the financial tutor
      const systemContext = `Você é um tutor financeiro especializado em preparação para certificações financeiras (${certification.toUpperCase()}).

REGRAS:
1. Explique conceitos de forma clara e didática
2. Use exemplos práticos do mercado brasileiro
3. Quando apropriado, mencione regulamentações da CVM e ANBIMA
4. Formate respostas com markdown para melhor legibilidade
5. Se o aluno errar, explique o porquê do erro
6. Sugira tópicos relacionados para estudo adicional
7. Seja encorajador e motivador

TÓPICOS PRINCIPAIS: ${CERTIFICATION_TOPICS[certification]?.join(', ') || 'Geral'}`;

      // Call the chat assistant function with financial tutor context
      const { data, error } = await supabase.functions.invoke('chat-assistant', {
        body: {
          messages: [
            { role: 'system', content: systemContext },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: content },
          ],
          mode: 'financial_tutor',
          certification,
        },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.content || data.message || 'Desculpe, não consegui processar sua pergunta.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Fallback response
      const fallbackMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: `Excelente pergunta! 🎓

Vou te ajudar com isso. **${content}** é um tema importante para a certificação.

Para uma explicação mais detalhada, sugiro:
1. Revisar o material do módulo correspondente
2. Fazer exercícios práticos sobre o tema
3. Consultar as regulamentações da CVM quando aplicável

Posso explicar algum conceito específico?`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    sendMessage(question);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="fixed bottom-4 right-4 z-50 w-[95vw] max-w-md"
      >
        <Card className="shadow-2xl border-2 border-primary/20 overflow-hidden">
          {/* Header */}
          <CardHeader className="py-3 bg-gradient-to-r from-primary to-accent text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white/20 rounded-lg">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-base">Tutor Financeiro IA</CardTitle>
                  <p className="text-xs opacity-80">
                    Especializado em {certification.toUpperCase()}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>

          {/* Messages */}
          <ScrollArea className="h-[50vh] max-h-[400px]">
            <div className="p-4 space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-muted rounded-bl-md'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm">{message.content}</p>
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
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Pensando...</span>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Quick Questions */}
          <AnimatePresence>
            {showQuickQuestions && messages.length <= 1 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-border overflow-hidden"
              >
                <div className="p-3 bg-muted/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-yellow-500" />
                    <span className="text-xs font-medium">Perguntas Rápidas</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_QUESTIONS.slice(0, 3).map((q, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => handleQuickQuestion(q)}
                      >
                        {q.length > 30 ? q.slice(0, 30) + '...' : q}
                      </Button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input */}
          <CardContent className="p-3 border-t border-border">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="flex gap-2"
            >
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Digite sua dúvida..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button type="submit" size="icon" disabled={!input.trim() || isLoading}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
            
            <div className="flex items-center justify-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                <Brain className="w-3 h-3 mr-1" />
                IA Educacional
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                Respostas Personalizadas
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
