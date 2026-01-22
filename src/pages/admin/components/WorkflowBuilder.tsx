import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, Plus, Trash2, Mail, Clock, Users, ShoppingCart,
  UserPlus, LogOut, MousePointer, GitBranch, Save, ArrowRight,
  Settings, Zap, Timer, Filter, ChevronDown, ChevronUp, X, Check
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

type TriggerType = 'signup' | 'purchase' | 'inactivity' | 'page_visit' | 'form_submit' | 'tag_added';
type ActionType = 'send_email' | 'wait' | 'condition' | 'add_tag' | 'remove_tag' | 'update_contact';

interface WorkflowTrigger {
  id: string;
  type: TriggerType;
  config: Record<string, any>;
}

interface WorkflowAction {
  id: string;
  type: ActionType;
  config: Record<string, any>;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  actions: WorkflowAction[];
  isActive: boolean;
  createdAt: string;
}

const TRIGGER_OPTIONS: { type: TriggerType; label: string; icon: React.ElementType; description: string }[] = [
  { type: 'signup', label: 'Novo Cadastro', icon: UserPlus, description: 'Quando alguém se cadastra' },
  { type: 'purchase', label: 'Compra Realizada', icon: ShoppingCart, description: 'Após uma compra' },
  { type: 'inactivity', label: 'Inatividade', icon: LogOut, description: 'Usuário inativo por X dias' },
  { type: 'page_visit', label: 'Visita de Página', icon: MousePointer, description: 'Quando visita uma página' },
  { type: 'form_submit', label: 'Formulário Enviado', icon: Mail, description: 'Ao enviar formulário' },
  { type: 'tag_added', label: 'Tag Adicionada', icon: Users, description: 'Quando uma tag é adicionada' },
];

const ACTION_OPTIONS: { type: ActionType; label: string; icon: React.ElementType; description: string }[] = [
  { type: 'send_email', label: 'Enviar E-mail', icon: Mail, description: 'Envia um e-mail' },
  { type: 'wait', label: 'Aguardar', icon: Timer, description: 'Espera um período' },
  { type: 'condition', label: 'Condição', icon: GitBranch, description: 'Verifica uma condição' },
  { type: 'add_tag', label: 'Adicionar Tag', icon: Plus, description: 'Adiciona tag ao contato' },
  { type: 'remove_tag', label: 'Remover Tag', icon: X, description: 'Remove tag do contato' },
  { type: 'update_contact', label: 'Atualizar Contato', icon: Settings, description: 'Atualiza dados do contato' },
];

const generateId = () => Math.random().toString(36).substr(2, 9);

interface WorkflowBuilderProps {
  onSave?: (workflow: Workflow) => void;
  initialWorkflow?: Workflow;
}

