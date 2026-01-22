import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Brain, Sparkles } from 'lucide-react';

interface AddLearningDialogProps {
  onLearningAdded?: () => void;
  trigger?: React.ReactNode;
  initialData?: {
    pattern?: string;
    category?: string;
    keywords?: string[];
    response_template?: string;
  };
}

const CATEGORIES = [
  { value: 'general', label: 'Geral' },
  { value: 'support', label: 'Suporte' },
  { value: 'sales', label: 'Vendas' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'streaming', label: 'Streaming' },
  { value: 'technical', label: 'Técnico' },
  { value: 'behavior', label: 'Comportamento' },
  { value: 'quality', label: 'Qualidade' },
];

export function AddLearningDialog({ onLearningAdded, trigger, initialData }: AddLearningDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    pattern: initialData?.pattern || '',
    category: initialData?.category || 'general',
    keywords: initialData?.keywords?.join(', ') || '',
    response_template: initialData?.response_template || '',
    is_active: true,
  });

  const handleSubmit = async () => {
    if (!formData.pattern.trim()) {
      toast.error('O padrão é obrigatório');
      return;
    }

    setIsLoading(true);
    try {
      const keywordsArray = formData.keywords
        .split(',')
        .map(k => k.trim())
        .filter(Boolean);

      const { error } = await supabase.from('ai_learnings').insert({
        pattern: formData.pattern.trim(),
        category: formData.category,
        keywords: keywordsArray.length > 0 ? keywordsArray : null,
        response_template: formData.response_template.trim() || null,
        is_active: formData.is_active,
        success_score: 0,
        fail_score: 0,
      });

      if (error) throw error;

      toast.success('Padrão de aprendizado adicionado!');
      setOpen(false);
      setFormData({
        pattern: '',
        category: 'general',
        keywords: '',
        response_template: '',
        is_active: true,
      });
      onLearningAdded?.();
    } catch (error) {
      console.error('Error adding learning:', error);
      toast.error('Erro ao adicionar padrão');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Padrão
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Adicionar Padrão de Aprendizado
          </DialogTitle>
          <DialogDescription>
            Ensine a IA a reconhecer e responder a novos padrões de conversa
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="pattern">Padrão / Nome</Label>
            <Input
              id="pattern"
              value={formData.pattern}
              onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
              placeholder="Ex: evitar_repeticao_resposta"
            />
            <p className="text-xs text-muted-foreground">
              Nome identificador do padrão (snake_case recomendado)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="keywords">Palavras-chave (opcional)</Label>
            <Input
              id="keywords"
              value={formData.keywords}
              onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
              placeholder="palavra1, palavra2, palavra3"
            />
            <p className="text-xs text-muted-foreground">
              Separe por vírgula. Usadas para detectar o padrão.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="response_template">Template de Resposta (opcional)</Label>
            <Textarea
              id="response_template"
              value={formData.response_template}
              onChange={(e) => setFormData({ ...formData, response_template: e.target.value })}
              placeholder="Sugestão de como a IA deve responder quando este padrão for identificado..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Modelo de resposta que a IA deve considerar
            </p>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <Label htmlFor="is_active" className="cursor-pointer">
                Ativar imediatamente
              </Label>
            </div>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Salvando...' : 'Adicionar Padrão'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
