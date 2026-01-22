'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, Wand2, RefreshCw, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AIProductAssistantProps {
  productType: string;
  onApplyName?: (name: string) => void;
  onApplyDescription?: (description: string) => void;
  onApplyTags?: (tags: string[]) => void;
  className?: string;
}

interface Suggestion {
  name: string;
  shortDescription: string;
  tags: string[];
}

export function AIProductAssistant({
  productType,
  onApplyName,
  onApplyDescription,
  onApplyTags,
  className
}: AIProductAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const generateSuggestions = async () => {
    if (!prompt.trim()) {
      toast.error('Descreva seu produto para gerar sugestões');
      return;
    }

    setIsLoading(true);
    
    // Simulate AI response (in production, call your AI endpoint)
    setTimeout(() => {
      const productTypeNames: Record<string, string> = {
        course: 'curso online',
        ebook: 'ebook',
        mentoring: 'mentoria',
        live_event: 'evento ao vivo',
        files: 'arquivos digitais',
        combo: 'combo de produtos'
      };
      
      const typeName = productTypeNames[productType] || 'produto digital';
      
      setSuggestions([
        {
          name: `Masterclass: ${prompt.slice(0, 30)}...`,
          shortDescription: `Aprenda ${prompt.toLowerCase()} de forma prática e objetiva com este ${typeName} exclusivo.`,
          tags: ['premium', productType, 'bestseller']
        },
        {
          name: `${prompt.slice(0, 40)} - Guia Completo`,
          shortDescription: `O ${typeName} definitivo sobre ${prompt.toLowerCase()}. Do básico ao avançado em um único lugar.`,
          tags: ['completo', 'iniciante', 'avançado']
        },
        {
          name: `PRO: ${prompt.slice(0, 35)}`,
          shortDescription: `Transforme seu conhecimento em ${prompt.toLowerCase()} com metodologia comprovada.`,
          tags: ['profissional', 'método', 'resultado']
        }
      ]);
      setIsLoading(false);
    }, 1500);
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast.success('Copiado!');
  };

  const handleApply = (suggestion: Suggestion) => {
    onApplyName?.(suggestion.name);
    onApplyDescription?.(suggestion.shortDescription);
    onApplyTags?.(suggestion.tags);
    toast.success('Sugestões aplicadas!');
    setIsOpen(false);
  };

  return (
    <div className={cn("relative", className)}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30 hover:border-purple-500/50"
      >
        <Sparkles className="w-4 h-4 text-purple-500" />
        Assistente IA
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full left-0 right-0 mt-2 z-50"
          >
            <Card className="shadow-xl border-purple-500/20 bg-background">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-purple-500" />
                  Gerador de Conteúdo com IA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Descreva seu produto em poucas palavras..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && generateSuggestions()}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={generateSuggestions}
                    disabled={isLoading}
                    size="sm"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                <AnimatePresence mode="wait">
                  {suggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-3 max-h-[300px] overflow-y-auto"
                    >
                      {suggestions.map((suggestion, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="p-3 rounded-lg border bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{suggestion.name}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(suggestion.name, `name-${idx}`)}
                                  className="text-muted-foreground hover:text-foreground"
                                >
                                  {copiedField === `name-${idx}` ? (
                                    <Check className="w-3 h-3 text-green-500" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {suggestion.shortDescription}
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {suggestion.tags.map((tag, tagIdx) => (
                                  <Badge key={tagIdx} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => handleApply(suggestion)}
                              className="shrink-0"
                            >
                              Aplicar
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {!suggestions.length && !isLoading && (
                  <p className="text-xs text-center text-muted-foreground py-4">
                    Digite uma descrição e clique em gerar para ver sugestões
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
