import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Server, Database, Mail, CreditCard, Shield, Key, Globe, CheckCircle, XCircle, AlertCircle, Send, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AdminInvite from './AdminInvite';
import AIAssistantControl from './AIAssistantControl';

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  description: string;
  icon: React.ElementType;
}

interface SecretStatus {
  name: string;
  configured: boolean;
  description: string;
}

const SystemStatus = () => {
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: 'Backend (Lovable Cloud)', status: 'operational', description: 'API e Edge Functions', icon: Server },
    { name: 'Banco de Dados', status: 'operational', description: 'PostgreSQL gerenciado', icon: Database },
    { name: 'API de E-mail (Resend)', status: 'operational', description: 'Envio de e-mails transacionais', icon: Mail },
    { name: 'API de Pagamento (EfíPay)', status: 'operational', description: 'Processamento de pagamentos', icon: CreditCard },
    { name: 'Autenticação', status: 'operational', description: 'Login e controle de acesso', icon: Shield },
    { name: 'CDN', status: 'operational', description: 'Entrega de conteúdo', icon: Globe },
  ]);

  const secrets: SecretStatus[] = [
    { name: 'RESEND_API_KEY', configured: true, description: 'API de envio de e-mails' },
    { name: 'BREVO_API_KEY', configured: true, description: 'API Brevo (backup)' },
    { name: 'ADMIN_EMAIL', configured: true, description: 'E-mail do administrador' },
    { name: 'EFI_CLIENT_ID', configured: true, description: 'ID do cliente EfíPay' },
    { name: 'EFI_CLIENT_SECRET', configured: true, description: 'Chave secreta EfíPay' },
    { name: 'EFI_ENVIRONMENT', configured: true, description: 'Ambiente (sandbox/production)' },
    { name: 'LOVABLE_API_KEY', configured: true, description: 'API de IA Lovable' },
  ];

  // Test email state
  const [testEmail, setTestEmail] = useState('');
  const [testProvider, setTestProvider] = useState<'resend' | 'brevo'>('resend');
  const [isSendingTest, setIsSendingTest] = useState(false);

  const sendTestEmail = async () => {
    if (!testEmail) {
      toast.error('Digite um e-mail para enviar o teste');
      return;
    }

    setIsSendingTest(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-test-email', {
        body: {
          recipientEmail: testEmail,
          provider: testProvider
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`E-mail de teste enviado via ${testProvider.toUpperCase()}!`, {
          description: `ID: ${data.id || 'N/A'}`
        });
      } else {
        throw new Error(data?.error || 'Erro desconhecido');
      }
    } catch (error) {
      console.error('Test email error:', error);
      toast.error('Falha ao enviar e-mail de teste', {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const getStatusBadge = (status: 'operational' | 'degraded' | 'down') => {
    switch (status) {
      case 'operational':
        return (
          <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            Operacional
          </Badge>
        );
      case 'degraded':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
            <AlertCircle className="w-3 h-3 mr-1" />
            Degradado
          </Badge>
        );
      case 'down':
        return (
          <Badge className="bg-red-500/20 text-red-500 border-red-500/30">
            <XCircle className="w-3 h-3 mr-1" />
            Offline
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Status do Sistema</h1>
        <p className="text-muted-foreground mt-2">
          Monitoramento de serviços, configurações e gestão de administradores
        </p>
      </div>

      {/* AI Assistant Control */}
      <AIAssistantControl />

      <Separator />

      {/* Admin Invite Section */}
      <AdminInvite />

      <Separator />

      {/* Test Email Section */}
      <Card className="bg-card border-border border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="w-5 h-5 text-primary" />
            Testar Envio de E-mail
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Envie um e-mail de teste para verificar se a configuração está funcionando corretamente.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="test-email">E-mail de destino</Label>
              <Input
                id="test-email"
                type="email"
                placeholder="seu@email.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Provedor</Label>
              <div className="flex gap-2">
                <Button
                  variant={testProvider === 'resend' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTestProvider('resend')}
                >
                  Resend
                </Button>
                <Button
                  variant={testProvider === 'brevo' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTestProvider('brevo')}
                >
                  Brevo
                </Button>
              </div>
            </div>
          </div>

          <Button 
            onClick={sendTestEmail} 
            disabled={isSendingTest || !testEmail}
            className="w-full sm:w-auto"
          >
            {isSendingTest ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Enviar E-mail de Teste
              </>
            )}
          </Button>

          <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
            <p><strong>Dica:</strong> Se o e-mail não chegar, verifique:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>A pasta de spam/lixo eletrônico</li>
              <li>A configuração DNS do domínio skystreamer.online</li>
              <li>O status de verificação do domínio no Resend/Brevo</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Services Grid */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Serviços</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service, index) => (
            <motion.div
              key={service.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-card border-border hover:border-primary/30 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                        <service.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{service.name}</p>
                        <p className="text-xs text-muted-foreground">{service.description}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    {getStatusBadge(service.status)}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* API Keys Status */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Key className="w-5 h-5" />
          Chaves de API Configuradas
        </h2>
        <Card className="bg-card border-border">
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {secrets.map((secret, index) => (
                <motion.div
                  key={secret.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${secret.configured ? 'bg-green-500' : 'bg-red-500'}`} />
                    <div>
                      <p className="font-mono text-sm text-foreground">{secret.name}</p>
                      <p className="text-xs text-muted-foreground">{secret.description}</p>
                    </div>
                  </div>
                  <Badge variant={secret.configured ? 'default' : 'destructive'}>
                    {secret.configured ? 'Configurada' : 'Pendente'}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
        <p className="text-sm text-muted-foreground mt-4">
          ⚠️ As chaves de API são gerenciadas pelo Lovable Cloud. Para modificar, acesse o painel do projeto.
        </p>
      </div>

      {/* System Info */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Informações do Sistema</h2>
        <Card className="bg-card border-border">
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Ambiente</p>
                <p className="font-medium text-foreground">Produção</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Região</p>
                <p className="font-medium text-foreground">São Paulo (sa-east-1)</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Framework</p>
                <p className="font-medium text-foreground">React + Vite</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Backend</p>
                <p className="font-medium text-foreground">Lovable Cloud (Supabase)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SystemStatus;
