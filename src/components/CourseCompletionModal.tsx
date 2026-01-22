import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Award, Sparkles, Download, PartyPopper } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';

interface CourseCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseName: string;
  productId: string;
  userName?: string;
}

export function CourseCompletionModal({ 
  isOpen, 
  onClose, 
  courseName, 
  productId,
  userName = ''
}: CourseCompletionModalProps) {
  const navigate = useNavigate();
  const [name, setName] = useState(userName);
  const [step, setStep] = useState<'congrats' | 'form'>('congrats');

  const triggerConfetti = () => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 }
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    });
    fire(0.2, {
      spread: 60,
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  };

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setTimeout(triggerConfetti, 300);
    }
    if (!open) {
      onClose();
    }
  };

  const handleGenerateCertificate = () => {
    // Salvar nome se necessário
    if (name.trim()) {
      localStorage.setItem('certificate_name', name.trim());
    }
    navigate(`/members/certificate/${productId}`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md overflow-hidden">
        <AnimatePresence mode="wait">
          {step === 'congrats' ? (
            <motion.div
              key="congrats"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center py-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg"
              >
                <PartyPopper className="w-12 h-12 text-white" />
              </motion.div>
              
              <DialogHeader className="text-center space-y-2">
                <DialogTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                  <Sparkles className="w-6 h-6 text-yellow-500" />
                  Parabéns!
                  <Sparkles className="w-6 h-6 text-yellow-500" />
                </DialogTitle>
                <DialogDescription className="text-base">
                  Você concluiu o curso
                </DialogDescription>
              </DialogHeader>
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h3 className="text-xl font-semibold text-primary mt-4 mb-2">
                  {courseName}
                </h3>
                <p className="text-muted-foreground mb-6">
                  Sua dedicação é inspiradora! Agora você pode gerar seu certificado digital.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-col gap-3"
              >
                <Button 
                  onClick={() => setStep('form')} 
                  size="lg" 
                  className="w-full gap-2 bg-gradient-to-r from-primary to-primary/80"
                >
                  <Award className="w-5 h-5" />
                  Gerar Certificado
                </Button>
                <Button variant="outline" onClick={onClose} size="sm">
                  Fazer depois
                </Button>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="py-4"
            >
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  Informações do Certificado
                </DialogTitle>
                <DialogDescription>
                  Confirme as informações que aparecerão no seu certificado
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 mt-6">
                <div>
                  <Label htmlFor="name">Nome completo</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Digite seu nome completo"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Este nome aparecerá no seu certificado
                  </p>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-medium">Curso:</p>
                  <p className="text-sm text-muted-foreground">{courseName}</p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={() => setStep('congrats')} className="flex-1">
                  Voltar
                </Button>
                <Button 
                  onClick={handleGenerateCertificate} 
                  disabled={!name.trim()}
                  className="flex-1 gap-2"
                >
                  <Download className="w-4 h-4" />
                  Gerar Certificado
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
