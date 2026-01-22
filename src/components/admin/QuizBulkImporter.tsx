import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Upload, Wand2, Loader2, CheckCircle, AlertCircle, FileText, AlertTriangle, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuizQuestion {
  question: string;
  options: string[];
  correct_index: number;
}

interface ParsedQuestion extends QuizQuestion {
  status: 'ok' | 'no_answer' | 'error';
  errorMessage?: string;
}

interface QuizBulkImporterProps {
  onImport: (questions: QuizQuestion[]) => void;
  existingCount?: number;
}

// Advanced parser for multiple question formats
function parseQuestionsFromText(text: string): ParsedQuestion[] {
  const questions: ParsedQuestion[] = [];
  
  if (!text || text.trim().length === 0) {
    return questions;
  }

  // Normalize line endings and split into blocks
  const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Split into question blocks (double newline or new question number)
  const blocks = splitIntoQuestionBlocks(normalizedText);
  
  for (const block of blocks) {
    const parsed = parseQuestionBlock(block);
    if (parsed) {
      questions.push(parsed);
    }
  }
  
  return questions;
}

function splitIntoQuestionBlocks(text: string): string[] {
  const blocks: string[] = [];
  const lines = text.split('\n');
  let currentBlock: string[] = [];
  
  const questionStartPatterns = [
    /^(?:Questão|Pergunta|Q)\s*(\d+)[:.)\s]/i,
    /^(\d+)[.)\s]+(?![\d])/,
    /^\d+\s*[-–—]\s+/
  ];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check if this line starts a new question
    const isNewQuestion = questionStartPatterns.some(pattern => pattern.test(line));
    
    if (isNewQuestion && currentBlock.length > 0) {
      blocks.push(currentBlock.join('\n'));
      currentBlock = [line];
    } else if (line === '' && currentBlock.length > 0) {
      // Check if next non-empty line is a new question
      let nextNonEmpty = '';
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].trim()) {
          nextNonEmpty = lines[j].trim();
          break;
        }
      }
      
      const nextIsQuestion = questionStartPatterns.some(pattern => pattern.test(nextNonEmpty));
      
      if (nextIsQuestion && currentBlock.length > 2) {
        blocks.push(currentBlock.join('\n'));
        currentBlock = [];
      } else if (currentBlock.length > 0) {
        currentBlock.push(line);
      }
    } else if (line) {
      currentBlock.push(line);
    }
  }
  
  if (currentBlock.length > 0) {
    blocks.push(currentBlock.join('\n'));
  }
  
  return blocks.filter(b => b.trim().length > 0);
}

function parseQuestionBlock(block: string): ParsedQuestion | null {
  const lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  if (lines.length < 2) return null;
  
  // Extract question text
  let questionText = '';
  let optionStartIndex = 0;
  
  // Question patterns
  const questionPatterns = [
    /^(?:Questão|Pergunta|Q)\s*\d*[:.)\s]*(.+)/i,
    /^\d+[.)\s]+(.+)/,
    /^\d+\s*[-–—]\s+(.+)/
  ];
  
  for (const pattern of questionPatterns) {
    const match = lines[0].match(pattern);
    if (match) {
      questionText = match[1].trim();
      break;
    }
  }
  
  // If no pattern matched, use the first line as question
  if (!questionText) {
    questionText = lines[0];
  }
  
  // Check if question continues on next lines (before options start)
  for (let i = 1; i < lines.length; i++) {
    if (isOptionLine(lines[i])) {
      optionStartIndex = i;
      break;
    } else if (!isAnswerLine(lines[i])) {
      questionText += ' ' + lines[i];
    }
  }
  
  if (optionStartIndex === 0) {
    // No options found, try to find them differently
    for (let i = 1; i < lines.length; i++) {
      if (isOptionLine(lines[i])) {
        optionStartIndex = i;
        break;
      }
    }
  }
  
  if (optionStartIndex === 0) return null;
  
  // Parse options
  const options: string[] = [];
  let correctIndex = -1;
  let answerFromLine = -1;
  
  for (let i = optionStartIndex; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for answer line at the end
    const answerMatch = parseAnswerLine(line);
    if (answerMatch !== null) {
      answerFromLine = answerMatch;
      continue;
    }
    
    const optionData = parseOptionLine(line);
    if (optionData) {
      if (optionData.isCorrect && correctIndex === -1) {
        correctIndex = options.length;
      }
      options.push(optionData.text);
    }
  }
  
  // Use answer from line if correct wasn't found in options
  if (correctIndex === -1 && answerFromLine >= 0 && answerFromLine < options.length) {
    correctIndex = answerFromLine;
  }
  
  // Validate we have enough options
  if (options.length < 2) return null;
  
  // Pad options to 4 if needed, or use up to 5
  const finalOptions = options.slice(0, 5);
  while (finalOptions.length < 4) {
    finalOptions.push('');
  }
  
  const status: ParsedQuestion['status'] = correctIndex >= 0 ? 'ok' : 'no_answer';
  
  return {
    question: questionText,
    options: finalOptions,
    correct_index: Math.max(0, correctIndex),
    status,
    errorMessage: status === 'no_answer' ? 'Resposta correta não identificada' : undefined
  };
}

