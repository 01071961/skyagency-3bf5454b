import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { 
  Bot, 
  HeadphonesIcon, 
  ShoppingCart, 
  Megaphone, 
  UserCheck, 
  Settings, 
  Brain,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  RefreshCw,
  BarChart3,
  Plus
} from "lucide-react";
import { AIMetricsDashboard, AddLearningDialog, AIActionHistory } from "./ai";

interface ModeConfig {
  id: string;
  mode_name: string;
  is_active: boolean;
  temperature: number;
  max_tokens: number;
  system_prompt: string;
  settings: any;
}

interface AIFeedback {
  id: string;
  message_id: string | null;
  rating: number | null;
  comment: string | null;
  created_at: string;
}

interface AILearning {
  id: string;
  pattern: string;
  category: string;
  response: string;
  confidence: number;
  success_rate: number;
  is_active: boolean;
}

interface ChatConversation {
  current_mode?: string;
  ai_confidence?: number;
  escalation_reason?: string;
  rating?: number;
  status: string;
  created_at: string;
}

const modeIcons: Record<string, React.ReactNode> = {
  support: <HeadphonesIcon className="h-5 w-5" />,
  sales: <ShoppingCart className="h-5 w-5" />,
  marketing: <Megaphone className="h-5 w-5" />,
  handoff_human: <UserCheck className="h-5 w-5" />,
};

const modeColors: Record<string, string> = {
  support: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  sales: "bg-green-500/20 text-green-400 border-green-500/30",
  marketing: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  handoff_human: "bg-orange-500/20 text-orange-400 border-orange-500/30",
};

const modeLabels: Record<string, string> = {
  support: "Suporte",
  sales: "Vendas",
  marketing: "Marketing",
  handoff_human: "Transferência",
};

