import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Power, Sparkles, MessageSquare, BarChart3, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AISettings {
  enabled: boolean;
  auto_campaigns?: boolean;
  error_analysis?: boolean;
}

const AIAssistantControl = () => {
  const [settings, setSettings] = useState<AISettings>({ enabled: true });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_assistant_settings')
        .select('setting_value')
        .eq('setting_key', 'chat_ai_enabled')
        .maybeSingle();

      if (error) throw error;
      
      if (data?.setting_value) {
        const value = data.setting_value as unknown as AISettings;
        if (typeof value === 'object' && value !== null) {
          setSettings({ enabled: value.enabled ?? true, ...value });
        }
      }
    } catch (error) {
      console.error('Error loading AI settings:', error);
      toast.error('Erro ao carregar configurações da IA');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (key: keyof AISettings, value: boolean) => {
    setIsSaving(true);
    const newSettings = { ...settings, [key]: value };
    
    try {
      const { error } = await supabase
        .from('ai_assistant_settings')
        .update({ 
          setting_value: newSettings,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', 'chat_ai_enabled');

      if (error) throw error;
      
      setSettings(newSettings);
      toast.success(
        key === 'enabled' 
          ? value ? 'Assistente IA ativada!' : 'Assistente IA desativada'
          : 'Configuração atualizada'
      );
    } catch (error) {
      console.error('Error updating AI settings:', error);
      toast.error('Erro ao atualizar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="bg-card border-border border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl flex items-center justify-center">
                <Bot className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Assistente IA Autônoma
                  <Badge 
                    variant={settings.enabled ? 'default' : 'secondary'}
                    className={settings.enabled ? 'bg-green-500/20 text-green-500 border-green-500/30' : ''}
                  >
                    {settings.enabled ? 'Ativa' : 'Inativa'}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Configure o comportamento autônomo da IA no chat e campanhas
                </CardDescription>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {isSaving && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
              <Switch
                checked={settings.enabled}
                onCheckedChange={(checked) => updateSetting('enabled', checked)}
                disabled={isSaving}
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Main toggle explanation */}
          <div className={`p-4 rounded-lg ${settings.enabled ? 'bg-green-500/10 border border-green-500/20' : 'bg-muted/50'}`}>
            <div className="flex items-start gap-3">
              <Power className={`w-5 h-5 mt-0.5 ${settings.enabled ? 'text-green-500' : 'text-muted-foreground'}`} />
              <div>
                <p className="font-medium text-foreground">
                  {settings.enabled ? 'IA está respondendo automaticamente' : 'IA está pausada'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {settings.enabled 
                    ? 'A assistente responde automaticamente aos visitantes no chat. Você pode assumir conversas a qualquer momento.'
                    : 'Visitantes aguardarão atendimento humano. Ative para respostas automáticas.'
                  }
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Additional AI capabilities */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Capacidades Adicionais
            </h4>

            <div className="grid gap-4">
              {/* Auto campaigns */}
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  <div>
                    <Label htmlFor="auto-campaigns" className="font-medium">
                      Sugestões de Campanhas
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      IA sugere campanhas baseadas no histórico de conversas
                    </p>
                  </div>
                </div>
                <Switch
                  id="auto-campaigns"
                  checked={settings.auto_campaigns || false}
                  onCheckedChange={(checked) => updateSetting('auto_campaigns', checked)}
                  disabled={isSaving || !settings.enabled}
                />
              </div>

              {/* Error analysis */}
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <div>
                    <Label htmlFor="error-analysis" className="font-medium">
                      Análise de Erros
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      IA monitora e sugere correções para problemas detectados
                    </p>
                  </div>
                </div>
                <Switch
                  id="error-analysis"
                  checked={settings.error_analysis || false}
                  onCheckedChange={(checked) => updateSetting('error_analysis', checked)}
                  disabled={isSaving || !settings.enabled}
                />
              </div>
            </div>
          </div>

          {/* Info box */}
          <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
            <p><strong>💡 Dica:</strong> Quando a IA está ativa, ela responde imediatamente aos visitantes. 
            Use "Assumir Conversa" no Chat Manager para atender pessoalmente quando necessário.</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AIAssistantControl;