function isOptionLine(line: string): boolean {
  const patterns = [
    /^[a-eA-E][.)\s-]+/,        // A) A. A- A 
    /^[-*•]\s+/,                 // - * •
    /^\([a-eA-E]\)/,             // (A)
    /^[①②③④⑤]/                  // Circled numbers
  ];
  return patterns.some(p => p.test(line));
}

function isAnswerLine(line: string): boolean {
  const patterns = [
    /^(?:Resposta|Gabarito|Correta|Alternativa\s+correta|Letra)[:\s]/i
  ];
  return patterns.some(p => p.test(line));
}

function parseAnswerLine(line: string): number | null {
  const patterns = [
    /^(?:Resposta|Resposta\s+correta|Gabarito|Correta|Alternativa\s+correta|Letra)[:\s]+([a-eA-E1-5])/i
  ];
  
  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (match) {
      const answer = match[1].toUpperCase();
      if (answer >= 'A' && answer <= 'E') {
        return answer.charCodeAt(0) - 'A'.charCodeAt(0);
      } else if (answer >= '1' && answer <= '5') {
        return parseInt(answer) - 1;
      }
    }
  }
  return null;
}

function parseOptionLine(line: string): { text: string; isCorrect: boolean } | null {
  // Correct answer markers
  const correctMarkers = [
    /\(correta\)/gi,
    /\(correto\)/gi,
    /\(certo\)/gi,
    /\(resposta\s*correta\)/gi,
    /\[x\]/gi,
    /\[X\]/g,
    /✅/g,
    /✓/g,
    /^[*]\s*/,
    /\*\*$/,
    /\s*->$/,
    /\(certa\)/gi,
    /\bCORRETA\b/gi,
    /\bcorreta\s*$/i
  ];
  
  // Option prefix patterns
  const optionPatterns = [
    /^([a-eA-E])[.)\s-]+(.+)/,          // A) B. C- D 
    /^\(([a-eA-E])\)\s*(.+)/,            // (A)
    /^[-*•]\s*(.+)/,                      // - * •
    /^[①②③④⑤]\s*(.+)/                    // Circled numbers
  ];
  
  let optionText = line;
  let isCorrect = false;
  
  // Check for correct markers
  for (const marker of correctMarkers) {
    if (marker.test(optionText)) {
      isCorrect = true;
      optionText = optionText.replace(marker, '');
    }
  }
  
  // Extract option text
  for (const pattern of optionPatterns) {
    const match = optionText.match(pattern);
    if (match) {
      optionText = (match[2] || match[1]).trim();
      break;
    }
  }
  
  // Clean up remaining markers
  optionText = optionText
    .replace(/^\*+\s*/, '')
    .replace(/\*+$/, '')
    .replace(/^->?\s*/, '')
    .replace(/->\s*$/, '')
    .trim();
  
  if (!optionText) return null;
  
  return { text: optionText, isCorrect };
}