const WorkflowBuilder = ({ onSave, initialWorkflow }: WorkflowBuilderProps) => {
  const [workflow, setWorkflow] = useState<Workflow>(initialWorkflow || {
    id: generateId(),
    name: '',
    description: '',
    trigger: { id: generateId(), type: 'signup', config: {} },
    actions: [],
    isActive: false,
    createdAt: new Date().toISOString(),
  });
  
  const [selectedNode, setSelectedNode] = useState<'trigger' | string | null>(null);
  const [showActionPicker, setShowActionPicker] = useState(false);
  const [insertIndex, setInsertIndex] = useState<number>(0);
  const [expandedActions, setExpandedActions] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const toggleExpanded = (id: string) => {
    setExpandedActions(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addAction = (type: ActionType, index: number) => {
    const newAction: WorkflowAction = {
      id: generateId(),
      type,
      config: type === 'wait' ? { duration: 1, unit: 'days' } : 
              type === 'send_email' ? { template_id: '', subject: '' } :
              type === 'condition' ? { field: '', operator: 'equals', value: '' } :
              {},
    };
    
    const newActions = [...workflow.actions];
    newActions.splice(index, 0, newAction);
    setWorkflow({ ...workflow, actions: newActions });
    setExpandedActions(prev => new Set(prev).add(newAction.id));
    setShowActionPicker(false);
  };

  const removeAction = (id: string) => {
    setWorkflow({
      ...workflow,
      actions: workflow.actions.filter(a => a.id !== id),
    });
  };

  const updateActionConfig = (id: string, config: Record<string, any>) => {
    setWorkflow({
      ...workflow,
      actions: workflow.actions.map(a => 
        a.id === id ? { ...a, config: { ...a.config, ...config } } : a
      ),
    });
  };

  const updateTriggerConfig = (config: Record<string, any>) => {
    setWorkflow({
      ...workflow,
      trigger: { ...workflow.trigger, config: { ...workflow.trigger.config, ...config } },
    });
  };

  const handleSave = () => {
    if (!workflow.name) {
      toast({
        title: 'Nome obrigatório',
        description: 'Dê um nome para sua automação.',
        variant: 'destructive',
      });
      return;
    }

    if (workflow.actions.length === 0) {
      toast({
        title: 'Adicione ações',
        description: 'Sua automação precisa de pelo menos uma ação.',
        variant: 'destructive',
      });
      return;
    }

    onSave?.(workflow);
    toast({
      title: 'Automação salva!',
      description: `"${workflow.name}" foi salva com sucesso.`,
    });
  };

  const getTriggerInfo = (type: TriggerType) => TRIGGER_OPTIONS.find(t => t.type === type)!;
  const getActionInfo = (type: ActionType) => ACTION_OPTIONS.find(a => a.type === type)!;

  const renderTriggerConfig = () => {
    const { type, config } = workflow.trigger;
    
    switch (type) {
      case 'inactivity':
        return (
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-1">
                <Label className="text-xs">Dias de inatividade</Label>
                <Input
                  type="number"
                  value={config.days || 7}
                  onChange={(e) => updateTriggerConfig({ days: parseInt(e.target.value) })}
                  className="bg-muted/50"
                />
              </div>
            </div>
          </div>
        );
      case 'page_visit':
        return (
          <div className="space-y-3">
            <Label className="text-xs">URL da página (contém)</Label>
            <Input
              value={config.url_contains || ''}
              onChange={(e) => updateTriggerConfig({ url_contains: e.target.value })}
              placeholder="/pricing, /checkout..."
              className="bg-muted/50"
            />
          </div>
        );
      case 'tag_added':
        return (
          <div className="space-y-3">
            <Label className="text-xs">Nome da tag</Label>
            <Input
              value={config.tag_name || ''}
              onChange={(e) => updateTriggerConfig({ tag_name: e.target.value })}
              placeholder="vip, lead_quente..."
              className="bg-muted/50"
            />
          </div>
        );
      default:
        return null;
    }
  };

  const renderActionConfig = (action: WorkflowAction) => {
    switch (action.type) {
      case 'send_email':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Assunto do e-mail</Label>
              <Input
                value={action.config.subject || ''}
                onChange={(e) => updateActionConfig(action.id, { subject: e.target.value })}
                placeholder="Assunto do e-mail..."
                className="bg-muted/50"
              />
            </div>
            <div>
              <Label className="text-xs">Template</Label>
              <Select
                value={action.config.template_id || ''}
                onValueChange={(value) => updateActionConfig(action.id, { template_id: value })}
              >
                <SelectTrigger className="bg-muted/50">
                  <SelectValue placeholder="Selecione um template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="welcome">Boas-vindas</SelectItem>
                  <SelectItem value="purchase_confirmation">Confirmação de Compra</SelectItem>
                  <SelectItem value="newsletter">Newsletter</SelectItem>
                  <SelectItem value="promotional">Promoção</SelectItem>
                  <SelectItem value="reengagement">Reengajamento</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      case 'wait':
        return (
          <div className="flex gap-3">
            <div className="flex-1">
              <Label className="text-xs">Duração</Label>
              <Input
                type="number"
                value={action.config.duration || 1}
                onChange={(e) => updateActionConfig(action.id, { duration: parseInt(e.target.value) })}
                className="bg-muted/50"
              />
            </div>
            <div className="flex-1">
              <Label className="text-xs">Unidade</Label>
              <Select
                value={action.config.unit || 'days'}
                onValueChange={(value) => updateActionConfig(action.id, { unit: value })}
              >
                <SelectTrigger className="bg-muted/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minutes">Minutos</SelectItem>
                  <SelectItem value="hours">Horas</SelectItem>
                  <SelectItem value="days">Dias</SelectItem>
                  <SelectItem value="weeks">Semanas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      case 'condition':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">Campo</Label>
                <Select
                  value={action.config.field || ''}
                  onValueChange={(value) => updateActionConfig(action.id, { field: value })}
                >
                  <SelectTrigger className="bg-muted/50">
                    <SelectValue placeholder="Campo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email_opened">E-mail aberto</SelectItem>
                    <SelectItem value="email_clicked">Link clicado</SelectItem>
                    <SelectItem value="has_tag">Possui tag</SelectItem>
                    <SelectItem value="purchase_count">Qtd compras</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Operador</Label>
                <Select
                  value={action.config.operator || 'equals'}
                  onValueChange={(value) => updateActionConfig(action.id, { operator: value })}
                >
                  <SelectTrigger className="bg-muted/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equals">Igual a</SelectItem>
                    <SelectItem value="not_equals">Diferente de</SelectItem>
                    <SelectItem value="greater">Maior que</SelectItem>
                    <SelectItem value="less">Menor que</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Valor</Label>
                <Input
                  value={action.config.value || ''}
                  onChange={(e) => updateActionConfig(action.id, { value: e.target.value })}
                  className="bg-muted/50"
                />
              </div>
            </div>
          </div>
        );
      case 'add_tag':
      case 'remove_tag':
        return (
          <div>
            <Label className="text-xs">Nome da tag</Label>
            <Input
              value={action.config.tag_name || ''}
              onChange={(e) => updateActionConfig(action.id, { tag_name: e.target.value })}
              placeholder="nome_da_tag"
              className="bg-muted/50"
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1 space-y-2">
          <Input
            value={workflow.name}
            onChange={(e) => setWorkflow({ ...workflow, name: e.target.value })}
            placeholder="Nome da Automação"
            className="text-xl font-bold bg-transparent border-none focus-visible:ring-0 p-0 h-auto"
          />
          <Input
            value={workflow.description}
            onChange={(e) => setWorkflow({ ...workflow, description: e.target.value })}
            placeholder="Descrição (opcional)"
            className="text-sm text-muted-foreground bg-transparent border-none focus-visible:ring-0 p-0 h-auto"
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={workflow.isActive}
              onCheckedChange={(checked) => setWorkflow({ ...workflow, isActive: checked })}
            />
            <Label className="text-sm">
              {workflow.isActive ? 'Ativa' : 'Inativa'}
            </Label>
          </div>
          <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
            <Save className="w-4 h-4 mr-2" />
            Salvar
          </Button>
        </div>
      </div>

      {/* Workflow Canvas */}
      <div className="relative">
        {/* Trigger Node */}
        <motion.div layout className="flex flex-col items-center">
          <Card 
            className={`w-80 bg-card border-2 cursor-pointer transition-all ${
              selectedNode === 'trigger' ? 'border-primary shadow-lg shadow-primary/20' : 'border-border hover:border-primary/50'
            }`}
            onClick={() => setSelectedNode(selectedNode === 'trigger' ? null : 'trigger')}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Gatilho</p>
                  <Select
                    value={workflow.trigger.type}
                    onValueChange={(value: TriggerType) => setWorkflow({
                      ...workflow,
                      trigger: { ...workflow.trigger, type: value, config: {} }
                    })}
                  >
                    <SelectTrigger className="border-none p-0 h-auto text-foreground font-medium focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRIGGER_OPTIONS.map((opt) => (
                        <SelectItem key={opt.type} value={opt.type}>
                          <div className="flex items-center gap-2">
                            <opt.icon className="w-4 h-4" />
                            {opt.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <AnimatePresence>
                {selectedNode === 'trigger' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 border-t border-border mt-4">
                      {renderTriggerConfig()}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Connection Line */}
          <div className="w-0.5 h-8 bg-border" />
          
          {/* Add Action Button (at start) */}
          <Button
            variant="outline"
            size="sm"
            className="rounded-full w-8 h-8 p-0 border-dashed"
            onClick={() => { setInsertIndex(0); setShowActionPicker(true); }}
          >
            <Plus className="w-4 h-4" />
          </Button>
          
          <div className="w-0.5 h-8 bg-border" />

          {/* Action Nodes */}
          {workflow.actions.map((action, index) => {
            const info = getActionInfo(action.type);
            const isExpanded = expandedActions.has(action.id);
            
            return (
              <motion.div
                key={action.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center"
              >
                <Card 
                  className={`w-80 bg-card border-2 transition-all ${
                    selectedNode === action.id ? 'border-primary shadow-lg shadow-primary/20' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        action.type === 'send_email' ? 'bg-gradient-to-br from-pink-500 to-rose-600' :
                        action.type === 'wait' ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
                        action.type === 'condition' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' :
                        'bg-gradient-to-br from-purple-500 to-violet-600'
                      }`}>
                        <info.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Ação #{index + 1}</p>
                        <p className="font-medium text-foreground">{info.label}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-7 h-7 p-0"
                          onClick={() => toggleExpanded(action.id)}
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-7 h-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => removeAction(action.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-4 border-t border-border mt-4">
                            {renderActionConfig(action)}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>

                {/* Connection Line + Add Button */}
                <div className="w-0.5 h-8 bg-border" />
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full w-8 h-8 p-0 border-dashed"
                  onClick={() => { setInsertIndex(index + 1); setShowActionPicker(true); }}
                >
                  <Plus className="w-4 h-4" />
                </Button>
                {index < workflow.actions.length - 1 && <div className="w-0.5 h-8 bg-border" />}
              </motion.div>
            );
          })}

          {/* End Node */}
          {workflow.actions.length > 0 && (
            <>
              <div className="w-0.5 h-8 bg-border" />
              <div className="w-12 h-12 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center">
                <Check className="w-5 h-5 text-muted-foreground" />
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* Action Picker Dialog */}
      <Dialog open={showActionPicker} onOpenChange={setShowActionPicker}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground">Adicionar Ação</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-4">
            {ACTION_OPTIONS.map((action) => (
              <Card
                key={action.type}
                className="bg-muted/30 border-border hover:border-primary/50 cursor-pointer transition-all"
                onClick={() => addAction(action.type, insertIndex)}
              >
                <CardContent className="p-4 flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    action.type === 'send_email' ? 'bg-gradient-to-br from-pink-500 to-rose-600' :
                    action.type === 'wait' ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
                    action.type === 'condition' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' :
                    'bg-gradient-to-br from-purple-500 to-violet-600'
                  }`}>
                    <action.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{action.label}</p>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkflowBuilder;
