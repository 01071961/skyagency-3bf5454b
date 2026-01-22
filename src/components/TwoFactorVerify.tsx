import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

interface TwoFactorVerifyProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerify: (code: string) => Promise<boolean>;
  onCancel?: () => void;
}

const TwoFactorVerify = ({ open, onOpenChange, onVerify, onCancel }: TwoFactorVerifyProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleVerify = async () => {
    if (code.length !== 6) return;
    
    setIsLoading(true);
    setError(false);
    
    try {
      const success = await onVerify(code);
      
      if (success) {
        onOpenChange(false);
        setCode('');
      } else {
        setError(true);
        toast({
          title: t('auth.twoFactor.invalidCode'),
          description: 'O código inserido está incorreto',
          variant: 'destructive',
        });
      }
    } catch (err) {
      setError(true);
      toast({
        title: t('common.error'),
        description: 'Erro ao verificar código',
        variant: 'destructive',
      });
    }
    
    setIsLoading(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
    setCode('');
    setError(false);
    onCancel?.();
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

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-primary/10">
              <Shield className="h-12 w-12 text-primary" />
            </div>
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
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, ''));
                setError(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && code.length === 6) {
                  handleVerify();
                }
              }}
              className={`text-center text-2xl tracking-widest font-mono ${
                error ? 'border-destructive focus-visible:ring-destructive' : ''
              }`}
              autoFocus
            />
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              className="flex-1"
            >
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={handleVerify} 
              disabled={code.length !== 6 || isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                t('auth.twoFactor.verify')
              )}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Não consegue acessar seu autenticador?{' '}
            <button className="text-primary hover:underline">
              Use um código de backup
            </button>
          </p>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default TwoFactorVerify;
