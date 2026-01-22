import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, Server, Key, Wifi, Check, X, Plus, Edit2, Trash2, 
  TestTube, Shield, ExternalLink, AlertCircle, Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ESPConfiguration {
  id: string;
  provider: string;
  name: string;
  is_active: boolean;
  is_default: boolean;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

const ESP_PROVIDERS = [
  { 
    id: 'resend', 
    name: 'Resend', 
    description: 'API moderna e simples. Plano gratuito com 3.000 emails/mês.',
    docs: 'https://resend.com/docs',
    fields: ['api_key'],
    icon: '📧'
  },
  { 
    id: 'brevo', 
    name: 'Brevo (Sendinblue)', 
    description: 'Plano gratuito com 300 emails/dia. Automações avançadas.',
    docs: 'https://developers.brevo.com/',
    fields: ['api_key'],
    icon: '💙'
  },
  { 
    id: 'sendgrid', 
    name: 'Twilio SendGrid', 
    description: 'Plano gratuito com 100 emails/dia. API robusta.',
    docs: 'https://docs.sendgrid.com/',
    fields: ['api_key'],
    icon: '📬'
  },
  { 
    id: 'mailgun', 
    name: 'Mailgun', 
    description: 'API poderosa para emails transacionais. Tier gratuito para testes.',
    docs: 'https://documentation.mailgun.com/',
    fields: ['api_key', 'domain'],
    icon: '🔫'
  },
  { 
    id: 'amazon_ses', 
    name: 'Amazon SES', 
    description: 'Pay-as-you-go muito econômico. Ideal para escalabilidade.',
    docs: 'https://docs.aws.amazon.com/ses/',
    fields: ['access_key_id', 'secret_access_key', 'region'],
    icon: '☁️'
  },
  { 
    id: 'mailersend', 
    name: 'MailerSend', 
    description: 'API moderna com plano gratuito de 3.000 emails/mês.',
    docs: 'https://developers.mailersend.com/',
    fields: ['api_key'],
    icon: '✉️'
  },
  { 
    id: 'smtp', 
    name: 'SMTP Personalizado', 
    description: 'Configure qualquer servidor SMTP (host, porta, usuário, senha).',
    docs: null,
    fields: ['host', 'port', 'username', 'password', 'secure'],
    icon: '🔧'
  },
];

const FIELD_LABELS: Record<string, string> = {
  api_key: 'Chave API',
  domain: 'Domínio',
  access_key_id: 'Access Key ID',
  secret_access_key: 'Secret Access Key',
  region: 'Região',
  host: 'Host SMTP',
  port: 'Porta',
  username: 'Usuário',
  password: 'Senha',
  secure: 'SSL/TLS',
};

const ESPManager = () => {
  const [configurations, setConfigurations] = useState<ESPConfiguration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ESPConfiguration | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    provider: string;
    name: string;
    is_active: boolean;
    is_default: boolean;
    config: Record<string, string>;
  }>({
    provider: '',
    name: '',
    is_active: true,
    is_default: false,
    config: {} as Record<string, string>,
  });
  const { toast } = useToast();

  const fetchConfigurations = async () => {
    try {
      const { data, error } = await supabase
        .from('esp_configurations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConfigurations((data || []).map((item) => ({
        ...item,
        config: typeof item.config === 'object' && item.config !== null ? item.config as Record<string, unknown> : {},
      })));
    } catch (error) {
      console.error('Error fetching ESP configurations:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as configurações.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigurations();
  }, []);

  const handleSave = async () => {
    try {
      if (!formData.provider || !formData.name) {
        toast({
          title: 'Campos obrigatórios',
          description: 'Preencha o provedor e o nome.',
          variant: 'destructive',
        });
        return;
      }

      const payload = {
        provider: formData.provider,
        name: formData.name,
        is_active: formData.is_active,
        is_default: formData.is_default,
        config: formData.config,
      };

      if (editingConfig) {
        const { error } = await supabase
          .from('esp_configurations')
          .update(payload)
          .eq('id', editingConfig.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('esp_configurations')
          .insert(payload);
        if (error) throw error;
      }

      // If setting as default, unset others
      if (formData.is_default) {
        await supabase
          .from('esp_configurations')
          .update({ is_default: false })
          .neq('id', editingConfig?.id || '');
      }

      toast({
        title: 'Configuração salva!',
        description: `ESP ${formData.name} configurado com sucesso.`,
      });

      setIsDialogOpen(false);
      resetForm();
      fetchConfigurations();
    } catch (error) {
      console.error('Error saving ESP configuration:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a configuração.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('esp_configurations')
        .delete()
        .eq('id', id);
      if (error) throw error;

      toast({
        title: 'Configuração removida',
        description: 'A configuração foi excluída com sucesso.',
      });
      fetchConfigurations();
    } catch (error) {
      console.error('Error deleting ESP configuration:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a configuração.',
        variant: 'destructive',
      });
    }
  };

  const handleTest = async (config: ESPConfiguration) => {
    setTestingId(config.id);
    try {
      const { data, error } = await supabase.functions.invoke('test-esp', {
        body: { configId: config.id },
      });

      if (error) {
        console.error('Error testing ESP:', error);
        toast({
          title: 'Configuração salva',
          description: `A configuração foi salva. O teste de conexão não está disponível no momento.`,
        });
        return;
      }

      if (data?.success) {
        toast({
          title: 'Teste bem-sucedido!',
          description: data.message || `Conexão com ${config.name} verificada.`,
        });
      } else {
        toast({
          title: 'Aviso',
          description: data?.message || 'Verifique suas credenciais e tente novamente.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error testing ESP:', error);
      toast({
        title: 'Configuração salva',
        description: 'A configuração foi salva. O teste de conexão será disponibilizado em breve.',
      });
    } finally {
      setTestingId(null);
    }
  };

  const resetForm = () => {
    setEditingConfig(null);
    setFormData({
      provider: '',
      name: '',
      is_active: true,
      is_default: false,
      config: {},
    });
  };

  const openEditDialog = (config: ESPConfiguration) => {
    setEditingConfig(config);
    const configObj = typeof config.config === 'object' && config.config !== null 
      ? config.config as Record<string, string>
      : {};
    setFormData({
      provider: config.provider,
      name: config.name,
      is_active: config.is_active,
      is_default: config.is_default,
      config: configObj,
    });
    setIsDialogOpen(true);
  };

  const selectedProvider = ESP_PROVIDERS.find(p => p.id === formData.provider);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Integrações de E-mail (ESPs)</h2>
          <p className="text-muted-foreground mt-1">
            Configure provedores externos para maior deliverability e escalabilidade
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar ESP
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby="esp-dialog-description">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {editingConfig ? 'Editar Configuração' : 'Nova Integração ESP'}
              </DialogTitle>
              <p id="esp-dialog-description" className="text-sm text-muted-foreground">
                Configure um provedor de e-mail para envio de campanhas.
              </p>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label className="text-foreground">Provedor de E-mail</Label>
                <Select
                  value={formData.provider}
                  onValueChange={(value) => setFormData({ ...formData, provider: value, config: {} })}
                  disabled={!!editingConfig}
                >
                  <SelectTrigger className="bg-muted/50 border-border">
                    <SelectValue placeholder="Selecione um provedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESP_PROVIDERS.map((provider) => (
                      <SelectItem key={provider.id} value={provider.id}>
                        <div className="flex items-center gap-2">
                          <span>{provider.icon}</span>
                          <span>{provider.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedProvider && (
                <>
                  <Alert className="bg-muted/50 border-border">
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-muted-foreground">
                      {selectedProvider.description}
                      {selectedProvider.docs && (
                        <a 
                          href={selectedProvider.docs} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="ml-2 text-primary hover:underline inline-flex items-center gap-1"
                        >
                          Documentação <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label className="text-foreground">Nome da Configuração</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={`Ex: ${selectedProvider.name} Produção`}
                      className="bg-muted/50 border-border"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedProvider.fields.map((field) => (
                      <div key={field} className="space-y-2">
                        <Label className="text-foreground">{FIELD_LABELS[field] || field}</Label>
                        {field === 'secure' ? (
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={formData.config[field] === 'true'}
                              onCheckedChange={(checked) => 
                                setFormData({ 
                                  ...formData, 
                                  config: { ...formData.config, [field]: checked ? 'true' : 'false' } 
                                })
                              }
                            />
                            <span className="text-sm text-muted-foreground">
                              {formData.config[field] === 'true' ? 'Habilitado' : 'Desabilitado'}
                            </span>
                          </div>
                        ) : (
                          <Input
                            type={field.includes('key') || field.includes('password') || field.includes('secret') ? 'password' : 'text'}
                            value={formData.config[field] || ''}
                            onChange={(e) => 
                              setFormData({ 
                                ...formData, 
                                config: { ...formData.config, [field]: e.target.value } 
                              })
                            }
                            placeholder={field === 'port' ? '587' : field === 'region' ? 'us-east-1' : ''}
                            className="bg-muted/50 border-border"
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                      />
                      <Label className="text-foreground">Ativo</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={formData.is_default}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                      />
                      <Label className="text-foreground">Usar como padrão</Label>
                    </div>
                  </div>
                </>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                Cancelar
              </Button>
              <Button onClick={handleSave} className="bg-primary hover:bg-primary/90" disabled={!formData.provider}>
                {editingConfig ? 'Salvar Alterações' : 'Adicionar ESP'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {configurations.length === 0 ? (
        <Card className="bg-card border-border border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Server className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum ESP configurado</h3>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              Configure provedores externos de e-mail para melhorar a taxa de entrega e escalar suas campanhas.
            </p>
            <Button onClick={() => setIsDialogOpen(true)} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar primeiro ESP
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {configurations.map((config, index) => {
            const provider = ESP_PROVIDERS.find(p => p.id === config.provider);
            return (
              <motion.div
                key={config.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-card border-border hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{provider?.icon || '📧'}</span>
                        <div>
                          <CardTitle className="text-lg text-foreground">{config.name}</CardTitle>
                          <CardDescription className="text-muted-foreground">
                            {provider?.name || config.provider}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {config.is_default && (
                          <Badge className="bg-primary/20 text-primary border-primary/30">Padrão</Badge>
                        )}
                        <Badge variant={config.is_active ? 'default' : 'secondary'}>
                          {config.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleTest(config)}
                              disabled={testingId === config.id}
                            >
                              <TestTube className={`w-4 h-4 ${testingId === config.id ? 'animate-spin' : ''}`} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Testar conexão</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(config)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDelete(config.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ESP Provider Guide */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Guia de Provedores
          </CardTitle>
          <CardDescription>
            Escolha o ESP ideal para suas necessidades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ESP_PROVIDERS.map((provider) => (
              <div key={provider.id} className="p-4 rounded-lg bg-muted/30 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{provider.icon}</span>
                  <h4 className="font-semibold text-foreground">{provider.name}</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{provider.description}</p>
                {provider.docs && (
                  <a 
                    href={provider.docs}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Ver documentação <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ESPManager;
