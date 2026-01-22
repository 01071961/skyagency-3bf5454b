import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Brain, 
  Shield, 
  Award, 
  Clock, 
  RefreshCw, 
  MessageSquare,
  Shuffle,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  Target,
  BarChart3,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';

export interface QuizSettings {
  // Configurações Básicas
  passingScore: number;
  timeLimit: number | null;
  isRequired: boolean;
  showCorrectAnswers: boolean;
  
  // Tentativas
  maxAttempts: number;
  cooldownMinutes: number;
  allowRetake: boolean;
  
  // Anti-Fraude
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  preventCopyPaste: boolean;
  fullscreenRequired: boolean;
  webcamMonitoring: boolean;
  tabSwitchLimit: number;
  
  // Certificação
  certificateRequired: boolean;
  minimumScoreForCertificate: number;
  
  // Feedback
  showScoreImmediately: boolean;
  showDetailedFeedback: boolean;
  showCorrectAfterAttempts: number;
  
  // IA
  aiDifficultyAnalysis: boolean;
  aiQuestionSuggestions: boolean;
  adaptiveDifficulty: boolean;
}

interface QuizSettingsPanelProps {
  settings: QuizSettings;
  onChange: (settings: QuizSettings) => void;
  onGenerateWithAI?: () => void;
  isGenerating?: boolean;
}

const defaultSettings: QuizSettings = {
  passingScore: 70,
  timeLimit: null,
  isRequired: true,
  showCorrectAnswers: true,
  maxAttempts: 3,
  cooldownMinutes: 30,
  allowRetake: true,
  shuffleQuestions: true,
  shuffleOptions: true,
  preventCopyPaste: true,
  fullscreenRequired: false,
  webcamMonitoring: false,
  tabSwitchLimit: 3,
  certificateRequired: true,
  minimumScoreForCertificate: 70,
  showScoreImmediately: true,
  showDetailedFeedback: true,
  showCorrectAfterAttempts: 3,
  aiDifficultyAnalysis: true,
  aiQuestionSuggestions: true,
  adaptiveDifficulty: false,
};

