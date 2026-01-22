// Email Templates for SKY BRASIL

const BRAND_COLOR = '#ff3399';
const BRAND_NAME = 'SKY BRASIL';
const SUPPORT_EMAIL = 'skyagencysc@gmail.com';
const SITE_URL = 'https://skystreamer.online';

const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 0; background-color: #0a0a14; color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { font-size: 28px; font-weight: 700; color: ${BRAND_COLOR}; letter-spacing: -0.02em; }
    .content { background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%); border-radius: 12px; padding: 30px; border: 1px solid rgba(255, 51, 153, 0.2); }
    h1 { font-size: 24px; margin: 0 0 20px; color: #f8fafc; }
    p { font-size: 16px; line-height: 1.6; margin: 0 0 15px; color: #cbd5e1; }
    .highlight { color: ${BRAND_COLOR}; font-weight: 600; }
    .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #64748b; }
    .button { display: inline-block; background: linear-gradient(135deg, ${BRAND_COLOR}, #9933ff); color: white; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .info-box { background: rgba(255,51,153,0.1); padding: 20px; border-radius: 8px; margin: 20px 0; }
    .warning-box { background: rgba(255, 165, 0, 0.1); border: 1px solid rgba(255, 165, 0, 0.3); padding: 20px; border-radius: 8px; margin: 20px 0; }
    .success-box { background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); padding: 20px; border-radius: 8px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">${BRAND_NAME}</div>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${BRAND_NAME}. Todos os direitos reservados.</p>
      <p>Dúvidas? <a href="mailto:${SUPPORT_EMAIL}" style="color: ${BRAND_COLOR};">${SUPPORT_EMAIL}</a></p>
    </div>
  </div>
</body>
</html>
`;

export const contactConfirmationEmail = (name: string) => ({
  subject: 'Recebemos sua mensagem!',
  html: baseTemplate(`
    <h1>Olá ${name},</h1>
    <p>Agradecemos seu contato. Sua mensagem foi recebida com sucesso e entraremos em contato em até <span class="highlight">7 dias úteis</span>.</p>
    <p>Atenciosamente,</p>
    <p><strong>Equipe ${BRAND_NAME}</strong></p>
  `),
});

export const vipConfirmationEmail = (name: string) => ({
  subject: 'Inscrição confirmada!',
  html: baseTemplate(`
    <h1>Olá ${name},</h1>
    <p>Você já está na nossa <span class="highlight">lista VIP</span>!</p>
    <p>Em breve receberá novidades exclusivas e oportunidades especiais da ${BRAND_NAME}.</p>
    <p>Atenciosamente,</p>
    <p><strong>Equipe ${BRAND_NAME}</strong></p>
  `),
});

export const orderConfirmationEmail = (name: string, orderId: string, date: string, items: { name: string; value: number; amount: number }[], total: number) => ({
  subject: `Pedido #${orderId} confirmado!`,
  html: baseTemplate(`
    <h1>Olá ${name}, seu pagamento foi aprovado!</h1>
    <p>Pedido <span class="highlight">#${orderId}</span> recebido em ${date}.</p>
    <div class="success-box">
      <h3 style="margin: 0 0 15px; color: #22c55e;">✓ Pagamento Confirmado</h3>
      ${items.map(item => `
        <p style="margin: 5px 0; display: flex; justify-content: space-between;">
          <span>${item.name} x${item.amount}</span>
          <span>R$ ${(item.value * item.amount / 100).toFixed(2)}</span>
        </p>
      `).join('')}
      <hr style="border: none; border-top: 1px solid rgba(34, 197, 94, 0.3); margin: 15px 0;">
      <p style="margin: 0; font-size: 18px; font-weight: 600; display: flex; justify-content: space-between;">
        <span>Total:</span>
        <span class="highlight">R$ ${(total / 100).toFixed(2)}</span>
      </p>
    </div>
    <p>Em breve enviaremos atualizações sobre seu pedido.</p>
    <a href="${SITE_URL}/vip/dashboard" class="button">Acessar Dashboard</a>
    <p>Obrigado pela preferência!</p>
  `),
});

export const adminNotificationEmail = (type: string, data: Record<string, unknown>) => ({
  subject: `[${BRAND_NAME}] Nova ${type}`,
  html: baseTemplate(`
    <h1>Nova ${type} recebida</h1>
    <div class="info-box">
      ${Object.entries(data).map(([key, value]) => `
        <p><strong>${key}:</strong> ${String(value)}</p>
      `).join('')}
    </div>
  `),
});

// =============================================
// STRIPE TRANSACTIONAL EMAIL TEMPLATES
// =============================================

export const paymentSuccessEmail = (
  name: string,
  amount: number,
  orderId: string,
  productName?: string,
  nextBillingDate?: string,
  isDigitalProduct: boolean = true
) => ({
  subject: `✓ Pagamento Confirmado - ${productName || 'Seu Produto'} Liberado!`,
  html: baseTemplate(`
    <h1>Pagamento Confirmado! ✓</h1>
    <p>Olá <span class="highlight">${name}</span>,</p>
    <p>Seu pagamento foi processado com sucesso e <strong>seu produto digital já está disponível!</strong></p>
    <div class="success-box">
      <h3 style="margin: 0 0 15px; color: #22c55e;">✓ Conteúdo Liberado</h3>
      <p><strong>Pedido:</strong> #${orderId}</p>
      ${productName ? `<p><strong>Produto:</strong> ${productName}</p>` : ''}
      <p><strong>Valor:</strong> <span class="highlight">R$ ${amount.toFixed(2)}</span></p>
      ${nextBillingDate ? `<p><strong>Próxima cobrança:</strong> ${nextBillingDate}</p>` : ''}
    </div>
    ${isDigitalProduct ? `
    <div class="info-box" style="text-align: center;">
      <h3 style="margin: 0 0 10px; color: #f8fafc;">🎉 Acesse Agora!</h3>
      <p style="margin: 0;">Seu conteúdo digital está pronto para ser acessado.</p>
    </div>
    <a href="${SITE_URL}/membros/cursos" class="button" style="display: block; text-align: center;">📚 Acessar Meu Conteúdo</a>
    ` : `
    <a href="${SITE_URL}/vip/dashboard" class="button">Acessar Minha Conta</a>
    `}
    <p style="margin-top: 20px; text-align: center;">Obrigado pela confiança!</p>
    <p style="font-size: 14px; color: #64748b; text-align: center;">Dúvidas? Responda este email ou acesse <a href="mailto:${SUPPORT_EMAIL}" style="color: ${BRAND_COLOR};">${SUPPORT_EMAIL}</a></p>
  `),
});

export const paymentFailedEmail = (
  name: string,
  amount: number,
  reason?: string,
  customerPortalUrl?: string
) => ({
  subject: `⚠️ Falha no Pagamento - Ação Necessária`,
  html: baseTemplate(`
    <h1>Falha no Pagamento</h1>
    <p>Olá <span class="highlight">${name}</span>,</p>
    <p>Infelizmente não conseguimos processar seu pagamento.</p>
    <div class="warning-box">
      <h3 style="margin: 0 0 15px; color: #f59e0b;">Detalhes</h3>
      <p><strong>Valor:</strong> R$ ${amount.toFixed(2)}</p>
      ${reason ? `<p><strong>Motivo:</strong> ${reason}</p>` : ''}
    </div>
    <p><strong>O que fazer agora?</strong></p>
    <ul style="color: #cbd5e1; padding-left: 20px;">
      <li>Verifique se os dados do cartão estão corretos</li>
      <li>Confirme se há limite disponível</li>
      <li>Tente outro método de pagamento</li>
    </ul>
    ${customerPortalUrl ? `<a href="${customerPortalUrl}" class="button">Atualizar Pagamento</a>` : `<a href="${SITE_URL}" class="button">Tentar Novamente</a>`}
    <p style="margin-top: 20px;">Precisa de ajuda? Entre em contato: <a href="mailto:${SUPPORT_EMAIL}" style="color: ${BRAND_COLOR};">${SUPPORT_EMAIL}</a></p>
  `),
});

export const subscriptionRenewalEmail = (
  name: string,
  planName: string,
  amount: number,
  nextBillingDate: string
) => ({
  subject: `✓ Assinatura Renovada - ${planName}`,
  html: baseTemplate(`
    <h1>Assinatura Renovada com Sucesso!</h1>
    <p>Olá <span class="highlight">${name}</span>,</p>
    <p>Sua assinatura foi renovada automaticamente.</p>
    <div class="success-box">
      <h3 style="margin: 0 0 15px; color: #22c55e;">Detalhes da Renovação</h3>
      <p><strong>Plano:</strong> ${planName}</p>
      <p><strong>Valor cobrado:</strong> <span class="highlight">R$ ${amount.toFixed(2)}</span></p>
      <p><strong>Próxima renovação:</strong> ${nextBillingDate}</p>
    </div>
    <a href="${SITE_URL}/vip/dashboard" class="button">Acessar Dashboard</a>
    <p style="margin-top: 20px;">Continue aproveitando todos os benefícios!</p>
  `),
});

export const subscriptionCanceledEmail = (
  name: string,
  planName: string,
  endDate: string
) => ({
  subject: `Assinatura Cancelada - ${planName}`,
  html: baseTemplate(`
    <h1>Assinatura Cancelada</h1>
    <p>Olá <span class="highlight">${name}</span>,</p>
    <p>Confirmamos o cancelamento da sua assinatura.</p>
    <div class="info-box">
      <h3 style="margin: 0 0 15px; color: #f8fafc;">Detalhes</h3>
      <p><strong>Plano:</strong> ${planName}</p>
      <p><strong>Acesso até:</strong> <span class="highlight">${endDate}</span></p>
    </div>
    <p>Você continuará tendo acesso até o final do período pago.</p>
    <p style="margin-top: 20px;">Sentiremos sua falta! Se mudar de ideia:</p>
    <a href="${SITE_URL}/academy" class="button">Reativar Assinatura</a>
    <p style="margin-top: 20px;">Gostaríamos de saber o motivo do cancelamento para melhorar nossos serviços. Responda este email com seu feedback!</p>
  `),
});

export const refundProcessedEmail = (
  name: string,
  amount: number,
  orderId: string,
  reason?: string
) => ({
  subject: `Reembolso Processado - R$ ${amount.toFixed(2)}`,
  html: baseTemplate(`
    <h1>Reembolso Processado</h1>
    <p>Olá <span class="highlight">${name}</span>,</p>
    <p>Seu reembolso foi processado com sucesso.</p>
    <div class="info-box">
      <h3 style="margin: 0 0 15px; color: #f8fafc;">Detalhes do Reembolso</h3>
      <p><strong>Pedido:</strong> #${orderId}</p>
      <p><strong>Valor:</strong> <span class="highlight">R$ ${amount.toFixed(2)}</span></p>
      ${reason ? `<p><strong>Motivo:</strong> ${reason}</p>` : ''}
    </div>
    <p><strong>Prazo:</strong> O valor será creditado em até <span class="highlight">5-10 dias úteis</span> dependendo do seu banco.</p>
    <p style="margin-top: 20px;">Esperamos vê-lo novamente em breve!</p>
    <a href="${SITE_URL}" class="button">Visitar Loja</a>
  `),
});

export const affiliateCommissionEmail = (
  name: string,
  amount: number,
  orderId: string,
  commissionRate: number,
  referredCustomer?: string
) => ({
  subject: `💰 Nova Comissão - R$ ${amount.toFixed(2)}`,
  html: baseTemplate(`
    <h1>Nova Comissão Recebida! 💰</h1>
    <p>Olá <span class="highlight">${name}</span>,</p>
    <p>Parabéns! Você ganhou uma nova comissão.</p>
    <div class="success-box">
      <h3 style="margin: 0 0 15px; color: #22c55e;">Detalhes da Comissão</h3>
      <p><strong>Pedido:</strong> #${orderId}</p>
      ${referredCustomer ? `<p><strong>Cliente indicado:</strong> ${referredCustomer}</p>` : ''}
      <p><strong>Taxa de comissão:</strong> ${commissionRate}%</p>
      <p><strong>Valor ganho:</strong> <span class="highlight">R$ ${amount.toFixed(2)}</span></p>
    </div>
    <a href="${SITE_URL}/vip/dashboard" class="button">Ver Meus Ganhos</a>
    <p style="margin-top: 20px;">Continue compartilhando seu link e aumente seus ganhos!</p>
  `),
});

export const affiliatePayoutEmail = (
  name: string,
  amount: number,
  period: string,
  paymentMethod: string
) => ({
  subject: `💸 Pagamento de Comissões - R$ ${amount.toFixed(2)}`,
  html: baseTemplate(`
    <h1>Pagamento Enviado! 💸</h1>
    <p>Olá <span class="highlight">${name}</span>,</p>
    <p>Seu pagamento de comissões foi processado.</p>
    <div class="success-box">
      <h3 style="margin: 0 0 15px; color: #22c55e;">Detalhes do Pagamento</h3>
      <p><strong>Período:</strong> ${period}</p>
      <p><strong>Método:</strong> ${paymentMethod}</p>
      <p><strong>Valor:</strong> <span class="highlight">R$ ${amount.toFixed(2)}</span></p>
    </div>
    <p><strong>Prazo:</strong> O valor será creditado em até <span class="highlight">1-3 dias úteis</span>.</p>
    <a href="${SITE_URL}/vip/dashboard" class="button">Ver Histórico</a>
    <p style="margin-top: 20px;">Obrigado por fazer parte do programa de afiliados!</p>
  `),
});

// Magic Link Invitation Email
export const magicLinkInviteEmail = (
  name: string,
  role: string,
  magicLink: string,
  expiresAt: string,
  inviterName?: string
) => ({
  subject: `Convite para ${BRAND_NAME} - Acesso ${role}`,
  html: baseTemplate(`
    <h1>Você foi convidado!</h1>
    <p>Olá <span class="highlight">${name}</span>,</p>
    <p>${inviterName ? `${inviterName} convidou você` : 'Você foi convidado'} para acessar o painel administrativo da ${BRAND_NAME}.</p>
    <div class="info-box">
      <h3 style="margin: 0 0 15px; color: #f8fafc;">Detalhes do Convite</h3>
      <p><strong>Nível de acesso:</strong> <span class="highlight">${role}</span></p>
      <p><strong>Válido até:</strong> ${expiresAt}</p>
    </div>
    <p>Clique no botão abaixo para aceitar o convite e configurar sua conta:</p>
    <a href="${magicLink}" class="button">Aceitar Convite</a>
    <p style="margin-top: 20px; font-size: 14px; color: #64748b;">Este link é válido por 7 dias e pode ser usado apenas uma vez.</p>
    <p style="font-size: 14px; color: #64748b;">Se você não esperava este convite, ignore este email.</p>
  `),
});

// Affiliate Welcome Email
export const affiliateWelcomeEmail = (
  name: string,
  referralCode: string,
  referralLink: string
) => ({
  subject: `Bem-vindo ao Programa de Afiliados ${BRAND_NAME}!`,
  html: baseTemplate(`
    <h1>Bem-vindo, ${name}! 🎉</h1>
    <p>Parabéns! Você agora faz parte do <span class="highlight">Programa de Afiliados ${BRAND_NAME}</span>.</p>
    <div class="success-box">
      <h3 style="margin: 0 0 15px; color: #22c55e;">Seus Dados de Afiliado</h3>
      <p><strong>Código:</strong> <span class="highlight">${referralCode}</span></p>
      <p><strong>Seu Link:</strong></p>
      <p style="word-break: break-all; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 4px; font-family: monospace; font-size: 14px;">${referralLink}</p>
    </div>
    <h3 style="margin-top: 25px;">Como funciona?</h3>
    <ul style="color: #cbd5e1; padding-left: 20px; line-height: 1.8;">
      <li>Compartilhe seu link com amigos e seguidores</li>
      <li>Quando alguém comprar usando seu link, você ganha comissão</li>
      <li>Acompanhe seus ganhos no dashboard</li>
      <li>Receba pagamentos mensais via transferência</li>
    </ul>
    <a href="${SITE_URL}/vip/dashboard" class="button">Acessar Dashboard</a>
    <p style="margin-top: 20px;">Dúvidas? Responda este email ou acesse o suporte.</p>
  `),
});