export default function QuizBulkImporter({ onImport, existingCount = 0 }: QuizBulkImporterProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [preview, setPreview] = useState<ParsedQuestion[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleTextChange = (value: string) => {
    setText(value);
    // Parse and preview in real-time with debounce effect
    const parsed = parseQuestionsFromText(value);
    setPreview(parsed);
  };

  const handleCorrectChange = (questionIndex: number, newCorrectIndex: number) => {
    setPreview(prev => prev.map((q, idx) => {
      if (idx === questionIndex) {
        return {
          ...q,
          correct_index: newCorrectIndex,
          status: 'ok' as const,
          errorMessage: undefined
        };
      }
      return q;
    }));
  };

  const handleImport = () => {
    if (preview.length === 0) {
      toast.error('Nenhuma questão válida encontrada');
      return;
    }
    
    // Validate all questions have at least 2 options
    const validQuestions = preview.filter(q => 
      q.question.length > 0 && 
      q.options.filter(o => o.length > 0).length >= 2
    );
    
    if (validQuestions.length === 0) {
      toast.error('Todas as questões precisam ter pelo menos 2 opções');
      return;
    }
    
    const withoutAnswer = validQuestions.filter(q => q.status === 'no_answer');
    if (withoutAnswer.length > 0) {
      toast.warning(`${withoutAnswer.length} questões sem resposta marcada – verifique antes de continuar`);
    }
    
    // Convert to final format
    const finalQuestions: QuizQuestion[] = validQuestions.map(({ question, options, correct_index }) => ({
      question,
      options,
      correct_index
    }));
    
    onImport(finalQuestions);
    toast.success(`${finalQuestions.length} questões importadas com sucesso!`);
    setOpen(false);
    setText('');
    setPreview([]);
  };

  const okCount = preview.filter(q => q.status === 'ok').length;
  const noAnswerCount = preview.filter(q => q.status === 'no_answer').length;
  const errorCount = preview.filter(q => q.status === 'error').length;

  const exampleText = `1. Qual é a capital do Brasil?
A) São Paulo
B) Rio de Janeiro
C) Brasília (correta)
D) Salvador

Questão 2: O que é um laço for em programação?
a. Uma estrutura condicional
b. Um loop de repetição ✅
c. Uma função
d. Uma variável

Pergunta 3: Qual comando interrompe um loop?
- continue
- pass  
- break *
- return
Resposta correta: C

4) Em Python, range(5) gera:
A - 0,1,2,3,4 (correta)
B - 1,2,3,4,5
C - 0,1,2,3
D - 5,4,3,2,1`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Upload className="w-4 h-4 mr-1" />
          Importar em Massa
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-primary" />
            Importar Questões em Massa
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          <div className="p-4 bg-muted/50 rounded-lg border">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Formatos Aceitos (Muito Flexível!)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div>
                <p className="font-medium text-foreground mb-1">Numeração:</p>
                <ul className="space-y-0.5">
                  <li>• <code className="bg-muted px-1 rounded text-xs">1.</code> <code className="bg-muted px-1 rounded text-xs">1)</code> <code className="bg-muted px-1 rounded text-xs">Q1:</code> <code className="bg-muted px-1 rounded text-xs">Questão 1:</code></li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Alternativas:</p>
                <ul className="space-y-0.5">
                  <li>• <code className="bg-muted px-1 rounded text-xs">A)</code> <code className="bg-muted px-1 rounded text-xs">A.</code> <code className="bg-muted px-1 rounded text-xs">A -</code> <code className="bg-muted px-1 rounded text-xs">a)</code></li>
                  <li>• <code className="bg-muted px-1 rounded text-xs">-</code> <code className="bg-muted px-1 rounded text-xs">*</code> <code className="bg-muted px-1 rounded text-xs">•</code></li>
                </ul>
              </div>
              <div className="md:col-span-2">
                <p className="font-medium text-foreground mb-1">Marcar Correta:</p>
                <ul className="space-y-0.5">
                  <li>• <code className="bg-muted px-1 rounded text-xs">(correta)</code> <code className="bg-muted px-1 rounded text-xs">(certo)</code> <code className="bg-muted px-1 rounded text-xs">*</code> <code className="bg-muted px-1 rounded text-xs">[x]</code> <code className="bg-muted px-1 rounded text-xs">✅</code> <code className="bg-muted px-1 rounded text-xs">✓</code> <code className="bg-muted px-1 rounded text-xs">-&gt;</code></li>
                  <li>• <code className="bg-muted px-1 rounded text-xs">Resposta: C</code> <code className="bg-muted px-1 rounded text-xs">Gabarito: A</code> <code className="bg-muted px-1 rounded text-xs">Correta: B</code></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div>
            <Label>Cole seu texto com as questões</Label>
            <Textarea
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder={exampleText}
              rows={10}
              className="font-mono text-sm mt-2"
            />
          </div>
          
          {preview.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <Label className="flex items-center gap-2">
                  Pré-visualização ({preview.length} questões)
                </Label>
                <div className="flex gap-2">
                  {okCount > 0 && (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {okCount} OK
                    </Badge>
                  )}
                  {noAnswerCount > 0 && (
                    <Badge variant="secondary" className="bg-amber-500 text-white">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      {noAnswerCount} Sem resposta
                    </Badge>
                  )}
                  {errorCount > 0 && (
                    <Badge variant="destructive">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {errorCount} Erros
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="max-h-80 overflow-y-auto space-y-2 border rounded-lg p-2">
                {preview.map((q, idx) => (
                  <Card 
                    key={idx} 
                    className={cn(
                      "p-3 border-l-4",
                      q.status === 'ok' && "border-l-green-500",
                      q.status === 'no_answer' && "border-l-amber-500",
                      q.status === 'error' && "border-l-red-500"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="font-medium text-sm flex-1">
                        <span className="text-muted-foreground">{idx + 1}.</span> {q.question}
                      </p>
                      <div className="flex items-center gap-1">
                        {q.status === 'ok' && (
                          <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            OK
                          </Badge>
                        )}
                        {q.status === 'no_answer' && (
                          <Badge variant="outline" className="text-amber-600 border-amber-600 text-xs">
                            <Edit2 className="w-3 h-3 mr-1" />
                            Revisar
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      {q.options.map((opt, optIdx) => (
                        opt && (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => handleCorrectChange(idx, optIdx)}
                            className={cn(
                              "px-2 py-1.5 rounded text-left transition-colors",
                              optIdx === q.correct_index 
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 ring-1 ring-green-500" 
                                : "bg-muted text-muted-foreground hover:bg-muted/80",
                              q.status === 'no_answer' && "cursor-pointer hover:ring-1 hover:ring-primary"
                            )}
                          >
                            <span className="font-medium">{String.fromCharCode(65 + optIdx)})</span> {opt}
                          </button>
                        )
                      ))}
                    </div>
                    
                    {q.status === 'no_answer' && (
                      <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Clique na alternativa correta para selecionar
                      </p>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}
          
          {text.length > 0 && preview.length === 0 && (
            <div className="flex items-center gap-2 text-amber-600 text-sm p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              Nenhuma questão detectada. Verifique o formato do texto.
            </div>
          )}
        </div>
        
        <DialogFooter className="mt-4 border-t pt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={preview.length === 0 || isProcessing}
            className={cn(noAnswerCount > 0 && "bg-amber-600 hover:bg-amber-700")}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirmar e Adicionar {preview.length} Questões
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}