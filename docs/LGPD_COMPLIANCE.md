# SKY BRASIL - LGPD Compliance

## Conformidade com a Lei Geral de Proteção de Dados

---

## 📋 Sumário

1. [Visão Geral](#visão-geral)
2. [Dados Coletados](#dados-coletados)
3. [Base Legal](#base-legal)
4. [Direitos do Titular](#direitos-do-titular)
5. [Medidas de Segurança](#medidas-de-segurança)
6. [Retenção de Dados](#retenção-de-dados)
7. [Compartilhamento](#compartilhamento)
8. [Auditoria](#auditoria)
9. [Contato DPO](#contato-dpo)

---

## 🎯 Visão Geral

A SKY BRASIL está comprometida com a proteção dos dados pessoais de seus usuários, clientes e parceiros, em conformidade com a Lei nº 13.709/2018 (LGPD).

Este documento descreve as práticas implementadas no sistema para garantir conformidade legal e proteção adequada dos dados.

---

## 📊 Dados Coletados

### Dados de Contato
| Dado | Finalidade | Base Legal |
|------|------------|------------|
| Nome | Identificação e comunicação | Execução de contrato |
| E-mail | Comunicação e notificações | Consentimento |
| Telefone | Contato e suporte | Consentimento |
| Tipo de usuário | Segmentação de serviços | Legítimo interesse |

### Dados de Navegação
| Dado | Finalidade | Base Legal |
|------|------------|------------|
| Endereço IP | Segurança e auditoria | Legítimo interesse |
| Cookies de sessão | Funcionamento do sistema | Necessário para o serviço |
| Histórico de chat | Suporte ao cliente | Execução de contrato |

### Dados de Interação
| Dado | Finalidade | Base Legal |
|------|------------|------------|
| Mensagens de chat | Atendimento e suporte | Execução de contrato |
| Feedback da IA | Melhoria do serviço | Legítimo interesse |
| Preferências | Personalização | Consentimento |

---

## ⚖️ Base Legal

### Consentimento (Art. 7º, I)
- Coleta de e-mail para newsletter
- Comunicações de marketing
- Cookies não essenciais

### Execução de Contrato (Art. 7º, V)
- Dados necessários para prestação de serviços
- Histórico de atendimento
- Informações de pagamento

### Legítimo Interesse (Art. 7º, IX)
- Logs de auditoria para segurança
- Análise de uso para melhoria
- Prevenção de fraudes

---

## 👤 Direitos do Titular

### Implementações no Sistema

#### 1. Confirmação e Acesso (Art. 18, I e II)
```
✅ Implementado: Painel de auditoria com histórico completo
✅ Implementado: Exportação de logs em CSV/JSON
🔄 Em desenvolvimento: Portal de autoatendimento para titulares
```

#### 2. Correção de Dados (Art. 18, III)
```
✅ Implementado: Admins podem editar dados de contato
🔄 Em desenvolvimento: Solicitação de correção pelo chat
```

#### 3. Anonimização, Bloqueio ou Eliminação (Art. 18, IV)
```
✅ Implementado: Política de DELETE no banco de dados
🔄 Em desenvolvimento: Anonimização automática após período
📋 Planejado: Botão "Esquecer meus dados" no chat
```

#### 4. Portabilidade (Art. 18, V)
```
✅ Implementado: Exportação de logs em formato padrão (JSON/CSV)
📋 Planejado: API de portabilidade para sistemas terceiros
```

#### 5. Eliminação de Dados com Consentimento (Art. 18, VI)
```
✅ Implementado: RLS policies permitem exclusão
🔄 Em desenvolvimento: Processo automatizado de exclusão
```

#### 6. Informação sobre Compartilhamento (Art. 18, VII)
```
✅ Implementado: Logs de auditoria registram acessos
📋 Planejado: Relatório de compartilhamento por titular
```

#### 7. Revogação de Consentimento (Art. 18, IX)
```
🔄 Em desenvolvimento: Toggle de preferências de comunicação
📋 Planejado: Link de opt-out em todos os e-mails
```

---

## 🔒 Medidas de Segurança

### Controles Técnicos

#### Autenticação e Autorização
- ✅ Supabase Auth com tokens JWT
- ✅ Row Level Security (RLS) em todas as tabelas
- ✅ Roles: Admin, Operador, Visualizador
- ✅ Sessões com expiração automática

#### Criptografia
- ✅ HTTPS em todas as comunicações
- ✅ Dados sensíveis criptografados em repouso
- ✅ Secrets gerenciados por Supabase Vault

#### Monitoramento
- ✅ Logs de auditoria completos
- ✅ Alertas de ações sensíveis
- ✅ Tracking de IPs
- ✅ Histórico de alterações

### Controles Organizacionais

#### Acesso Mínimo
- Princípio do menor privilégio aplicado
- Revisão periódica de acessos
- Desativação imediata de ex-colaboradores

#### Treinamento
- Documentação de boas práticas
- Guidelines para tratamento de dados
- Procedimentos de resposta a incidentes

---

## ⏰ Retenção de Dados

### Política de Retenção

| Categoria | Período | Justificativa |
|-----------|---------|---------------|
| Contatos ativos | Enquanto ativo | Execução de contrato |
| Contatos inativos | 2 anos | Legítimo interesse |
| Logs de auditoria | 5 anos | Obrigação legal |
| Histórico de chat | 1 ano | Suporte e qualidade |
| Dados de marketing | Até revogação | Consentimento |
| Backups | 90 dias | Segurança |

### Processos de Exclusão

1. **Exclusão Automática**: Scripts programados para dados expirados
2. **Exclusão Manual**: Solicitação do titular processada em até 15 dias
3. **Anonimização**: Opção para manter dados estatísticos sem identificação

---

## 🤝 Compartilhamento

### Parceiros e Fornecedores

| Parceiro | Dados Compartilhados | Finalidade |
|----------|---------------------|------------|
| Supabase | Todos (hosting) | Infraestrutura |
| Resend | E-mail | Envio de comunicações |
| Brevo | E-mail (backup) | Envio de comunicações |
| Lovable AI | Mensagens (processamento) | Respostas da IA |

### Garantias Contratuais

- ✅ Todos os fornecedores possuem DPA (Data Processing Agreement)
- ✅ Servidores localizados em regiões com adequação de dados
- ✅ Cláusulas de confidencialidade em vigor

---

## 📝 Auditoria

### Eventos Registrados

- Login/logout de administradores
- Visualização de dados pessoais
- Alteração de registros
- Exportação de dados
- Exclusão de registros
- Alteração de configurações
- Ações da IA

### Relatórios Disponíveis

1. **Relatório de Ações por Período**
   - Filtros: data, tipo de ação, administrador
   - Exportação: CSV, JSON

2. **Relatório de Acessos a Dados**
   - Quem acessou, quando e quais dados
   - Trilha completa de auditoria

3. **Relatório de Incidentes**
   - Tentativas de acesso negadas
   - Ações sensíveis flagadas
   - Anomalias detectadas

---

## 📞 Contato DPO

### Encarregado de Proteção de Dados

**Responsável**: SKY BRASIL Agency  
**E-mail**: skyagencysc@gmail.com  
**Telefone**: +55 48 99661-7935  

### Canal de Solicitações

Os titulares podem exercer seus direitos através de:

1. **E-mail direto** para o DPO
2. **Chat do site** com assunto "LGPD"
3. **Formulário de contato** selecionando "Privacidade"

### Prazos de Resposta

| Tipo de Solicitação | Prazo |
|---------------------|-------|
| Confirmação de dados | 15 dias |
| Correção | 15 dias |
| Exclusão | 15 dias |
| Portabilidade | 15 dias |
| Reclamação | 15 dias |

---

## 📅 Histórico de Revisões

| Versão | Data | Alterações |
|--------|------|------------|
| 1.0 | Dez/2024 | Versão inicial |

---

*Este documento é parte integrante da política de privacidade da SKY BRASIL e deve ser revisado periodicamente para garantir conformidade contínua com a LGPD.*
