import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Wallet, Save, Key, CheckCircle, AlertTriangle, 
  Building2, CreditCard, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';

interface BankInfo {
  bank_name?: string;
  bank_code?: string;
  agency?: string;
  account?: string;
  account_type?: string;
  holder_name?: string;
  holder_cpf?: string;
}

interface AffiliateData {
  id: string;
  pix_key: string | null;
  bank_info: BankInfo | null;
  stripe_account_id: string | null;
  stripe_account_status: string | null;
}

export default function VIPBankSettings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  
  const [pixKeyType, setPixKeyType] = useState<string>('cpf');
  const [pixKey, setPixKey] = useState('');
  const [bankInfo, setBankInfo] = useState<BankInfo>({
    bank_name: '',
    bank_code: '',
    agency: '',
    account: '',
    account_type: 'checking',
    holder_name: '',
    holder_cpf: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?redirect=/vip/bank-settings');
      return;
    }
    if (user) {
      loadData();
    }
  }, [user, authLoading]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('vip_affiliates')
        .select('id, pix_key, bank_info, stripe_account_id, stripe_account_status')
        .eq('user_id', user?.id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // Not an affiliate
          setAffiliate(null);
        } else {
          throw error;
        }
      } else if (data) {
        setAffiliate(data as unknown as AffiliateData);
        if (data.pix_key) {
          setPixKey(data.pix_key);
          // Try to detect key type
          if (data.pix_key.includes('@')) {
            setPixKeyType('email');
          } else if (data.pix_key.replace(/\D/g, '').length === 11) {
            setPixKeyType('cpf');
          } else if (data.pix_key.replace(/\D/g, '').length === 14) {
            setPixKeyType('cnpj');
          } else if (data.pix_key.replace(/\D/g, '').length === 10 || data.pix_key.replace(/\D/g, '').length === 11) {
            setPixKeyType('phone');
          } else {
            setPixKeyType('random');
          }
        }
        if (data.bank_info && typeof data.bank_info === 'object') {
          setBankInfo({
            ...bankInfo,
            ...(data.bank_info as BankInfo),
          });
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar seus dados bancários.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!affiliate?.id) return;
    
    if (!pixKey.trim()) {
      toast({
        title: 'Chave PIX obrigatória',
        description: 'Informe sua chave PIX para receber pagamentos.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('vip_affiliates')
        .update({
          pix_key: pixKey.trim(),
          bank_info: JSON.parse(JSON.stringify(bankInfo)),
          updated_at: new Date().toISOString(),
        })
        .eq('id', affiliate.id);
      
      if (error) throw error;
      
      toast({
        title: 'Dados salvos!',
        description: 'Suas informações bancárias foram atualizadas.',
      });
      
      loadData();
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Não foi possível salvar os dados.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">Você não é um afiliado</h2>
            <p className="text-muted-foreground mb-4">
              Cadastre-se como afiliado para configurar seus dados de pagamento.
            </p>
            <Button onClick={() => navigate('/vip/affiliate/register')}>
              Tornar-se Afiliado
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Wallet className="h-6 w-6 text-primary" />
          Dados Bancários
        </h1>
        <p className="text-muted-foreground">
          Configure sua chave PIX para receber suas comissões
        </p>
      </div>

      {/* Status Alert */}
      {affiliate.pix_key ? (
        <Alert className="bg-emerald-500/10 border-emerald-500/30">
          <CheckCircle className="h-4 w-4 text-emerald-500" />
          <AlertDescription className="text-emerald-600">
            Chave PIX configurada! Você está pronto para receber pagamentos.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="bg-amber-500/10 border-amber-500/30">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-600">
            Configure sua chave PIX para poder solicitar saques.
          </AlertDescription>
        </Alert>
      )}

      {/* PIX Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Chave PIX
            {affiliate.pix_key && (
              <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">
                Configurada
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Informe sua chave PIX para receber transferências
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pix-type">Tipo de Chave</Label>
              <Select value={pixKeyType} onValueChange={setPixKeyType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cpf">CPF</SelectItem>
                  <SelectItem value="cnpj">CNPJ</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                  <SelectItem value="phone">Telefone</SelectItem>
                  <SelectItem value="random">Chave Aleatória</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="pix-key">Chave PIX</Label>
              <Input
                id="pix-key"
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                placeholder={
                  pixKeyType === 'cpf' ? '000.000.000-00' :
                  pixKeyType === 'cnpj' ? '00.000.000/0001-00' :
                  pixKeyType === 'email' ? 'seu@email.com' :
                  pixKeyType === 'phone' ? '(00) 00000-0000' :
                  'Chave aleatória'
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bank Account (Optional) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Conta Bancária
            <Badge variant="outline" className="text-xs">Opcional</Badge>
          </CardTitle>
          <CardDescription>
            Informações adicionais para referência (não obrigatório)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bank-name">Nome do Banco</Label>
              <Input
                id="bank-name"
                value={bankInfo.bank_name || ''}
                onChange={(e) => setBankInfo({ ...bankInfo, bank_name: e.target.value })}
                placeholder="Ex: Nubank, Itaú, Bradesco"
              />
            </div>
            <div>
              <Label htmlFor="holder-name">Nome do Titular</Label>
              <Input
                id="holder-name"
                value={bankInfo.holder_name || ''}
                onChange={(e) => setBankInfo({ ...bankInfo, holder_name: e.target.value })}
                placeholder="Nome completo"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="agency">Agência</Label>
              <Input
                id="agency"
                value={bankInfo.agency || ''}
                onChange={(e) => setBankInfo({ ...bankInfo, agency: e.target.value })}
                placeholder="0000"
              />
            </div>
            <div>
              <Label htmlFor="account">Conta</Label>
              <Input
                id="account"
                value={bankInfo.account || ''}
                onChange={(e) => setBankInfo({ ...bankInfo, account: e.target.value })}
                placeholder="00000-0"
              />
            </div>
            <div>
              <Label htmlFor="account-type">Tipo</Label>
              <Select 
                value={bankInfo.account_type || 'checking'} 
                onValueChange={(v) => setBankInfo({ ...bankInfo, account_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">Corrente</SelectItem>
                  <SelectItem value="savings">Poupança</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="holder-cpf">CPF do Titular</Label>
              <Input
                id="holder-cpf"
                value={bankInfo.holder_cpf || ''}
                onChange={(e) => setBankInfo({ ...bankInfo, holder_cpf: e.target.value })}
                placeholder="000.000.000-00"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Button
          onClick={handleSave}
          disabled={isSaving || !pixKey.trim()}
          size="lg"
          className="w-full bg-gradient-to-r from-[#5e3bff] to-[#a855f7] hover:from-[#4c2ed9] hover:to-[#9333ea]"
        >
          {isSaving ? (
            <>
              <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-5 w-5" />
              Salvar Dados Bancários
            </>
          )}
        </Button>
      </motion.div>

      {/* Info */}
      <Card className="bg-muted/30 border-border/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Como funciona o pagamento?</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Quando você atinge o valor mínimo de R$ 50,00, pode solicitar um saque.</li>
                <li>Sua solicitação é enviada para aprovação do administrador.</li>
                <li>Após aprovado, o pagamento é enviado via PIX em até 48h úteis.</li>
                <li>Você recebe notificação quando o pagamento for concluído.</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