export default function QuizSettingsPanel({ 
  settings = defaultSettings, 
  onChange, 
  onGenerateWithAI,
  isGenerating 
}: QuizSettingsPanelProps) {
  const [activeTab, setActiveTab] = useState('basic');

  const updateSetting = <K extends keyof QuizSettings>(key: K, value: QuizSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <Card className="border-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Configurações do Quiz</CardTitle>
          </div>
          {onGenerateWithAI && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onGenerateWithAI}
              disabled={isGenerating}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {isGenerating ? 'Gerando...' : 'Gerar com IA'}
            </Button>
          )}
        </div>
        <CardDescription>
          Configure regras, anti-fraude e certificação
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="basic" className="text-xs">
              <Target className="w-3 h-3 mr-1" />
              Básico
            </TabsTrigger>
            <TabsTrigger value="attempts" className="text-xs">
              <RefreshCw className="w-3 h-3 mr-1" />
              Tentativas
            </TabsTrigger>
            <TabsTrigger value="security" className="text-xs">
              <Shield className="w-3 h-3 mr-1" />
              Segurança
            </TabsTrigger>
            <TabsTrigger value="certification" className="text-xs">
              <Award className="w-3 h-3 mr-1" />
              Certificação
            </TabsTrigger>
            <TabsTrigger value="ai" className="text-xs">
              <Brain className="w-3 h-3 mr-1" />
              IA
            </TabsTrigger>
          </TabsList>

          {/* Tab: Configurações Básicas */}
          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Nota Mínima para Aprovação
                </Label>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[settings.passingScore]}
                    onValueChange={([value]) => updateSetting('passingScore', value)}
                    min={50}
                    max={100}
                    step={5}
                    className="flex-1"
                  />
                  <Badge variant="outline" className="w-16 justify-center">
                    {settings.passingScore}%
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Limite de Tempo (minutos)
                </Label>
                <Input
                  type="number"
                  value={settings.timeLimit || ''}
                  onChange={(e) => updateSetting('timeLimit', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="Sem limite"
                  min={1}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Quiz Obrigatório</Label>
                  <p className="text-xs text-muted-foreground">
                    Bloqueia próximas aulas até aprovação
                  </p>
                </div>
                <Switch
                  checked={settings.isRequired}
                  onCheckedChange={(checked) => updateSetting('isRequired', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Mostrar Respostas Corretas</Label>
                  <p className="text-xs text-muted-foreground">
                    Após finalizar, exibe gabarito
                  </p>
                </div>
                <Switch
                  checked={settings.showCorrectAnswers}
                  onCheckedChange={(checked) => updateSetting('showCorrectAnswers', checked)}
                />
              </div>
            </div>
          </TabsContent>

          {/* Tab: Tentativas */}
          <TabsContent value="attempts" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Máximo de Tentativas</Label>
                <Input
                  type="number"
                  value={settings.maxAttempts}
                  onChange={(e) => updateSetting('maxAttempts', parseInt(e.target.value) || 1)}
                  min={1}
                  max={99}
                />
                <p className="text-xs text-muted-foreground">
                  0 = ilimitado
                </p>
              </div>

              <div className="space-y-2">
                <Label>Intervalo entre Tentativas (min)</Label>
                <Input
                  type="number"
                  value={settings.cooldownMinutes}
                  onChange={(e) => updateSetting('cooldownMinutes', parseInt(e.target.value) || 0)}
                  min={0}
                />
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label>Permitir Refazer</Label>
                <p className="text-xs text-muted-foreground">
                  Permite refazer mesmo após aprovação
                </p>
              </div>
              <Switch
                checked={settings.allowRetake}
                onCheckedChange={(checked) => updateSetting('allowRetake', checked)}
              />
            </div>

            <div className="space-y-2">
              <Label>Mostrar Corretas Após X Tentativas</Label>
              <Input
                type="number"
                value={settings.showCorrectAfterAttempts}
                onChange={(e) => updateSetting('showCorrectAfterAttempts', parseInt(e.target.value) || 0)}
                min={0}
              />
              <p className="text-xs text-muted-foreground">
                0 = sempre mostrar, outro número = só após X tentativas
              </p>
            </div>
          </TabsContent>

          {/* Tab: Segurança Anti-Fraude */}
          <TabsContent value="security" className="space-y-4">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-4">
              <div className="flex items-center gap-2 text-amber-600 text-sm font-medium">
                <Shield className="w-4 h-4" />
                Sistema Anti-Fraude
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Ative recursos para garantir integridade das provas
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shuffle className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <Label>Embaralhar Perguntas</Label>
                    <p className="text-xs text-muted-foreground">
                      Ordem aleatória das questões
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.shuffleQuestions}
                  onCheckedChange={(checked) => updateSetting('shuffleQuestions', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shuffle className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <Label>Embaralhar Alternativas</Label>
                    <p className="text-xs text-muted-foreground">
                      Ordem aleatória das opções
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.shuffleOptions}
                  onCheckedChange={(checked) => updateSetting('shuffleOptions', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <Label>Bloquear Copiar/Colar</Label>
                    <p className="text-xs text-muted-foreground">
                      Impede cópia de texto
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.preventCopyPaste}
                  onCheckedChange={(checked) => updateSetting('preventCopyPaste', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <Label>Modo Tela Cheia</Label>
                    <p className="text-xs text-muted-foreground">
                      Exige tela cheia durante prova
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.fullscreenRequired}
                  onCheckedChange={(checked) => updateSetting('fullscreenRequired', checked)}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Limite de Troca de Aba
                </Label>
                <Input
                  type="number"
                  value={settings.tabSwitchLimit}
                  onChange={(e) => updateSetting('tabSwitchLimit', parseInt(e.target.value) || 0)}
                  min={0}
                  max={10}
                />
                <p className="text-xs text-muted-foreground">
                  Prova cancelada após X trocas de aba (0 = desativado)
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Tab: Certificação */}
          <TabsContent value="certification" className="space-y-4">
            <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg mb-4">
              <div className="flex items-center gap-2 text-primary text-sm font-medium">
                <Award className="w-4 h-4" />
                Integração com Certificados
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Este quiz está vinculado ao sistema de certificação
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Obrigatório para Certificado</Label>
                <p className="text-xs text-muted-foreground">
                  Aluno deve passar neste quiz para certificação
                </p>
              </div>
              <Switch
                checked={settings.certificateRequired}
                onCheckedChange={(checked) => updateSetting('certificateRequired', checked)}
              />
            </div>

            <div className="space-y-2">
              <Label>Nota Mínima para Certificado</Label>
              <div className="flex items-center gap-2">
                <Slider
                  value={[settings.minimumScoreForCertificate]}
                  onValueChange={([value]) => updateSetting('minimumScoreForCertificate', value)}
                  min={50}
                  max={100}
                  step={5}
                  className="flex-1"
                />
                <Badge variant="outline" className="w-16 justify-center">
                  {settings.minimumScoreForCertificate}%
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                <CheckCircle className="w-4 h-4" />
                Fluxo de Certificação
              </div>
              <ol className="text-xs text-muted-foreground mt-2 space-y-1">
                <li>1. Aluno conclui 100% das aulas</li>
                <li>2. Aluno passa nos quizzes obrigatórios com nota ≥ {settings.minimumScoreForCertificate}%</li>
                <li>3. Sistema libera geração do certificado</li>
                <li>4. Certificado com código de verificação único</li>
              </ol>
            </div>
          </TabsContent>

          {/* Tab: IA */}
          <TabsContent value="ai" className="space-y-4">
            <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg mb-4">
              <div className="flex items-center gap-2 text-purple-600 text-sm font-medium">
                <Brain className="w-4 h-4" />
                Recursos de Inteligência Artificial
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Use IA para otimizar e criar questões
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <Label>Análise de Dificuldade</Label>
                    <p className="text-xs text-muted-foreground">
                      IA analisa nível de cada questão
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.aiDifficultyAnalysis}
                  onCheckedChange={(checked) => updateSetting('aiDifficultyAnalysis', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <Label>Sugestões de Questões</Label>
                    <p className="text-xs text-muted-foreground">
                      IA sugere novas perguntas baseadas no conteúdo
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.aiQuestionSuggestions}
                  onCheckedChange={(checked) => updateSetting('aiQuestionSuggestions', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <Label>Dificuldade Adaptativa</Label>
                    <p className="text-xs text-muted-foreground">
                      Ajusta dificuldade baseado no desempenho
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.adaptiveDifficulty}
                  onCheckedChange={(checked) => updateSetting('adaptiveDifficulty', checked)}
                />
              </div>
            </div>

            <Separator />

            {onGenerateWithAI && (
              <Button 
                className="w-full" 
                onClick={onGenerateWithAI}
                disabled={isGenerating}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {isGenerating ? 'Gerando Questões com IA...' : 'Gerar Questões com IA'}
              </Button>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export { defaultSettings as defaultQuizSettings };
