import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateQuestionsRequest {
  lessonContent: string;
  lessonTitle: string;
  numberOfQuestions: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  questionTypes?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      lessonContent, 
      lessonTitle, 
      numberOfQuestions = 5, 
      difficulty = 'medium',
      questionTypes = ['multiple_choice']
    }: GenerateQuestionsRequest = await req.json();

    if (!lessonContent || !lessonTitle) {
      throw new Error('Conteúdo da aula e título são obrigatórios');
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não está configurada");
    }

    const difficultyInstructions = {
      easy: 'Crie questões simples que testem compreensão básica do conteúdo.',
      medium: 'Crie questões de dificuldade moderada que testem aplicação do conhecimento.',
      hard: 'Crie questões desafiadoras que exijam análise e síntese do conteúdo.',
      mixed: 'Varie a dificuldade das questões entre fácil, médio e difícil.'
    };

    const systemPrompt = `Você é um especialista em criar questões de prova para cursos online em português brasileiro.
    
Suas questões devem:
1. Ser claras e objetivas
2. Ter 4 alternativas cada (A, B, C, D)
3. Ter apenas UMA resposta correta
4. Incluir explicação da resposta correta
5. Ser baseadas APENAS no conteúdo fornecido
6. ${difficultyInstructions[difficulty]}

Retorne as questões no formato JSON exato:
{
  "questions": [
    {
      "question": "Texto da pergunta?",
      "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
      "correct_index": 0,
      "explanation": "Explicação de por que esta é a resposta correta",
      "difficulty": "easy|medium|hard",
      "topic": "Tópico relacionado da aula"
    }
  ]
}`;

    const userPrompt = `Crie ${numberOfQuestions} questões de múltipla escolha baseadas no seguinte conteúdo da aula "${lessonTitle}":

${lessonContent}

Gere as questões variando os tópicos cobertos e garantindo que todas as alternativas incorretas sejam plausíveis mas claramente erradas.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit excedido. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao seu workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Resposta vazia da IA");
    }

    // Parse JSON from response (handle potential markdown code blocks)
    let questionsData;
    try {
      // Remove markdown code blocks if present
      const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      questionsData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Parse error:", parseError, "Content:", content);
      throw new Error("Erro ao processar resposta da IA");
    }

    console.log(`Generated ${questionsData.questions?.length || 0} questions for lesson: ${lessonTitle}`);

    return new Response(
      JSON.stringify(questionsData),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-quiz-questions:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
