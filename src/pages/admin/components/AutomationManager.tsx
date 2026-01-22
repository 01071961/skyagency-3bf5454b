import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Zap, Trash2, Play, RefreshCw, Mail, UserCheck, Bell, AlertTriangle, Clock, Settings, History } from "lucide-react";
import { motion } from "framer-motion";

interface AutomationRule {
  id: string;
  name: string;
  description: string | null;
  trigger_type: string;
  trigger_config: Record<string, any>;
  action_type: string;
  action_config: Record<string, any>;
  is_active: boolean;
  priority: number;
  execution_count: number;
  last_executed_at: string | null;
  created_at: string;
}

interface AutomationLog {
  id: string;
  rule_id: string;
  trigger_data: Record<string, any>;
  action_result: Record<string, any>;
  status: string;
  error_message: string | null;
  executed_at: string;
}

const TRIGGER_TYPES = [
  { value: "vip_lead", label: "Lead VIP", icon: UserCheck, description: "Quando um lead VIP é cadastrado" },
  { value: "new_conversation", label: "Nova Conversa", icon: Bell, description: "Quando uma nova conversa inicia" },
  { value: "abandoned_form", label: "Formulário Abandonado", icon: AlertTriangle, description: "Quando formulário é abandonado" },
  { value: "low_rating", label: "Avaliação Baixa", icon: AlertTriangle, description: "Quando avaliação é baixa" },
  { value: "inactivity", label: "Inatividade", icon: Clock, description: "Após período de inatividade" },
  { value: "keyword", label: "Palavra-chave", icon: Zap, description: "Quando detectar palavra-chave" },
];

const ACTION_TYPES = [
  { value: "send_email", label: "Enviar Email", icon: Mail },
  { value: "assign_admin", label: "Atribuir Admin", icon: UserCheck },
  { value: "notify_admin", label: "Notificar Admin", icon: Bell },
  { value: "create_task", label: "Criar Tarefa", icon: Plus },
  { value: "webhook", label: "Webhook (Slack/Discord/etc)", icon: Zap },
];

const WEBHOOK_PRESETS = [
  { value: "slack", label: "Slack", placeholder: "https://hooks.slack.com/services/...", icon: "💬" },
  { value: "discord", label: "Discord", placeholder: "https://discord.com/api/webhooks/...", icon: "🎮" },
  { value: "twitch", label: "Twitch", placeholder: "https://api.twitch.tv/...", icon: "📺" },
  { value: "zapier", label: "Zapier", placeholder: "https://hooks.zapier.com/hooks/catch/...", icon: "⚡" },
  { value: "custom", label: "URL Personalizada", placeholder: "https://...", icon: "🔗" },
];

