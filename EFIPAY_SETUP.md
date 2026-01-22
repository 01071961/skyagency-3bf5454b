# Configuração EfíPay - Guia Completo

Este documento explica como configurar a integração com EfíPay no seu projeto.

## 📋 Pré-requisitos

1. Conta na EfíPay (antiga Gerencianet)
2. Acesso ao painel da EfíPay: https://sejaefi.com.br/

## 🔐 Passo 1: Adicionar Secrets no Lovable Cloud

Você precisa adicionar os seguintes secrets através da interface do Lovable:

### Secrets necessários:

1. **EFI_CLIENT_ID**
   - Onde encontrar: Painel EfíPay > API > Aplicações > Suas Credenciais
   - Exemplo: `Client_Id_abc123def456...`

2. **EFI_CLIENT_SECRET**
   - Onde encontrar: Painel EfíPay > API > Aplicações > Suas Credenciais
   - Exemplo: `Client_Secret_xyz789...`

3. **EFI_ENVIRONMENT**
   - Valores aceitos: `sandbox` (testes) ou `production` (produção)
   - Comece sempre com `sandbox` para testes

4. **EFI_PAYEE_CODE** (opcional, mas recomendado)
   - Onde encontrar: Painel EfíPay > API > Introdução
   - Usado para tokenização de cartão no frontend
   - Se não adicionar como secret, precisará configurar diretamente no código

### Como adicionar os secrets:

1. Acesse as configurações do projeto no Lovable
2. Vá em "Integrations" > "Lovable Cloud" > "Secrets"
3. Clique em "Add Secret"
4. Adicione cada um dos secrets acima com seus respectivos valores

## ⚙️ Passo 2: Configurar Payee Code no Frontend

No arquivo `src/pages/Checkout.tsx`, localize a linha:

```typescript
const PAYEE_CODE = 'SEU_PAYEE_CODE_AQUI';
```

Substitua `'SEU_PAYEE_CODE_AQUI'` pelo seu payee_code real da EfíPay.

Exemplo:
```typescript
const PAYEE_CODE = '123456';
```

Também configure o ambiente:
```typescript
const ENVIRONMENT = 'sandbox'; // ou 'production'
```

## 🧪 Passo 3: Testar no Ambiente Sandbox

### Cartões de teste para sandbox:

**Visa:**
- Número: `4111 1111 1111 1111`
- Validade: `12/2025` (ou qualquer data futura)
- CVV: `123`

**Mastercard:**
- Número: `5500 0000 0000 0004`
- Validade: `12/2025`
- CVV: `123`

### Dados de teste:
- CPF: Qualquer CPF válido (use geradores online)
- Nome: Qualquer nome
- Email: Qualquer email válido

## 📝 Fluxo de Pagamento

1. Cliente preenche formulário de checkout
2. Dados do cartão são tokenizados no frontend (via `payment-token-efi`)
3. Token é enviado para edge function `process-payment`
4. Edge function processa pagamento com API EfíPay
5. Retorna resultado (sucesso ou erro)

## 🔍 Verificar Logs

Para debugar problemas:

1. Acesse os logs da edge function no Lovable Cloud
2. Procure por mensagens de erro
3. Verifique se as credenciais estão corretas

## 🚀 Passar para Produção

1. Obtenha credenciais de produção no painel EfíPay
2. Atualize os secrets `EFI_CLIENT_ID` e `EFI_CLIENT_SECRET` com valores de produção
3. Altere `EFI_ENVIRONMENT` para `production`
4. No `Checkout.tsx`, altere `ENVIRONMENT` para `'production'`
5. Teste com cartão real (pequeno valor)

## 📚 Documentação Oficial

- EfíPay API: https://dev.efipay.com.br/
- payment-token-efi: https://www.npmjs.com/package/payment-token-efi

## ⚠️ Importante

- **NUNCA** commite credenciais de produção no código
- Use sempre secrets para informações sensíveis
- Teste extensivamente no sandbox antes de produção
- Valide todos os dados do cliente antes de processar pagamento

## 🆘 Problemas Comuns

### Erro: "Credenciais EfíPay não configuradas"
- Verifique se adicionou os secrets `EFI_CLIENT_ID` e `EFI_CLIENT_SECRET`

### Erro: "Biblioteca EfíPay não carregada"
- Recarregue a página
- Verifique sua conexão com internet
- Verifique se o `PAYEE_CODE` está correto

### Erro: "Falha na autenticação com EfíPay"
- Verifique se suas credenciais estão corretas
- Confirme se está usando credenciais do ambiente correto (sandbox vs production)

### Pagamento negado
- Verifique se está usando cartões de teste válidos (no sandbox)
- Confirme que todos os dados estão corretos
- Verifique limites da sua conta EfíPay
