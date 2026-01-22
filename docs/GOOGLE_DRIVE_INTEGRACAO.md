# Documentação da Integração Google Drive

> **Versão:** 4.4.2  
> **Última atualização:** Janeiro 2025  
> **Módulo:** Sistema de Armazenamento Híbrido

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Configuração no Google Cloud Console](#configuração-no-google-cloud-console)
4. [Secrets Necessárias](#secrets-necessárias)
5. [Banco de Dados](#banco-de-dados)
6. [Edge Function](#edge-function)
7. [Componentes Frontend](#componentes-frontend)
8. [Fluxos de Autenticação](#fluxos-de-autenticação)
9. [Operações Disponíveis](#operações-disponíveis)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

A integração com Google Drive permite que usuários conectem suas contas Google para armazenamento ilimitado de arquivos, complementando o armazenamento interno de 15GB do Lovable Cloud.

### Características:
- **Autenticação OAuth 2.0** com refresh automático de tokens
- **Armazenamento híbrido**: interno (15GB) + Google Drive (ilimitado)
- **Operações suportadas**: upload, listagem, download, deleção
- **Pasta dedicada**: `SkyInvestimentos - Meus Arquivos`

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                  │
├─────────────────────────────────────────────────────────────────┤
│  src/pages/UnifiedFiles.tsx      - Interface principal          │
│  src/pages/members/GoogleDriveCallback.tsx - OAuth callback     │
│  src/pages/members/MyFilesHybrid.tsx - Interface alternativa    │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      │ Supabase Functions Invoke
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                     EDGE FUNCTION                                │
├─────────────────────────────────────────────────────────────────┤
│  supabase/functions/google-drive-manager/index.ts               │
│                                                                  │
│  Actions:                                                        │
│  ├── get-auth-url      → Gera URL de autorização OAuth          │
│  ├── exchange-code     → Troca código por tokens                │
│  ├── create-root-folder → Cria pasta raiz no Drive              │
│  ├── list-files        → Lista arquivos na pasta                │
│  ├── upload            → Upload multipart para Drive            │
│  └── delete            → Remove arquivo do Drive                │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      │ OAuth 2.0 / Drive API v3
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                   GOOGLE APIS                                    │
├─────────────────────────────────────────────────────────────────┤
│  https://accounts.google.com/o/oauth2/v2/auth                   │
│  https://oauth2.googleapis.com/token                            │
│  https://www.googleapis.com/drive/v3/files                      │
│  https://www.googleapis.com/upload/drive/v3/files               │
└─────────────────────────────────────────────────────────────────┘
                      │
                      │ Tokens armazenados
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE DATABASE                             │
├─────────────────────────────────────────────────────────────────┤
│  user_drive_tokens   → Tokens OAuth do usuário                  │
│  profiles            → Flag drive_connected                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## ⚙️ Configuração no Google Cloud Console

### Passo 1: Criar Projeto
1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione existente
3. Anote o **Project ID**

### Passo 2: Ativar API do Google Drive
1. Vá em **APIs & Services** → **Library**
2. Busque por "Google Drive API"
3. Clique em **Enable**

### Passo 3: Configurar Tela de Consentimento
1. Vá em **APIs & Services** → **OAuth consent screen**
2. Selecione **External** (para usuários gerais)
3. Preencha:
   - **App name**: SkyInvestimentos
   - **User support email**: seu-email@exemplo.com
   - **Developer contact**: seu-email@exemplo.com
4. Em **Scopes**, adicione:
   - `https://www.googleapis.com/auth/drive.file`

### Passo 4: Criar Credenciais OAuth
1. Vá em **APIs & Services** → **Credentials**
2. Clique em **Create Credentials** → **OAuth client ID**
3. Selecione **Web application**
4. Configure:
   - **Name**: SkyInvestimentos Web
   - **Authorized JavaScript origins**:
     ```
     https://SEU-PROJETO.lovable.app
     http://localhost:5173  (desenvolvimento)
     ```
   - **Authorized redirect URIs**:
     ```
     https://SEU-PROJETO.lovable.app/drive-callback
     http://localhost:5173/drive-callback  (desenvolvimento)
     ```
5. Copie o **Client ID** e **Client Secret**

---

## 🔐 Secrets Necessárias

| Secret Name | Descrição | Onde Obter |
|-------------|-----------|------------|
| `GOOGLE_CLIENT_ID` | ID do cliente OAuth | Google Cloud Console → Credentials |
| `GOOGLE_CLIENT_SECRET` | Secret do cliente OAuth | Google Cloud Console → Credentials |

### Como Adicionar no Lovable Cloud:
1. Acesse o Lovable Cloud Backend
2. Vá em **Secrets**
3. Adicione as duas secrets acima

### Verificar Secrets Configuradas:
```bash
# As secrets são acessadas na Edge Function via:
Deno.env.get("GOOGLE_CLIENT_ID")
Deno.env.get("GOOGLE_CLIENT_SECRET")
```

---

## 🗄️ Banco de Dados

### Tabela: `user_drive_tokens`

Armazena os tokens OAuth dos usuários.

| Coluna | Tipo | Nullable | Descrição |
|--------|------|----------|-----------|
| `id` | uuid | NO | Chave primária |
| `user_id` | uuid | NO | FK para auth.users |
| `access_token` | text | YES | Token de acesso (expira em 1h) |
| `refresh_token` | text | YES | Token para renovar access_token |
| `expiry_date` | timestamptz | YES | Data de expiração do access_token |
| `scope` | text | YES | Escopo autorizado |
| `folder_id` | text | YES | ID da pasta raiz no Drive |
| `created_at` | timestamptz | YES | Data de criação |
| `updated_at` | timestamptz | YES | Data de atualização |

### SQL de Criação:
```sql
CREATE TABLE public.user_drive_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  access_token TEXT,
  refresh_token TEXT,
  expiry_date TIMESTAMPTZ,
  scope TEXT,
  folder_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.user_drive_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own tokens"
ON public.user_drive_tokens
FOR ALL
USING (auth.uid() = user_id);
```

### Tabela: `profiles` (campo relacionado)

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `drive_connected` | boolean | Indica se Drive está conectado |

---

## 🔧 Edge Function

### Localização:
```
supabase/functions/google-drive-manager/index.ts
```

### Estrutura:

```typescript
// Imports e configuração
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Variáveis de ambiente
const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!;
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!;
```

### Actions Disponíveis:

#### 1. `get-auth-url`
Gera URL de autorização OAuth para o usuário.

**Request:**
```json
{
  "action": "get-auth-url",
  "user_id": "uuid-do-usuario",
  "origin": "https://seu-projeto.lovable.app"
}
```

**Response:**
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?...",
  "redirectUri": "https://seu-projeto.lovable.app/drive-callback"
}
```

#### 2. `exchange-code`
Troca o código de autorização por tokens.

**Request:**
```json
{
  "action": "exchange-code",
  "user_id": "uuid-do-usuario",
  "code": "codigo-do-google",
  "redirect_uri": "https://seu-projeto.lovable.app/drive-callback"
}
```

**Response:**
```json
{
  "success": true
}
```

**Side Effects:**
- Salva tokens em `user_drive_tokens`
- Atualiza `profiles.drive_connected = true`

#### 3. `create-root-folder`
Cria ou encontra a pasta raiz no Drive.

**Request:**
```json
{
  "action": "create-root-folder",
  "user_id": "uuid-do-usuario"
}
```

**Response:**
```json
{
  "folderId": "1abc123..."
}
```

#### 4. `list-files`
Lista arquivos dentro de uma pasta.

**Request:**
```json
{
  "action": "list-files",
  "user_id": "uuid-do-usuario",
  "folderId": "1abc123..."
}
```

**Response:**
```json
{
  "files": [
    {
      "id": "file-id",
      "name": "arquivo.pdf",
      "size": "1024",
      "modifiedTime": "2025-01-01T00:00:00Z",
      "webViewLink": "https://drive.google.com/...",
      "mimeType": "application/pdf"
    }
  ]
}
```

#### 5. `upload`
Faz upload de arquivo para o Drive (multipart).

**Request:**
```json
{
  "action": "upload",
  "user_id": "uuid-do-usuario",
  "folderId": "1abc123...",
  "file_name": "documento.pdf",
  "file_data": "data:application/pdf;base64,...",
  "file_mime": "application/pdf"
}
```

**Response:**
```json
{
  "file": {
    "id": "new-file-id",
    "name": "documento.pdf",
    "size": "1024",
    "webViewLink": "https://drive.google.com/..."
  }
}
```

#### 6. `delete`
Remove arquivo do Drive.

**Request:**
```json
{
  "action": "delete",
  "user_id": "uuid-do-usuario",
  "fileId": "file-id-to-delete"
}
```

**Response:**
```json
{
  "success": true
}
```

### Refresh Automático de Token

A Edge Function verifica automaticamente se o token expirou:

```typescript
// Check if token needs refresh
if (new Date(tokenData.expiry_date) <= new Date()) {
  // Faz refresh usando refresh_token
  const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: tokenData.refresh_token,
      grant_type: "refresh_token",
    }),
  });
  // Atualiza tokens no banco
}
```

---

## 🖥️ Componentes Frontend

### 1. UnifiedFiles.tsx

**Localização:** `src/pages/UnifiedFiles.tsx`

**Funcionalidades:**
- Interface principal de gerenciamento de arquivos
- Exibe armazenamento interno + Google Drive
- Botão para conectar Drive
- Upload/Download/Delete de arquivos

**Estado relevante:**
```typescript
const [driveConnected, setDriveConnected] = useState(false);
const [driveFolderId, setDriveFolderId] = useState<string | null>(null);
const [driveFiles, setDriveFiles] = useState<FileItem[]>([]);
```

### 2. GoogleDriveCallback.tsx

**Localização:** `src/pages/members/GoogleDriveCallback.tsx`

**Funcionalidades:**
- Processa callback do OAuth
- Troca código por tokens via Edge Function
- Redireciona após sucesso/erro

**Estados:**
- `loading`: Processando callback
- `success`: Drive conectado com sucesso
- `error`: Falha na conexão

### 3. Rotas Configuradas

```typescript
// Em src/App.tsx
<Route path="/files" element={<UnifiedFiles />} />
<Route path="/drive-callback" element={<GoogleDriveCallback />} />

// Dentro de /members
<Route path="files" element={<MyFilesHybrid />} />
<Route path="drive-callback" element={<GoogleDriveCallback />} />
```

---

## 🔄 Fluxos de Autenticação

### Fluxo de Conexão (OAuth 2.0)

```
┌──────────────┐    1. Click "Conectar Drive"    ┌───────────────────┐
│   FRONTEND   │ ──────────────────────────────► │  Edge Function    │
│ UnifiedFiles │                                  │ get-auth-url      │
└──────────────┘                                  └───────────────────┘
       │                                                    │
       │                    2. authUrl                      │
       │ ◄──────────────────────────────────────────────────┘
       │
       │    3. Redirect para Google
       ▼
┌──────────────────────────────────────────────────────────────────┐
│                     GOOGLE OAUTH                                  │
│  https://accounts.google.com/o/oauth2/v2/auth                    │
│  - Usuário faz login                                              │
│  - Usuário autoriza acesso ao Drive                              │
└──────────────────────────────────────────────────────────────────┘
       │
       │    4. Redirect com code
       ▼
┌─────────────────────┐    5. exchange-code    ┌───────────────────┐
│  GoogleDriveCallback│ ─────────────────────► │  Edge Function    │
│                     │                         │  exchange-code    │
└─────────────────────┘                         └───────────────────┘
       │                                                   │
       │                                        6. Salva tokens
       │                                        7. drive_connected=true
       │                                                   │
       │            8. success                             │
       │ ◄─────────────────────────────────────────────────┘
       │
       │    9. Redirect para /files
       ▼
┌──────────────┐
│   FRONTEND   │   Drive conectado! ✓
│ UnifiedFiles │
└──────────────┘
```

### Fluxo de Operação (Upload)

```
┌──────────────┐    1. Seleciona arquivo     ┌───────────────────┐
│   FRONTEND   │ ─────────────────────────►  │  handleUpload()   │
│ UnifiedFiles │                              │  FileReader       │
└──────────────┘                              └───────────────────┘
       │                                                │
       │                      2. Base64 data            │
       │ ◄──────────────────────────────────────────────┘
       │
       │    3. invoke('google-drive-manager')
       ▼
┌───────────────────────────────────────────────────────────────────┐
│                        EDGE FUNCTION                               │
│  1. Verifica tokens (refresh se necessário)                       │
│  2. Decodifica base64                                              │
│  3. Cria multipart request                                         │
│  4. POST para googleapis.com/upload/drive/v3/files                │
└───────────────────────────────────────────────────────────────────┘
       │
       │    4. Response com file data
       ▼
┌──────────────┐
│   FRONTEND   │   toast.success("Arquivo enviado!")
│ UnifiedFiles │   loadDriveFiles()
└──────────────┘
```

---

## 🔍 Operações Disponíveis

| Operação | Método | Endpoint Google | Descrição |
|----------|--------|-----------------|-----------|
| Listar Arquivos | GET | `/drive/v3/files` | Lista arquivos de uma pasta |
| Criar Pasta | POST | `/drive/v3/files` | Cria pasta com mimeType específico |
| Upload | POST | `/upload/drive/v3/files?uploadType=multipart` | Upload multipart |
| Download | - | `webViewLink` | Via link direto do Google |
| Deletar | DELETE | `/drive/v3/files/{fileId}` | Move para lixeira |

### Scopes Utilizados

```
https://www.googleapis.com/auth/drive.file
```

Este escopo permite:
- Criar arquivos novos
- Ler arquivos criados pelo app
- Modificar arquivos criados pelo app
- Deletar arquivos criados pelo app

**Não permite:**
- Acessar arquivos criados por outros apps
- Ver toda a estrutura do Drive do usuário

---

## 🔧 Troubleshooting

### Erro: "Drive não conectado"

**Causa:** Tokens não encontrados no banco.

**Solução:**
1. Verificar se usuário completou OAuth
2. Checar tabela `user_drive_tokens`
3. Reconectar Drive

### Erro: "Token expired, please reconnect"

**Causa:** Refresh token inválido ou revogado.

**Solução:**
1. Usuário deve reconectar Drive
2. Verificar se app está em produção no Google Console

### Erro: "Origin ausente"

**Causa:** Frontend não enviou origin na requisição.

**Solução:**
```typescript
// Corrigir chamada:
body: { 
  action: 'get-auth-url', 
  user_id: user.id, 
  origin: window.location.origin  // ← Adicionar
}
```

### Erro: "redirect_uri_mismatch"

**Causa:** URI de redirect não autorizada no Google Console.

**Solução:**
1. Acessar Google Cloud Console → Credentials
2. Adicionar URI exata:
   - `https://seu-projeto.lovable.app/drive-callback`

### Erro: "Failed to save tokens"

**Causa:** Problema ao salvar no banco de dados.

**Solução:**
1. Verificar RLS policies em `user_drive_tokens`
2. Verificar se `user_id` existe em auth.users

### Debug: Ver logs da Edge Function

```typescript
// Logs aparecem no console do Lovable Cloud
console.log("[google-drive-manager] Action:", action);
console.log("[google-drive-manager] User:", user_id);
console.error("[google-drive-manager] Error:", error);
```

---

## 📁 Arquivos da Integração

```
├── supabase/functions/
│   └── google-drive-manager/
│       └── index.ts              # Edge Function principal
│
├── src/pages/
│   ├── UnifiedFiles.tsx          # Interface de arquivos
│   └── members/
│       ├── GoogleDriveCallback.tsx  # OAuth callback
│       └── MyFilesHybrid.tsx        # Interface alternativa
│
├── src/lib/
│   └── url.ts                    # Helpers (getGoogleDriveFileId, etc.)
│
└── docs/
    └── GOOGLE_DRIVE_INTEGRACAO.md  # Esta documentação
```

---

## 🔒 Segurança

### Boas Práticas Implementadas:

1. **Tokens armazenados no servidor** (não no frontend)
2. **Refresh automático** de access tokens
3. **RLS policies** protegem tokens de outros usuários
4. **Scope mínimo** (`drive.file` ao invés de `drive`)
5. **CORS headers** configurados na Edge Function

### Recomendações:

1. **Nunca expor** `GOOGLE_CLIENT_SECRET` no frontend
2. **Validar** `user_id` em todas as operações
3. **Monitorar** uso da API no Google Console
4. **Revogar acesso** quando usuário deletar conta

---

## 📊 Métricas e Limites

### Google Drive API:

| Métrica | Limite |
|---------|--------|
| Queries por dia | 1.000.000.000 |
| Queries por 100s por usuário | 1.000 |
| Upload máximo (resumable) | 5TB |
| Upload máximo (multipart) | 5MB |

### Recomendações para Arquivos Grandes:

Para arquivos > 5MB, implementar upload resumable:
- Divide arquivo em chunks
- Permite retry de chunks individuais
- Mostra progresso real

---

**Documentação gerada automaticamente**  
**Plataforma:** SkyInvestimentos VIP  
**Versão do Sistema:** 4.4.2
