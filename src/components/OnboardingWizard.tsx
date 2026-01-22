import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Building, Target, Link, Check, ChevronRight, ChevronLeft,
  Rocket, Trophy, Users, DollarSign, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const STEPS: OnboardingStep[] = [
  {
    id: 1,
    title: 'Bem-vindo!',
    description: 'Vamos configurar sua conta em poucos passos',
    icon: <Rocket className="h-8 w-8" />
  },
  {
    id: 2,
    title: 'Seu Perfil',
    description: 'Conte-nos um pouco sobre você',
    icon: <User className="h-8 w-8" />
  },
  {
    id: 3,
    title: 'Seu Objetivo',
    description: 'Como você quer usar a plataforma?',
    icon: <Target className="h-8 w-8" />
  },
  {
    id: 4,
    title: 'Configurações',
    description: 'Personalize sua experiência',
    icon: <Sparkles className="h-8 w-8" />
  },
  {
    id: 5,
    title: 'Pronto!',
    description: 'Sua conta está configurada',
    icon: <Check className="h-8 w-8" />
  }
];

interface OnboardingData {
  name: string;
  company: string;
  role: string;
  objective: 'affiliate' | 'agency' | 'customer';
  experience: string;
  platforms: string[];
  goals: string;
}

export const OnboardingWizard = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    name: '',
    company: '',
    role: '',
    objective: 'affiliate',
    experience: 'beginner',
    platforms: [],
    goals: ''
  });

  useEffect(() => {
    checkOnboardingStatus();
  }, [user?.id]);

  const checkOnboardingStatus = async () => {
    if (!user?.id) return;

    try {
      const { data: progress } = await supabase
        .from('onboarding_progress')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!progress) {
        setIsOpen(true);
        // Create initial onboarding record
        await supabase.from('onboarding_progress').insert({
          user_id: user.id,
          current_step: 1,
          completed_steps: []
        });
      } else if (!progress.is_completed) {
        setIsOpen(true);
        setCurrentStep(progress.current_step || 1);
        if (progress.data) {
          setData(prev => ({ ...prev, ...(progress.data as Partial<OnboardingData>) }));
        }
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
  };

  const updateProgress = async (step: number, completed: boolean = false) => {
    if (!user?.id) return;

    try {
      await supabase
        .from('onboarding_progress')
        .update({
          current_step: step,
          completed_steps: completed ? STEPS.map(s => s.id) : STEPS.filter(s => s.id < step).map(s => s.id),
          is_completed: completed,
          completed_at: completed ? new Date().toISOString() : null,
          data: JSON.parse(JSON.stringify(data)) as Json
        })
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Error updating onboarding progress:', error);
    }
  };

  const handleNext = async () => {
    if (currentStep < STEPS.length) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      await updateProgress(nextStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      await updateProgress(STEPS.length, true);
      
      // Update user profile with collected data
      await supabase
        .from('profiles')
        .update({ name: data.name })
        .eq('user_id', user?.id);

      toast.success('Onboarding completo! Bem-vindo à SKY BRASIL!');
      setIsOpen(false);
    } catch (error) {
      toast.error('Erro ao completar onboarding');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    await updateProgress(STEPS.length, true);
    setIsOpen(false);
  };

  const progress = (currentStep / STEPS.length) * 100;

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="text-center space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center"
            >
              <Rocket className="h-12 w-12 text-white" />
            </motion.div>
            <div>
              <h3 className="text-2xl font-bold">Bem-vindo à SKY BRASIL!</h3>
              <p className="text-muted-foreground mt-2">
                Estamos empolgados em ter você aqui. Vamos configurar sua conta para que você 
                aproveite ao máximo nossa plataforma.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <Trophy className="h-6 w-6 mx-auto text-yellow-500" />
                <p className="text-sm font-medium mt-2">Ganhe Comissões</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <Users className="h-6 w-6 mx-auto text-blue-500" />
                <p className="text-sm font-medium mt-2">Indique Amigos</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <DollarSign className="h-6 w-6 mx-auto text-green-500" />
                <p className="text-sm font-medium mt-2">Receba em PIX</p>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                value={data.name}
                onChange={(e) => setData({ ...data, name: e.target.value })}
                placeholder="Seu nome completo"
              />
            </div>
            <div>
              <Label htmlFor="company">Empresa/Canal (opcional)</Label>
              <Input
                id="company"
                value={data.company}
                onChange={(e) => setData({ ...data, company: e.target.value })}
                placeholder="Nome da sua empresa ou canal"
              />
            </div>
            <div>
              <Label htmlFor="role">Sua Função</Label>
              <Input
                id="role"
                value={data.role}
                onChange={(e) => setData({ ...data, role: e.target.value })}
                placeholder="Ex: Streamer, Influenciador, Marketing"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <RadioGroup
              value={data.objective}
              onValueChange={(value) => setData({ ...data, objective: value as OnboardingData['objective'] })}
              className="space-y-4"
            >
              <div className="flex items-center space-x-4 p-4 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="affiliate" id="affiliate" />
                <Label htmlFor="affiliate" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Link className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Quero ser Afiliado</p>
                      <p className="text-sm text-muted-foreground">Ganhar comissões indicando produtos</p>
                    </div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-4 p-4 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="agency" id="agency" />
                <Label htmlFor="agency" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Building className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Sou uma Agência</p>
                      <p className="text-sm text-muted-foreground">Gerenciar múltiplos afiliados</p>
                    </div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-4 p-4 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="customer" id="customer" />
                <Label htmlFor="customer" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Quero Comprar</p>
                      <p className="text-sm text-muted-foreground">Acessar cursos e produtos</p>
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div>
              <Label>Nível de Experiência</Label>
              <RadioGroup
                value={data.experience}
                onValueChange={(value) => setData({ ...data, experience: value })}
                className="grid grid-cols-3 gap-2 mt-2"
              >
                <div className="flex items-center space-x-2 p-3 rounded-lg border cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value="beginner" id="beginner" />
                  <Label htmlFor="beginner" className="cursor-pointer text-sm">Iniciante</Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value="intermediate" id="intermediate" />
                  <Label htmlFor="intermediate" className="cursor-pointer text-sm">Intermediário</Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value="advanced" id="advanced" />
                  <Label htmlFor="advanced" className="cursor-pointer text-sm">Avançado</Label>
                </div>
              </RadioGroup>
            </div>
            <div>
              <Label htmlFor="goals">Seus Objetivos</Label>
              <Textarea
                id="goals"
                value={data.goals}
                onChange={(e) => setData({ ...data, goals: e.target.value })}
                placeholder="O que você espera alcançar com a SKY BRASIL?"
                rows={3}
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="text-center space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center"
            >
              <Check className="h-12 w-12 text-white" />
            </motion.div>
            <div>
              <h3 className="text-2xl font-bold">Tudo Pronto!</h3>
              <p className="text-muted-foreground mt-2">
                Sua conta está configurada e você já pode começar a usar a plataforma.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-left">
              <h4 className="font-medium mb-2">Próximos Passos:</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Explore o Dashboard VIP
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Copie seu link de afiliado
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Comece a indicar e ganhar
                </li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        <div className="p-6">
          {/* Progress indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Passo {currentStep} de {STEPS.length}
              </span>
              <Button variant="ghost" size="sm" onClick={handleSkip}>
                Pular
              </Button>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step indicators */}
          <div className="flex justify-center gap-2 mb-6">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`h-2 w-2 rounded-full transition-all ${
                  step.id === currentStep
                    ? 'bg-primary w-6'
                    : step.id < currentStep
                    ? 'bg-primary'
                    : 'bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Step content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between mt-6 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Voltar
            </Button>
            
            {currentStep === STEPS.length ? (
              <Button onClick={handleComplete} disabled={isLoading}>
                {isLoading ? 'Finalizando...' : 'Começar'}
                <Sparkles className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleNext}>
                Próximo
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
