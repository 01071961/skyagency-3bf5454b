# Guia de Configuração - SKY BRASIL

Este documento explica como configurar os formulários de contato e a integração de pagamentos EfíPay.

---

## 📧 Configuração dos Formulários de Contato

### Secrets Necessários (Lovable Cloud)

Os seguintes secrets devem ser configurados em **Settings > Integrations > Lovable Cloud > Secrets**:

| Secret | Descrição | Onde Obter |
|--------|-----------|------------|
| `RESEND_API_KEY` | Chave da API Resend para envio de emails | https://resend.com/api-keys |
| `ADMIN_EMAIL` | Email que receberá as notificações de formulários | Seu email administrativo |

### Como Configurar o Resend

1. Acesse https://resend.com e crie uma conta
2. Vá em **Domains** (https://resend.com/domains) e configure seu domínio
3. Crie uma API Key em https://resend.com/api-keys
4. Adicione como secret `RESEND_API_KEY` no Lovable Cloud

### Funcionamento

- **Formulário de Contato** (`/contato`): Salva a mensagem no banco de dados e envia email de confirmação ao usuário + notificação ao admin
- **Formulário VIP** (`/vip`): Mesmo processo, com template de email personalizado para inscrições VIP

### Personalizar Email de Origem

Para usar seu próprio domínio nos emails (em vez de `onboarding@resend.dev`):

1. Configure seu domínio no Resend (https://resend.com/domains)
2. Edite o arquivo `supabase/functions/submit-contact/index.ts`
3. Altere a linha `from:` nos métodos `resend.emails.send()`:

```typescript
// Antes
from: "SKY BRASIL <onboarding@resend.dev>",

// Depois (exemplo)
from: "SKY BRASIL <contato@seudominio.com.br>",
```

### Visualizar Mensagens no Banco de Dados

As mensagens são salvas na tabela `contact_submissions`. Você pode visualizá-las através do painel do Lovable Cloud em **Cloud > Database > Tables**.

---

## 💳 Configuração EfíPay (Pagamentos com Cartão)

### Secrets Necessários (Lovable Cloud)

| Secret | Descrição | Onde Obter |
|--------|-----------|------------|
| `EFI_CLIENT_ID` | Client ID da API Efí | Painel Efí > API > Aplicações |
| `EFI_CLIENT_SECRET` | Client Secret da API Efí | Painel Efí > API > Aplicações |
| `EFI_ENVIRONMENT` | Ambiente (`sandbox` ou `production`) | Defina você mesmo |

### Configuração no Frontend

Edite o arquivo `src/pages/Checkout.tsx` e configure:

```typescript
// Linha ~15-16 - Configure suas credenciais
const PAYEE_CODE = 'SEU_PAYEE_CODE_AQUI'; // Substitua pelo seu Payee Code
const ENVIRONMENT = 'sandbox'; // Mude para 'production' em produção
```

**Onde encontrar o PAYEE_CODE:**
- Painel Efí > API > Introdução > Identificador da Conta (payee_code)

### Arquivos da Integração

| Arquivo | Descrição |
|---------|-----------|
| `src/lib/efiConfig.ts` | Inicialização do SDK EfíPay |
| `src/hooks/useEfiPayment.ts` | Hook para processar pagamentos |
| `src/pages/Checkout.tsx` | Página de checkout |
| `supabase/functions/process-payment/index.ts` | Edge function que processa o pagamento |

### Fluxo de Pagamento

1. Cliente preenche dados do cartão no checkout
2. Dados são tokenizados no frontend (biblioteca `payment-token-efi`)
3. Token é enviado para a edge function `process-payment`
4. Edge function autentica com Efí e processa o pagamento
5. Resultado retorna para o frontend

### Cartões de Teste (Sandbox)

**Visa:**
- Número: `4111 1111 1111 1111`
- Validade: `12/2025`
- CVV: `123`

**Mastercard:**
- Número: `5500 0000 0000 0004`
- Validade: `12/2025`
- CVV: `123`

### Passar para Produção

1. Obtenha credenciais de **produção** no painel Efí
2. Atualize os secrets no Lovable Cloud com valores de produção
3. Altere `EFI_ENVIRONMENT` para `production`
4. Em `src/pages/Checkout.tsx`, altere `ENVIRONMENT` para `'production'`
5. Teste com um cartão real (valor pequeno)

---

## 🔧 Troubleshooting

### Emails não estão sendo enviados

1. Verifique se `RESEND_API_KEY` está configurado corretamente
2. Verifique se seu domínio foi validado no Resend
3. Verifique os logs da edge function `submit-contact`

### Pagamento retorna erro

1. Verifique se `EFI_CLIENT_ID` e `EFI_CLIENT_SECRET` estão corretos
2. Confirme que está usando credenciais do ambiente correto
3. Verifique os logs da edge function `process-payment`

### Formulário não submete

1. Verifique o console do navegador para erros
2. Verifique se a edge function está deployada
3. Confirme que todos os campos obrigatórios estão preenchidos

---

## 📚 Documentação Adicional

- [Documentação EfíPay](https://dev.efipay.com.br/)
- [Documentação Resend](https://resend.com/docs)
- [Documentação Lovable Cloud](https://docs.lovable.dev/features/cloud)

---

## ⚠️ Segurança

- **NUNCA** commite credenciais no código
- Sempre use secrets para informações sensíveis
- Teste extensivamente no sandbox antes de produção
- Mantenha seus secrets atualizados e seguros