const AutomationManager = () => {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [templates, setTemplates] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    trigger_type: "vip_lead",
    trigger_config: {} as Record<string, any>,
    action_type: "send_email",
    action_config: {} as Record<string, any>,
    priority: 5,
  });

  const fetchRules = async () => {
    try {
      const { data, error } = await supabase
        .from("automation_rules")
        .select("*")
        .order("priority", { ascending: false });
      if (error) throw error;
      setRules((data as AutomationRule[]) || []);
    } catch (error) {
      console.error("Error fetching rules:", error);
      toast.error("Erro ao carregar regras");
    }
  };

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("automation_logs")
        .select("*")
        .order("executed_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      setLogs((data as AutomationLog[]) || []);
    } catch (error) {
      console.error("Error fetching logs:", error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("email_templates")
        .select("id, name")
        .eq("is_active", true);
      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  };

  useEffect(() => {
    Promise.all([fetchRules(), fetchLogs(), fetchTemplates()]).finally(() => setIsLoading(false));
  }, []);

  const handleSaveRule = async () => {
    try {
      if (editingRule) {
        const { error } = await supabase
          .from("automation_rules")
          .update({
            name: formData.name,
            description: formData.description,
            trigger_type: formData.trigger_type,
            trigger_config: formData.trigger_config,
            action_type: formData.action_type,
            action_config: formData.action_config,
            priority: formData.priority,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingRule.id);
        if (error) throw error;
        toast.success("Regra atualizada!");
      } else {
        const { error } = await supabase
          .from("automation_rules")
          .insert({
            name: formData.name,
            description: formData.description,
            trigger_type: formData.trigger_type,
            trigger_config: formData.trigger_config,
            action_type: formData.action_type,
            action_config: formData.action_config,
            priority: formData.priority,
            is_active: true,
          });
        if (error) throw error;
        toast.success("Regra criada!");
      }
      setIsDialogOpen(false);
      setEditingRule(null);
      resetForm();
      fetchRules();
    } catch (error) {
      console.error("Error saving rule:", error);
      toast.error("Erro ao salvar regra");
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta regra?")) return;
    try {
      const { error } = await supabase.from("automation_rules").delete().eq("id", ruleId);
      if (error) throw error;
      toast.success("Regra excluída!");
      fetchRules();
    } catch (error) {
      toast.error("Erro ao excluir regra");
    }
  };

  const handleToggleRule = async (rule: AutomationRule) => {
    try {
      const { error } = await supabase
        .from("automation_rules")
        .update({ is_active: !rule.is_active, updated_at: new Date().toISOString() })
        .eq("id", rule.id);
      if (error) throw error;
      toast.success(rule.is_active ? "Regra desativada" : "Regra ativada");
      fetchRules();
    } catch (error) {
      toast.error("Erro ao atualizar regra");
    }
  };

  const handleTestRule = async (rule: AutomationRule) => {
    try {
      toast.info("Executando regra de teste...");
      const { data, error } = await supabase.functions.invoke("admin-ai-assistant", {
        body: {
          message: `Execute a regra de automação "${rule.name}" com dados de teste`,
          context: "general",
        },
      });
      if (error) throw error;
      toast.success("Regra executada com sucesso!");
      fetchLogs();
    } catch (error) {
      toast.error("Erro ao executar regra");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      trigger_type: "vip_lead",
      trigger_config: {},
      action_type: "send_email",
      action_config: {},
      priority: 5,
    });
  };

  const openEditDialog = (rule: AutomationRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description || "",
      trigger_type: rule.trigger_type,
      trigger_config: rule.trigger_config,
      action_type: rule.action_type,
      action_config: rule.action_config,
      priority: rule.priority,
    });
    setIsDialogOpen(true);
  };

  const getTriggerIcon = (type: string) => {
    const trigger = TRIGGER_TYPES.find(t => t.value === type);
    return trigger?.icon || Zap;
  };

  const getActionIcon = (type: string) => {
    const action = ACTION_TYPES.find(a => a.value === type);
    return action?.icon || Zap;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Automações</h2>
          <p className="text-muted-foreground">
            Configure regras automáticas para ações do sistema
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { setEditingRule(null); resetForm(); } }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Regra
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingRule ? "Editar Regra" : "Nova Regra de Automação"}</DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome da Regra</Label>
                <Input
                  id="name"
                  placeholder="Ex: Enviar email para leads VIP"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva o que esta regra faz..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Gatilho (Quando)</Label>
                  <Select
                    value={formData.trigger_type}
                    onValueChange={(value) => setFormData({ ...formData, trigger_type: value, trigger_config: {} })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRIGGER_TYPES.map((trigger) => (
                        <SelectItem key={trigger.value} value={trigger.value}>
                          <div className="flex items-center gap-2">
                            <trigger.icon className="h-4 w-4" />
                            {trigger.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Ação (Fazer)</Label>
                  <Select
                    value={formData.action_type}
                    onValueChange={(value) => setFormData({ ...formData, action_type: value, action_config: {} })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTION_TYPES.map((action) => (
                        <SelectItem key={action.value} value={action.value}>
                          <div className="flex items-center gap-2">
                            <action.icon className="h-4 w-4" />
                            {action.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Trigger Config */}
              {formData.trigger_type === "keyword" && (
                <div className="grid gap-2">
                  <Label>Palavras-chave (separadas por vírgula)</Label>
                  <Input
                    placeholder="urgente, VIP, premium"
                    value={formData.trigger_config.keywords || ""}
                    onChange={(e) => setFormData({
                      ...formData,
                      trigger_config: { ...formData.trigger_config, keywords: e.target.value }
                    })}
                  />
                </div>
              )}

              {formData.trigger_type === "inactivity" && (
                <div className="grid gap-2">
                  <Label>Minutos de inatividade</Label>
                  <Input
                    type="number"
                    placeholder="10"
                    value={formData.trigger_config.minutes || ""}
                    onChange={(e) => setFormData({
                      ...formData,
                      trigger_config: { ...formData.trigger_config, minutes: parseInt(e.target.value) }
                    })}
                  />
                </div>
              )}

              {formData.trigger_type === "low_rating" && (
                <div className="grid gap-2">
                  <Label>Avaliação mínima para disparar</Label>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    placeholder="2"
                    value={formData.trigger_config.threshold || ""}
                    onChange={(e) => setFormData({
                      ...formData,
                      trigger_config: { ...formData.trigger_config, threshold: parseInt(e.target.value) }
                    })}
                  />
                </div>
              )}

              {/* Action Config */}
              {formData.action_type === "send_email" && (
                <div className="grid gap-2">
                  <Label>Template de Email</Label>
                  <Select
                    value={formData.action_config.template_id || ""}
                    onValueChange={(value) => setFormData({
                      ...formData,
                      action_config: { ...formData.action_config, template_id: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.action_type === "notify_admin" && (
                <div className="grid gap-2">
                  <Label>Email do Admin para notificar</Label>
                  <Input
                    type="email"
                    placeholder="admin@example.com"
                    value={formData.action_config.admin_email || ""}
                    onChange={(e) => setFormData({
                      ...formData,
                      action_config: { ...formData.action_config, admin_email: e.target.value }
                    })}
                  />
                </div>
              )}

              {formData.action_type === "webhook" && (
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Tipo de Webhook</Label>
                    <Select
                      value={formData.action_config.webhook_type || "custom"}
                      onValueChange={(value) => setFormData({
                        ...formData,
                        action_config: { ...formData.action_config, webhook_type: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {WEBHOOK_PRESETS.map((preset) => (
                          <SelectItem key={preset.value} value={preset.value}>
                            <span className="flex items-center gap-2">
                              <span>{preset.icon}</span>
                              {preset.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label>URL do Webhook</Label>
                    <Input
                      type="url"
                      placeholder={WEBHOOK_PRESETS.find(p => p.value === (formData.action_config.webhook_type || "custom"))?.placeholder}
                      value={formData.action_config.webhook_url || ""}
                      onChange={(e) => setFormData({
                        ...formData,
                        action_config: { ...formData.action_config, webhook_url: e.target.value }
                      })}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Mensagem do Webhook</Label>
                    <Textarea
                      placeholder="Novo lead VIP: {{name}} ({{email}})"
                      value={formData.action_config.webhook_message || ""}
                      onChange={(e) => setFormData({
                        ...formData,
                        action_config: { ...formData.action_config, webhook_message: e.target.value }
                      })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Use {"{{name}}"}, {"{{email}}"}, {"{{phone}}"} para dados dinâmicos
                    </p>
                  </div>
                </div>
              )}

              <div className="grid gap-2">
                <Label>Prioridade (1-10)</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 5 })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsDialogOpen(false); setEditingRule(null); resetForm(); }}>
                Cancelar
              </Button>
              <Button onClick={handleSaveRule} disabled={!formData.name || !formData.trigger_type || !formData.action_type}>
                {editingRule ? "Salvar Alterações" : "Criar Regra"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="rules">
        <TabsList>
          <TabsTrigger value="rules">Regras ({rules.length})</TabsTrigger>
          <TabsTrigger value="logs">Histórico ({logs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="mt-4">
          {rules.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Zap className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhuma regra de automação configurada</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Crie regras como "Quando chegar lead VIP, enviar email automaticamente"
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {rules.map((rule, i) => {
                const TriggerIcon = getTriggerIcon(rule.trigger_type);
                const ActionIcon = getActionIcon(rule.action_type);
                return (
                  <motion.div
                    key={rule.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className={!rule.is_active ? "opacity-60" : ""}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                                <TriggerIcon className="h-5 w-5 text-primary" />
                              </div>
                              <span className="text-muted-foreground">→</span>
                              <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center">
                                <ActionIcon className="h-5 w-5 text-accent-foreground" />
                              </div>
                            </div>
                            <div>
                              <p className="font-medium">{rule.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {TRIGGER_TYPES.find(t => t.value === rule.trigger_type)?.label} → {ACTION_TYPES.find(a => a.value === rule.action_type)?.label}
                              </p>
                              {rule.description && (
                                <p className="text-xs text-muted-foreground mt-1">{rule.description}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right text-sm">
                              <p className="text-muted-foreground">Execuções: {rule.execution_count}</p>
                              {rule.last_executed_at && (
                                <p className="text-xs text-muted-foreground">
                                  Última: {format(new Date(rule.last_executed_at), "dd/MM HH:mm", { locale: ptBR })}
                                </p>
                              )}
                            </div>
                            <Badge variant={rule.is_active ? "default" : "secondary"}>
                              P{rule.priority}
                            </Badge>
                            <Switch
                              checked={rule.is_active}
                              onCheckedChange={() => handleToggleRule(rule)}
                            />
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => handleTestRule(rule)} title="Testar regra">
                                <Play className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => openEditDialog(rule)} title="Editar">
                                <Settings className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteRule(rule.id)} title="Excluir">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="logs" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-5 w-5" />
                Histórico de Execuções
              </CardTitle>
              <CardDescription>Últimas 50 execuções de automações</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {logs.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Nenhuma execução registrada</p>
                ) : (
                  <div className="space-y-2">
                    {logs.map((log) => {
                      const rule = rules.find(r => r.id === log.rule_id);
                      return (
                        <div key={log.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{rule?.name || log.rule_id}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(log.executed_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                            </p>
                          </div>
                          <Badge variant={log.status === "success" ? "default" : log.status === "failed" ? "destructive" : "secondary"}>
                            {log.status}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AutomationManager;