export function AIModeManager() {
  const [modes, setModes] = useState<ModeConfig[]>([]);
  const [feedback, setFeedback] = useState<AIFeedback[]>([]);
  const [learnings, setLearnings] = useState<AILearning[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMode, setSelectedMode] = useState<ModeConfig | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load mode configs
      const { data: modesData, error: modesError } = await supabase
        .from("ai_mode_config")
        .select("*")
        .order("mode_name");

      if (modesError) throw modesError;
      
      // Map to expected interface
      const mappedModes: ModeConfig[] = (modesData || []).map(m => ({
        id: m.id,
        mode_name: m.mode_name,
        is_active: m.is_active ?? true,
        temperature: m.temperature ?? 0.7,
        max_tokens: m.max_tokens ?? 1000,
        system_prompt: m.system_prompt || '',
        settings: m.settings || {}
      }));
      setModes(mappedModes);

      // Load recent feedback
      const { data: feedbackData, error: feedbackError } = await supabase
        .from("ai_feedback")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (!feedbackError) {
        const mappedFeedback: AIFeedback[] = (feedbackData || []).map(f => ({
          id: f.id,
          message_id: f.message_id,
          rating: f.rating,
          comment: f.comment,
          created_at: f.created_at || new Date().toISOString()
        }));
        setFeedback(mappedFeedback);
      }

      // Load learnings
      const { data: learningsData, error: learningsError } = await supabase
        .from("ai_learnings")
        .select("*")
        .order("success_rate", { ascending: false })
        .limit(50);

      if (!learningsError) {
        const mappedLearnings: AILearning[] = (learningsData || []).map(l => ({
          id: l.id,
          pattern: l.pattern,
          category: l.category,
          response: l.response,
          confidence: l.confidence ?? 0.5,
          success_rate: l.success_rate ?? 0,
          is_active: l.is_active ?? true
        }));
        setLearnings(mappedLearnings);
      }

      // Load conversations for metrics
      const { data: conversationsData } = await supabase
        .from("chat_conversations")
        .select("current_mode, ai_confidence, escalation_reason, rating, status, created_at")
        .order("created_at", { ascending: false })
        .limit(100);

      setConversations((conversationsData || []) as ChatConversation[]);
    } catch (error) {
      console.error("Error loading AI data:", error);
      toast.error("Erro ao carregar configurações da IA");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = async (modeId: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from("ai_mode_config")
        .update({ is_active: enabled })
        .eq("id", modeId);

      if (error) throw error;

      setModes(prev => prev.map(m => 
        m.id === modeId ? { ...m, is_active: enabled } : m
      ));
      toast.success(`Modo ${enabled ? 'ativado' : 'desativado'}`);
    } catch (error) {
      console.error("Error toggling mode:", error);
      toast.error("Erro ao alterar modo");
    }
  };

  const updateModeConfig = async (config: ModeConfig) => {
    try {
      const { error } = await supabase
        .from("ai_mode_config")
        .update({
          system_prompt: config.system_prompt,
          temperature: config.temperature,
          max_tokens: config.max_tokens,
          settings: config.settings,
        })
        .eq("id", config.id);

      if (error) throw error;

      setModes(prev => prev.map(m => m.id === config.id ? config : m));
      setEditDialogOpen(false);
      toast.success("Configuração atualizada");
    } catch (error) {
      console.error("Error updating mode:", error);
      toast.error("Erro ao atualizar configuração");
    }
  };

  const getFeedbackStats = () => {
    const positive = feedback.filter(f => f.rating === 1).length;
    const negative = feedback.filter(f => f.rating === -1).length;
    return { positive, negative, total: feedback.length };
  };

  const stats = getFeedbackStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Brain className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Modos Ativos</p>
                  <p className="text-2xl font-bold">{modes.filter(m => m.is_active).length}/{modes.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <ThumbsUp className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Feedback Positivo</p>
                  <p className="text-2xl font-bold">{stats.positive}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/20">
                  <ThumbsDown className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Feedback Negativo</p>
                  <p className="text-2xl font-bold">{stats.negative}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Sparkles className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Padrões Aprendidos</p>
                  <p className="text-2xl font-bold">{learnings.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Tabs defaultValue="metrics" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="metrics" className="gap-1">
            <BarChart3 className="h-4 w-4" />
            Métricas
          </TabsTrigger>
          <TabsTrigger value="modes">Modos da IA</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="learnings">Aprendizados</TabsTrigger>
          <TabsTrigger value="actions">Histórico de Ações</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="mt-6">
          <AIMetricsDashboard 
            feedback={feedback as any}
            conversations={conversations as any}
            learnings={learnings as any}
          />
        </TabsContent>

        <TabsContent value="modes" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modes.map((mode, index) => (
              <motion.div
                key={mode.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`border ${mode.is_active ? 'border-primary/30' : 'border-muted'}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${modeColors[mode.mode_name] || 'bg-gray-500/20'}`}>
                          {modeIcons[mode.mode_name] || <Bot className="h-5 w-5" />}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{modeLabels[mode.mode_name] || mode.mode_name}</CardTitle>
                          <CardDescription className="text-sm">
                            {mode.system_prompt?.slice(0, 50)}...
                          </CardDescription>
                        </div>
                      </div>
                      <Switch
                        checked={mode.is_active}
                        onCheckedChange={(checked) => toggleMode(mode.id, checked)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Temp: {mode.temperature} | Tokens: {mode.max_tokens}
                      </span>
                      <Dialog open={editDialogOpen && selectedMode?.id === mode.id} onOpenChange={(open) => {
                        setEditDialogOpen(open);
                        if (open) setSelectedMode(mode);
                      }}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Settings className="h-4 w-4 mr-1" />
                            Configurar
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              {modeIcons[mode.mode_name] || <Bot className="h-5 w-5" />}
                              Configurar Modo: {modeLabels[mode.mode_name] || mode.mode_name}
                            </DialogTitle>
                            <DialogDescription>
                              Ajuste o comportamento da IA para este modo
                            </DialogDescription>
                          </DialogHeader>
                          {selectedMode && (
                            <ModeEditForm
                              mode={selectedMode}
                              onSave={updateModeConfig}
                              onCancel={() => setEditDialogOpen(false)}
                            />
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="feedback" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Feedback Recente
              </CardTitle>
              <CardDescription>
                Avaliações das respostas da IA pelos usuários
              </CardDescription>
            </CardHeader>
            <CardContent>
              {feedback.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum feedback registrado ainda
                </p>
              ) : (
                <div className="space-y-3">
                  {feedback.slice(0, 10).map((f) => (
                    <div key={f.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        {f.rating === 1 ? (
                          <ThumbsUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <ThumbsDown className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-sm">
                          {f.comment || (f.rating === 1 ? 'Resposta útil' : 'Resposta não ajudou')}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(f.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="learnings" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Padrões Aprendidos
                  </CardTitle>
                  <CardDescription>
                    Padrões identificados nas conversas bem-sucedidas
                  </CardDescription>
                </div>
                <AddLearningDialog onLearningAdded={loadData} />
              </div>
            </CardHeader>
            <CardContent>
              {learnings.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum padrão registrado ainda. A IA aprenderá com o uso.
                </p>
              ) : (
                <div className="space-y-3">
                  {learnings.map((l) => (
                    <div key={l.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{l.pattern}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">{l.category}</Badge>
                          <span className="text-xs text-muted-foreground">
                            Confiança: {(l.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {l.success_rate > 0.5 ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-sm font-medium">
                          {(l.success_rate * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="mt-6">
          <AIActionHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface ModeEditFormProps {
  mode: ModeConfig;
  onSave: (config: ModeConfig) => void;
  onCancel: () => void;
}

function ModeEditForm({ mode, onSave, onCancel }: ModeEditFormProps) {
  const [config, setConfig] = useState(mode);

  return (
    <div className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label>Prompt do Sistema</Label>
        <Textarea
          value={config.system_prompt}
          onChange={(e) => setConfig({ ...config, system_prompt: e.target.value })}
          rows={6}
          placeholder="Instruções para a IA..."
        />
      </div>

      <div className="space-y-2">
        <Label>Temperatura: {config.temperature}</Label>
        <Slider
          value={[config.temperature]}
          onValueChange={([v]) => setConfig({ ...config, temperature: v })}
          min={0}
          max={1}
          step={0.1}
        />
        <p className="text-xs text-muted-foreground">
          Valores mais altos = respostas mais criativas
        </p>
      </div>

      <div className="space-y-2">
        <Label>Max Tokens</Label>
        <Input
          type="number"
          value={config.max_tokens}
          onChange={(e) => setConfig({ ...config, max_tokens: parseInt(e.target.value) || 1000 })}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={() => onSave(config)}>
          Salvar
        </Button>
      </div>
    </div>
  );
}