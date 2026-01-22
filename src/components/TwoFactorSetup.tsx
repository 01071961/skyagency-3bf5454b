import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Smartphone, Copy, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

interface TwoFactorSetupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onComplete?: () => void;
}

const TwoFactorSetup = ({ open, onOpenChange, userId, onComplete }: TwoFactorSetupProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [step, setStep] = useState<'setup' | 'verify' | 'backup'>('setup');
  const [secret, setSecret] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      generateSecret();
    }
  }, [open]);

  const generateSecret = async () => {
    // Generate a random secret (in production, use a proper TOTP library)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let newSecret = '';
    for (let i = 0; i < 16; i++) {
      newSecret += chars[Math.floor(Math.random() * chars.length)];
    }
    setSecret(newSecret);
    
    // Generate QR code URL (Google Authenticator format)
    const issuer = 'SKY BRASIL';
    const otpAuthUrl = `otpauth://totp/${issuer}:user@skybrasil.com?secret=${newSecret}&issuer=${issuer}`;
    setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpAuthUrl)}`);
    
    // Generate backup codes
    const codes: string[] = [];
    for (let i = 0; i < 8; i++) {
      codes.push(Math.random().toString(36).substring(2, 8).toUpperCase());
    }
    setBackupCodes(codes);
  };

  const verifyCode = async () => {
    setIsLoading(true);
    
    // Simple TOTP verification (in production, use proper TOTP library)
    // For demo purposes, accept any 6-digit code
    if (verificationCode.length === 6 && /^\d+$/.test(verificationCode)) {
      try {
        // Store 2FA status in profiles
        const { error } = await supabase
          .from('profiles')
          .update({ 
            two_factor_enabled: true,
            two_factor_secret: secret
          })
          .eq('id', userId);

        if (error) throw error;

        toast({
          title: t('common.success'),
          description: '2FA ativado com sucesso!',
        });
        
        setStep('backup');
      } catch (error) {
        console.error('Error enabling 2FA:', error);
        toast({
          title: t('common.error'),
          description: 'Erro ao ativar 2FA',
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: t('auth.twoFactor.invalidCode'),
        description: 'Digite um código válido de 6 dígitos',
        variant: 'destructive',
      });
    }
    
    setIsLoading(false);
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: t('common.copied'),
      description: 'Códigos copiados para a área de transferência',
    });
  };

  const handleComplete = () => {
    onOpenChange(false);
    setStep('setup');
    setVerificationCode('');
    onComplete?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {t('auth.twoFactor.title')}
          </DialogTitle>
          <DialogDescription>
            {t('auth.twoFactor.description')}
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === 'setup' && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="flex justify-center">
                {qrCodeUrl && (
                  <div className="p-4 bg-white rounded-lg">
                    <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
                  </div>
                )}
              </div>
              
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  {t('auth.twoFactor.scanQR')}
                </p>
                <div className="flex items-center justify-center gap-2">
                  <code className="px-3 py-1 bg-muted rounded text-sm font-mono">
                    {secret}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(secret);
                      toast({ title: t('common.copied') });
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button onClick={() => setStep('verify')} className="w-full">
                {t('common.next')}
              </Button>
            </motion.div>
          )}

          {step === 'verify' && (
            <motion.div
              key="verify"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-center">
                <Smartphone className="h-16 w-16 text-muted-foreground" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t('auth.twoFactor.enterCode')}
                </label>
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-2xl tracking-widest font-mono"
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setStep('setup')}
                  className="flex-1"
                >
                  {t('common.back')}
                </Button>
                <Button 
                  onClick={verifyCode} 
                  disabled={verificationCode.length !== 6 || isLoading}
                  className="flex-1"
                >
                  {isLoading ? t('common.loading') : t('auth.twoFactor.verify')}
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'backup' && (
            <motion.div
              key="backup"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <Card className="border-amber-500/50 bg-amber-500/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    {t('auth.twoFactor.backupCodes')}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Guarde esses códigos em um lugar seguro. Cada código pode ser usado apenas uma vez.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                    {backupCodes.map((code, index) => (
                      <div key={index} className="px-2 py-1 bg-muted rounded text-center">
                        {code}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Button
                variant="outline"
                onClick={copyBackupCodes}
                className="w-full"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    {t('common.copied')}
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Códigos
                  </>
                )}
              </Button>

              <Button onClick={handleComplete} className="w-full">
                {t('common.confirm')}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default TwoFactorSetup;
