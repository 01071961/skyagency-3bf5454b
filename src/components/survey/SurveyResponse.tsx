import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Star, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SurveyQuestion {
  id: string;
  type: 'text' | 'single' | 'multiple' | 'rating' | 'nps';
  question: string;
  options?: string[];
  required: boolean;
}

interface SurveyResponseProps {
  title: string;
  description?: string;
  questions: SurveyQuestion[];
  showProgressBar?: boolean;
  onSubmit?: (responses: Record<string, any>) => void;
}

export const SurveyResponse = ({
  title,
  description,
  questions,
  showProgressBar = true,
  onSubmit
}: SurveyResponseProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [isCompleted, setIsCompleted] = useState(false);

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const question = questions[currentQuestion];

  const handleResponse = (questionId: string, value: any) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      setIsCompleted(true);
      onSubmit?.(responses);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const canProceed = () => {
    if (!question.required) return true;
    const response = responses[question.id];
    if (question.type === 'multiple') {
      return response && response.length > 0;
    }
    return response !== undefined && response !== '';
  };

  if (isCompleted) {
    return (
      <Card className="max-w-xl mx-auto">
        <CardContent className="pt-6 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Obrigado!</h2>
          <p className="text-muted-foreground">
            Sua resposta foi enviada com sucesso.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
        {showProgressBar && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Pergunta {currentQuestion + 1} de {questions.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        <div>
          <Label className="text-lg font-medium">
            {question.question}
            {question.required && <span className="text-destructive ml-1">*</span>}
          </Label>
        </div>

        {/* Text Response */}
        {question.type === 'text' && (
          <Textarea
            placeholder="Digite sua resposta..."
            value={responses[question.id] || ''}
            onChange={(e) => handleResponse(question.id, e.target.value)}
            rows={4}
          />
        )}

        {/* Single Choice */}
        {question.type === 'single' && question.options && (
          <RadioGroup
            value={responses[question.id] || ''}
            onValueChange={(value) => handleResponse(question.id, value)}
          >
            {question.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${question.id}-${index}`} />
                <Label htmlFor={`${question.id}-${index}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        )}

        {/* Multiple Choice */}
        {question.type === 'multiple' && question.options && (
          <div className="space-y-2">
            {question.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`${question.id}-${index}`}
                  checked={(responses[question.id] || []).includes(option)}
                  onCheckedChange={(checked) => {
                    const current = responses[question.id] || [];
                    if (checked) {
                      handleResponse(question.id, [...current, option]);
                    } else {
                      handleResponse(question.id, current.filter((o: string) => o !== option));
                    }
                  }}
                />
                <Label htmlFor={`${question.id}-${index}`}>{option}</Label>
              </div>
            ))}
          </div>
        )}

        {/* Rating */}
        {question.type === 'rating' && (
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Button
                key={star}
                variant="ghost"
                size="lg"
                className="p-2"
                onClick={() => handleResponse(question.id, star)}
              >
                <Star
                  className={cn(
                    "h-8 w-8 transition-colors",
                    responses[question.id] >= star
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground"
                  )}
                />
              </Button>
            ))}
          </div>
        )}

        {/* NPS */}
        {question.type === 'nps' && (
          <div>
            <div className="flex gap-1 flex-wrap">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <Button
                  key={num}
                  variant={responses[question.id] === num ? "default" : "outline"}
                  size="sm"
                  className="w-10 h-10"
                  onClick={() => handleResponse(question.id, num)}
                >
                  {num}
                </Button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>Nada provável</span>
              <span>Muito provável</span>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
        >
          Anterior
        </Button>
        <Button
          onClick={handleNext}
          disabled={!canProceed()}
        >
          {currentQuestion === questions.length - 1 ? 'Enviar' : 'Próxima'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SurveyResponse;
