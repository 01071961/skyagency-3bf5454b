# SKY BRASIL - Sistema de IA Evolutiva
## Especificação Técnica Completa

---

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Fases de Evolução](#fases-de-evolução)
4. [Modos de Operação](#modos-de-operação)
5. [Banco de Dados](#banco-de-dados)
6. [Regras de Troca de Modo](#regras-de-troca-de-modo)
7. [Prompts por Modo](#prompts-por-modo)
8. [Sistema de Feedback](#sistema-de-feedback)
9. [Aprendizado Contínuo](#aprendizado-contínuo)
10. [Controles Admin](#controles-admin)

---

## 🎯 Visão Geral

O sistema de IA Evolutiva da SKY BRASIL é uma solução inteligente de atendimento que:
- **Aprende** com cada interação
- **Adapta** seu comportamento baseado em feedback
- **Evolui** através de 4 fases distintas
- **Converte** sem ser invasiva
- **Escala** para humanos quando necessário

### Diferenciais

| Característica | Chatbots Comuns | IA Evolutiva SKY |
|----------------|-----------------|------------------|
| Aprendizado | Estático | Contínuo |
| Modos | Único | 4 modos adaptativos |
| Feedback | Ignorado | Integrado ao comportamento |
| Escalação | Manual | Automática inteligente |
| Conversão | Agressiva ou inexistente | Contextual e respeitosa |

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ Chat Widget │  │ Admin Panel │  │ Mode Manager│              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
└─────────┼────────────────┼────────────────┼─────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EDGE FUNCTIONS                              │
│  ┌─────────────────┐  ┌─────────────────┐                       │
│  │ chat-assistant  │  │ admin-ai        │                       │
│  │ (modo dinâmico) │  │ (campanhas)     │                       │
│  └────────┬────────┘  └────────┬────────┘                       │
└───────────┼─────────────────────┼───────────────────────────────┘
            │                     │
            ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                        SUPABASE                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │conversations │  │ ai_feedback  │  │ ai_learnings │           │
│  │ + messages   │  │              │  │              │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐                             │
│  │ai_mode_config│  │ai_settings   │                             │
│  └──────────────┘  └──────────────┘                             │
└─────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     LOVABLE AI GATEWAY                           │
│         google/gemini-2.5-flash (padrão)                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📈 Fases de Evolução

### 🟢 FASE 1 — IA de Suporte Confiável (MVP)

**Objetivo:** Resolver problemas reais sem frustrar o usuário.

**Capacidades:**
- ✅ Responder FAQs sobre streaming e plataformas
- ✅ Resolver erros comuns de configuração
- ✅ Identificar quando NÃO sabe algo
- ✅ Escalar para humano automaticamente
- ✅ Manter contexto da conversa

**Critérios para Avançar:**
- ≥70% das conversas resolvidas sem humano
- Feedback positivo consistente
- Zero reclamações críticas

**Status:** ✅ IMPLEMENTADO

---

### 🟡 FASE 2 — IA Adaptativa (Em Desenvolvimento)

**Objetivo:** Melhorar respostas com base no que funciona.

**Capacidades:**
- ⏳ Priorizar respostas bem avaliadas
- ⏳ Ajustar tom (curto vs detalhado)
- ⏳ Evitar padrões que geram abandono
- ⏳ Reconhecer usuários recorrentes

**Métricas:**
- Taxa de abandono ↓
- Tempo médio de conversa ↓
- Mais respostas "resolvidas"

---

### 🔵 FASE 3 — IA de Conversão (Planejado)

**Objetivo:** Converter SEM ser invasiva.

**Capacidades:**
- Detectar intenção de compra
- Apresentar planos relevantes
- Responder objeções naturalmente
- Oferecer CTA no momento certo

---

### 🟣 FASE 4 — IA Estratégica (Futuro)

**Objetivo:** Aumentar LTV sem spam.

**Capacidades:**
- Sugerir campanhas de email
- Criar mensagens personalizadas
- Reativar usuários inativos
- Integração com CRM

---

## 🎭 Modos de Operação

### 1. SUPPORT (Padrão)
```
Trigger: erro, problema, ajuda, não funciona, dúvida
Confiança mínima: 50%
Prioridade: 1 (mais alta)
```

### 2. SALES (Vendas)
```
Trigger: preço, plano, contratar, upgrade, valor
Confiança mínima: 60%
Prioridade: 2
```

### 3. MARKETING
```
Trigger: novidades, promoção, newsletter, conteúdo
Confiança mínima: 70%
Prioridade: 3
```

### 4. HANDOFF_HUMAN (Transferência)
```
Trigger: humano, pessoa real, atendente, reclamação
Confiança mínima: 95%
Prioridade: 4 (imediato)
```

---

## 🗄️ Banco de Dados

### chat_conversations (atualizado)
```sql
-- Novas colunas adicionadas
current_mode TEXT DEFAULT 'support'
ai_confidence DECIMAL(3,2)
escalation_reason TEXT
```

### ai_feedback
```sql
CREATE TABLE ai_feedback (
  id UUID PRIMARY KEY,
  message_id UUID REFERENCES chat_messages(id),
  conversation_id UUID REFERENCES chat_conversations(id),
  rating INTEGER CHECK (rating IN (-1, 1)),
  resolved BOOLEAN DEFAULT false,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by TEXT
);
```

### ai_learnings
```sql
CREATE TABLE ai_learnings (
  id UUID PRIMARY KEY,
  pattern TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  success_score INTEGER DEFAULT 0,
  fail_score INTEGER DEFAULT 0,
  response_template TEXT,
  keywords TEXT[],
  last_used TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);
```

### ai_mode_config
```sql
CREATE TABLE ai_mode_config (
  id UUID PRIMARY KEY,
  mode TEXT UNIQUE CHECK (mode IN ('support', 'sales', 'marketing', 'handoff_human')),
  is_enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 1,
  prompt_template TEXT NOT NULL,
  trigger_keywords TEXT[],
  confidence_threshold DECIMAL(3,2) DEFAULT 0.70,
  description TEXT
);
```

---

## 🔄 Regras de Troca de Modo

```javascript
// Pseudocódigo da lógica de detecção
function detectMode(message) {
  const lowerMessage = message.toLowerCase();
  
  // 1. Handoff tem prioridade máxima
  if (containsAny(lowerMessage, handoffKeywords)) {
    return { mode: 'handoff_human', confidence: 0.95 };
  }
  
  // 2. Conta keywords de vendas
  const salesScore = countMatches(lowerMessage, salesKeywords);
  if (salesScore >= 2) {
    return { mode: 'sales', confidence: 0.6 + salesScore * 0.1 };
  }
  
  // 3. Conta keywords de suporte
  const supportScore = countMatches(lowerMessage, supportKeywords);
  if (supportScore >= 1) {
    return { mode: 'support', confidence: 0.5 + supportScore * 0.15 };
  }
  
  // 4. Marketing como fallback contextual
  if (containsAny(lowerMessage, marketingKeywords)) {
    return { mode: 'marketing', confidence: 0.7 };
  }
  
  // 5. Default: suporte
  return { mode: 'support', confidence: 0.5 };
}
```

---

## 💬 Prompts por Modo

### SUPPORT
```
Você é um assistente de suporte profissional da SKY BRASIL.
Seu objetivo é resolver o problema do usuário com clareza, precisão e calma.
Se não tiver certeza, diga explicitamente.
Nunca invente respostas.
Se detectar frustração ou erro crítico, sugira atendimento humano.
Mantenha um tom amigável e profissional.
```

### SALES
```
Você atua como consultor, não como vendedor agressivo.
Só apresente produtos se houver interesse explícito.
Explique benefícios com exemplos reais.
Nunca pressione o usuário.
Se o usuário não quiser comprar, volte para suporte.
Foque em entender a necessidade antes de oferecer soluções.
```

### MARKETING
```
Você cria mensagens personalizadas e úteis.
Nunca envie spam.
Toda ação exige consentimento do usuário.
O objetivo é ajudar, não interromper.
Sugira conteúdos relevantes baseados no histórico do usuário.
```

### HANDOFF_HUMAN
```
Você está preparando a transição para um atendente humano.
Colete informações relevantes para facilitar o atendimento.
Informe o usuário que um especialista irá atendê-lo em breve.
Mantenha o usuário engajado enquanto aguarda.
```

---

## 👍 Sistema de Feedback

### Coleta
- Widget de thumbs up/down após cada resposta da IA
- Modal opcional para comentário em feedback negativo
- Marcação de "resolvido" pelo admin

### Uso
- Feedback influencia score dos padrões
- Padrões com alto fail_score são desativados
- Respostas bem avaliadas viram templates

---

## 🧠 Aprendizado Contínuo

### Ciclo de Aprendizado
```
1. Usuário envia mensagem
2. IA detecta modo e responde
3. Usuário dá feedback (opcional)
4. Sistema atualiza scores dos padrões
5. Próxima resposta considera padrões bem-sucedidos
```

### Atualização de Scores
```javascript
// Após feedback positivo
UPDATE ai_learnings 
SET success_score = success_score + 1,
    last_used = now()
WHERE pattern ILIKE '%' || detected_pattern || '%';

// Após feedback negativo
UPDATE ai_learnings 
SET fail_score = fail_score + 1
WHERE pattern ILIKE '%' || detected_pattern || '%';
```

---

## ⚙️ Controles Admin

### Painel IA Evolutiva (Nova Aba)
- Toggle para ativar/desativar cada modo
- Edição de prompts por modo
- Configuração de keywords de gatilho
- Ajuste de threshold de confiança

### Visualização
- Estatísticas de feedback (positivo/negativo)
- Modos mais utilizados
- Padrões aprendidos
- Taxa de escalação para humano

### Ações Manuais
- Travar IA em modo específico por conversa
- Desativar vendas temporariamente
- Desligar IA autônoma completamente
- Adicionar novos padrões manualmente

---

## 📊 Métricas Principais

| Métrica | Descrição | Meta |
|---------|-----------|------|
| Taxa de Resolução | Conversas resolvidas sem humano | ≥70% |
| Feedback Positivo | % de thumbs up | ≥80% |
| Tempo Médio | Duração média de conversa | ≤5min |
| Taxa de Escalação | Transferências para humano | ≤20% |
| Conversão Assistida | Vendas iniciadas pela IA | Crescente |

---

## 🚀 Roadmap de Implementação

### ✅ Concluído
- [x] Tabelas de banco de dados
- [x] Edge function com modos dinâmicos
- [x] Painel admin para configuração
- [x] Sistema de feedback básico

### 🔄 Em Progresso
- [ ] Aprendizado automático de padrões
- [ ] Integração com campanhas de email
- [ ] Dashboard de métricas avançado

### 📅 Planejado
- [ ] Reconhecimento de usuários recorrentes
- [ ] Análise de sentimento em tempo real
- [ ] A/B testing de respostas
- [ ] Integração com CRM externo

---

## ⚠️ Limitações e Advertências

### O que NÃO prometemos:
- ❌ "IA se programa sozinha" - Requer supervisão
- ❌ "Aprendizado automático sem regras" - Sempre há regras
- ❌ "Substitui totalmente humanos" - Complementa, não substitui

### Requisitos:
- Conexão Supabase ativa
- Lovable AI Gateway funcional
- Monitoramento regular de feedback
- Revisão periódica de padrões

---

*Documento gerado automaticamente - SKY BRASIL © 2024*
