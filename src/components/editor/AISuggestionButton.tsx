/**
 * AISuggestionButton - Botão para gerar sugestões de texto com IA
 * Integra com Lovable AI para sugerir títulos, subtítulos e descrições
 */

import * as React from "react";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Copy, Check, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AISuggestionButtonProps {
  fieldType: 'title' | 'subtitle' | 'description' | 'cta' | 'benefit';
  context?: string; // Nome do produto ou contexto adicional
  tone?: 'professional' | 'motivational' | 'casual' | 'urgent';
  onSelect: (suggestion: string) => void;
  className?: string;
  size?: 'sm' | 'default' | 'icon';
}

interface Suggestion {
  id: string;
  text: string;
  style: string;
}

const FIELD_PROMPTS: Record<string, string> = {
  title: 'título principal otimizado para conversão e SEO',
  subtitle: 'subtítulo persuasivo e complementar',
  description: 'descrição detalhada e envolvente',
  cta: 'texto de call-to-action que gera urgência',
  benefit: 'benefício claro e impactante'
};

const TONE_LABELS: Record<string, string> = {
  professional: 'Profissional',
  motivational: 'Motivacional',
  casual: 'Casual/Amigável',
  urgent: 'Urgente/Escassez'
};

export function AISuggestionButton({
  fieldType,
  context = '',
  tone = 'professional',
  onSelect,
  className,
  size = 'icon'
}: AISuggestionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [customContext, setCustomContext] = useState(context);
  const [selectedTone, setSelectedTone] = useState(tone);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const generateSuggestions = useCallback(async () => {
    setIsLoading(true);
    setSuggestions([]);
    setSelectedId(null);

    try {
      const prompt = `Você é um especialista em copywriting para páginas de vendas de produtos digitais.

Gere EXATAMENTE 3 variações de ${FIELD_PROMPTS[fieldType]} para o seguinte contexto:
${customContext || 'Produto digital de alta qualidade'}

Tom desejado: ${TONE_LABELS[selectedTone]}

Regras importantes:
- Cada sugestão deve ter no máximo ${fieldType === 'description' ? '200' : '80'} caracteres
- Use linguagem persuasiva em português brasileiro
- Evite clichês e seja original
- Foque em benefícios e resultados

Retorne APENAS um JSON válido no seguinte formato:
[
  {"id": "1", "text": "Primeira sugestão aqui", "style": "direto"},
  {"id": "2", "text": "Segunda sugestão aqui", "style": "emocional"},
  {"id": "3", "text": "Terceira sugestão aqui", "style": "urgente"}
]`;

      const { data, error } = await supabase.functions.invoke('chat-assistant', {
        body: {
          message: prompt,
          conversationId: `ai-suggestion-${Date.now()}`,
          visitorId: 'editor',
          mode: 'sales-copy'
        }
      });

      if (error) throw error;

      // Parse AI response
      const responseText = data?.response || '';
      
      // Try to extract JSON from response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSuggestions(parsed.map((s: any, i: number) => ({
            id: s.id || String(i + 1),
            text: s.text || s,
            style: s.style || 'padrão'
          })));
        }
      } else {
        // Fallback: generate local suggestions
        setSuggestions([
          { id: '1', text: `${customContext || 'Produto'} - Transforme sua vida hoje`, style: 'motivacional' },
          { id: '2', text: `Descubra o segredo do sucesso com ${customContext || 'nosso método'}`, style: 'emocional' },
          { id: '3', text: `Últimas vagas! ${customContext || 'Garanta seu acesso'} agora`, style: 'urgente' }
        ]);
      }
    } catch (err) {
      console.error('AI suggestion error:', err);
      
      // Fallback suggestions
      const fallbacks = {
        title: [
          { id: '1', text: 'Transforme Seus Resultados Agora', style: 'direto' },
          { id: '2', text: 'O Método Definitivo Para o Sucesso', style: 'emocional' },
          { id: '3', text: 'Desbloqueie Seu Potencial Máximo', style: 'motivacional' }
        ],
        subtitle: [
          { id: '1', text: 'Aprenda as estratégias que realmente funcionam', style: 'direto' },
          { id: '2', text: 'Mais de 10.000 alunos já transformaram suas vidas', style: 'social' },
          { id: '3', text: 'Resultados garantidos ou seu dinheiro de volta', style: 'confiança' }
        ],
        description: [
          { id: '1', text: 'Um treinamento completo desenvolvido por especialistas com anos de experiência no mercado.', style: 'profissional' },
          { id: '2', text: 'Descubra passo a passo como alcançar resultados extraordinários em tempo recorde.', style: 'emocional' },
          { id: '3', text: 'Acesso imediato a todo o conteúdo + bônus exclusivos por tempo limitado.', style: 'urgente' }
        ],
        cta: [
          { id: '1', text: 'QUERO COMEÇAR AGORA', style: 'direto' },
          { id: '2', text: 'GARANTIR MINHA VAGA', style: 'escassez' },
          { id: '3', text: 'SIM, QUERO TRANSFORMAR MINHA VIDA', style: 'emocional' }
        ],
        benefit: [
          { id: '1', text: 'Economize tempo com métodos comprovados', style: 'prático' },
          { id: '2', text: 'Suporte especializado sempre que precisar', style: 'confiança' },
          { id: '3', text: 'Acesso vitalício a todas as atualizações', style: 'valor' }
        ]
      };
      
      setSuggestions(fallbacks[fieldType] || fallbacks.title);
      toast.error('Não foi possível gerar sugestões com IA. Mostrando sugestões alternativas.');
    } finally {
      setIsLoading(false);
    }
  }, [customContext, selectedTone, fieldType]);

  const handleCopy = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Texto copiado!');
  }, []);

  const handleApply = useCallback(() => {
    const selected = suggestions.find(s => s.id === selectedId);
    if (selected) {
      onSelect(selected.text);
      setIsOpen(false);
      toast.success('Sugestão aplicada!');
    }
  }, [suggestions, selectedId, onSelect]);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size={size}
        onClick={() => {
          setIsOpen(true);
          setCustomContext(context);
          if (suggestions.length === 0) {
            generateSuggestions();
          }
        }}
        className={cn(
          "text-primary hover:text-primary hover:bg-primary/10",
          size === 'icon' && "h-8 w-8",
          className
        )}
        title="Gerar sugestão com IA"
      >
        <Sparkles className={cn(size === 'icon' ? "h-4 w-4" : "h-4 w-4 mr-2")} />
        {size !== 'icon' && "IA"}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Sugestões de IA
            </DialogTitle>
            <DialogDescription>
              Gere variações de {FIELD_PROMPTS[fieldType]} usando inteligência artificial
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Context Input */}
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Contexto do Produto</Label>
              <Textarea
                value={customContext}
                onChange={(e) => setCustomContext(e.target.value)}
                placeholder="Ex: Curso de Python para iniciantes, Ebook sobre marketing digital..."
                rows={2}
                className="text-sm resize-none"
              />
            </div>

            {/* Tone Selection */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Tom da Mensagem</Label>
              <RadioGroup
                value={selectedTone}
                onValueChange={(v) => setSelectedTone(v as typeof selectedTone)}
                className="grid grid-cols-2 gap-2"
              >
                {Object.entries(TONE_LABELS).map(([value, label]) => (
                  <div key={value} className="flex items-center space-x-2">
                    <RadioGroupItem value={value} id={value} />
                    <Label htmlFor={value} className="text-sm cursor-pointer">{label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Generate Button */}
            <Button
              type="button"
              variant="outline"
              onClick={generateSuggestions}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando sugestões...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {suggestions.length > 0 ? 'Gerar Novas' : 'Gerar Sugestões'}
                </>
              )}
            </Button>

            {/* Suggestions List */}
            {suggestions.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Selecione uma sugestão:</Label>
                <RadioGroup
                  value={selectedId || ''}
                  onValueChange={setSelectedId}
                  className="space-y-2"
                >
                  {suggestions.map((suggestion) => (
                    <div
                      key={suggestion.id}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer",
                        selectedId === suggestion.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                      onClick={() => setSelectedId(suggestion.id)}
                    >
                      <RadioGroupItem value={suggestion.id} id={`s-${suggestion.id}`} className="mt-1" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-relaxed">{suggestion.text}</p>
                        <Badge variant="secondary" className="mt-1 text-[10px]">
                          {suggestion.style}
                        </Badge>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(suggestion.text, suggestion.id);
                        }}
                      >
                        {copiedId === suggestion.id ? (
                          <Check className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {/* Apply Button */}
            {selectedId && (
              <Button
                type="button"
                onClick={handleApply}
                className="w-full"
              >
                <Check className="h-4 w-4 mr-2" />
                Aplicar Sugestão
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default AISuggestionButton;
