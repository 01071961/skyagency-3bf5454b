import { useState } from 'react';
import DOMPurify from 'dompurify';
import { motion } from 'framer-motion';
import { 
  FileText, Check, Copy, Eye, Mail, ShoppingCart, 
  UserPlus, Bell, Gift, Megaphone, Star, Clock,
  CalendarCheck, BookOpen, ShoppingBag
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ElementType;
  subject: string;
  html_content: string;
  variables: string[];
}

export const TEMPLATE_LIBRARY: EmailTemplate[] = [
  {
    id: 'welcome',
    name: 'Boas-vindas',
    description: 'E-mail de boas-vindas para novos usuários',
    category: 'Onboarding',
    icon: UserPlus,
    subject: 'Bem-vindo(a) à {{company_name}}! 🎉',
    variables: ['user_name', 'company_name', 'cta_url'],
    html_content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#1a1a2e 0%,#16162a 100%);border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:40px;text-align:center;">
              <h1 style="color:#fff;font-size:28px;margin:0 0 20px;">Bem-vindo(a), {{user_name}}! 🎉</h1>
              <p style="color:#a1a1aa;font-size:16px;line-height:1.6;margin:0 0 30px;">
                Estamos muito felizes em ter você conosco! Você acaba de dar o primeiro passo para transformar sua presença online.
              </p>
              <a href="{{cta_url}}" style="display:inline-block;background:linear-gradient(135deg,#ec4899,#8b5cf6);color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:16px;">
                Começar Agora
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:30px 40px;background:rgba(255,255,255,0.02);border-top:1px solid rgba(255,255,255,0.05);">
              <p style="color:#71717a;font-size:13px;text-align:center;margin:0;">
                © {{company_name}} - Todos os direitos reservados
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  },
  {
    id: 'purchase_confirmation',
    name: 'Confirmação de Compra',
    description: 'Confirmação após uma compra realizada',
    category: 'Transacional',
    icon: ShoppingCart,
    subject: 'Pedido #{{order_id}} confirmado! ✅',
    variables: ['user_name', 'order_id', 'order_total', 'order_items', 'tracking_url'],
    html_content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#1a1a2e 0%,#16162a 100%);border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:40px;text-align:center;">
              <div style="width:64px;height:64px;background:linear-gradient(135deg,#22c55e,#16a34a);border-radius:50%;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;">
                <span style="color:#fff;font-size:32px;">✓</span>
              </div>
              <h1 style="color:#fff;font-size:24px;margin:0 0 10px;">Pedido Confirmado!</h1>
              <p style="color:#a1a1aa;font-size:14px;margin:0 0 30px;">Pedido #{{order_id}}</p>
              <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:24px;margin:0 0 30px;text-align:left;">
                <p style="color:#fff;font-size:16px;margin:0 0 10px;">Olá, {{user_name}}!</p>
                <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0;">
                  Seu pedido foi confirmado e está sendo preparado. Em breve você receberá as informações de envio.
                </p>
              </div>
              <div style="background:rgba(236,72,153,0.1);border:1px solid rgba(236,72,153,0.2);border-radius:12px;padding:20px;margin:0 0 30px;">
                <p style="color:#ec4899;font-size:24px;font-weight:700;margin:0;">{{order_total}}</p>
                <p style="color:#a1a1aa;font-size:12px;margin:5px 0 0;">Total do pedido</p>
              </div>
              <a href="{{tracking_url}}" style="display:inline-block;background:linear-gradient(135deg,#ec4899,#8b5cf6);color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:16px;">
                Acompanhar Pedido
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  },
  {
    id: 'newsletter',
    name: 'Newsletter',
    description: 'Template para newsletters periódicas',
    category: 'Marketing',
    icon: Mail,
    subject: '{{newsletter_title}} - {{month_year}}',
    variables: ['newsletter_title', 'month_year', 'intro_text', 'featured_content', 'cta_url'],
    html_content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#1a1a2e 0%,#16162a 100%);border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#ec4899,#8b5cf6);padding:30px 40px;text-align:center;">
              <h1 style="color:#fff;font-size:24px;margin:0;">{{newsletter_title}}</h1>
              <p style="color:rgba(255,255,255,0.8);font-size:14px;margin:10px 0 0;">{{month_year}}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <p style="color:#a1a1aa;font-size:16px;line-height:1.6;margin:0 0 30px;">
                {{intro_text}}
              </p>
              <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:24px;margin:0 0 30px;">
                {{featured_content}}
              </div>
              <div style="text-align:center;">
                <a href="{{cta_url}}" style="display:inline-block;background:linear-gradient(135deg,#ec4899,#8b5cf6);color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:16px;">
                  Saiba Mais
                </a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  },
  {
    id: 'promotional',
    name: 'Promoção Especial',
    description: 'Anúncio de ofertas e descontos',
    category: 'Marketing',
    icon: Gift,
    subject: '🔥 {{discount_percent}}% OFF - {{promo_name}}',
    variables: ['promo_name', 'discount_percent', 'promo_description', 'expiry_date', 'promo_code', 'cta_url'],
    html_content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#1a1a2e 0%,#16162a 100%);border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:50px 40px;text-align:center;background:linear-gradient(135deg,rgba(236,72,153,0.2),rgba(139,92,246,0.2));">
              <p style="color:#ec4899;font-size:80px;font-weight:900;margin:0;line-height:1;">{{discount_percent}}%</p>
              <p style="color:#fff;font-size:24px;font-weight:700;margin:10px 0 0;">DE DESCONTO</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;text-align:center;">
              <h2 style="color:#fff;font-size:22px;margin:0 0 15px;">{{promo_name}}</h2>
              <p style="color:#a1a1aa;font-size:16px;line-height:1.6;margin:0 0 30px;">
                {{promo_description}}
              </p>
              <div style="background:rgba(255,255,255,0.05);border:2px dashed rgba(236,72,153,0.4);border-radius:8px;padding:15px;margin:0 0 20px;">
                <p style="color:#71717a;font-size:12px;margin:0 0 5px;">USE O CÓDIGO:</p>
                <p style="color:#ec4899;font-size:24px;font-weight:700;letter-spacing:3px;margin:0;">{{promo_code}}</p>
              </div>
              <p style="color:#f59e0b;font-size:14px;margin:0 0 30px;">⏰ Válido até {{expiry_date}}</p>
              <a href="{{cta_url}}" style="display:inline-block;background:linear-gradient(135deg,#ec4899,#8b5cf6);color:#fff;text-decoration:none;padding:16px 40px;border-radius:8px;font-weight:700;font-size:18px;">
                APROVEITAR AGORA
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  },
  {
    id: 'reengagement',
    name: 'Reengajamento',
    description: 'Reconquistar usuários inativos',
    category: 'Automação',
    icon: Clock,
    subject: 'Sentimos sua falta, {{user_name}}! 💜',
    variables: ['user_name', 'days_inactive', 'special_offer', 'cta_url'],
    html_content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#1a1a2e 0%,#16162a 100%);border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:50px 40px;text-align:center;">
              <p style="font-size:60px;margin:0 0 20px;">💜</p>
              <h1 style="color:#fff;font-size:26px;margin:0 0 15px;">Sentimos sua falta!</h1>
              <p style="color:#a1a1aa;font-size:16px;line-height:1.6;margin:0 0 30px;">
                Olá {{user_name}}, faz {{days_inactive}} dias que não nos vemos! Preparamos algo especial para você voltar:
              </p>
              <div style="background:linear-gradient(135deg,rgba(236,72,153,0.15),rgba(139,92,246,0.15));border:1px solid rgba(236,72,153,0.3);border-radius:12px;padding:24px;margin:0 0 30px;">
                <p style="color:#ec4899;font-size:18px;font-weight:600;margin:0;">{{special_offer}}</p>
              </div>
              <a href="{{cta_url}}" style="display:inline-block;background:linear-gradient(135deg,#ec4899,#8b5cf6);color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:16px;">
                Voltar Agora
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  },
  {
    id: 'feedback_request',
    name: 'Solicitação de Feedback',
    description: 'Pedir avaliação ou review',
    category: 'Engajamento',
    icon: Star,
    subject: 'O que achou da sua experiência? ⭐',
    variables: ['user_name', 'product_name', 'review_url'],
    html_content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#1a1a2e 0%,#16162a 100%);border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:50px 40px;text-align:center;">
              <p style="font-size:48px;margin:0 0 20px;">⭐⭐⭐⭐⭐</p>
              <h1 style="color:#fff;font-size:24px;margin:0 0 15px;">Como foi sua experiência?</h1>
              <p style="color:#a1a1aa;font-size:16px;line-height:1.6;margin:0 0 30px;">
                Olá {{user_name}}, sua opinião sobre {{product_name}} é muito importante para nós! Leva menos de 1 minuto.
              </p>
              <a href="{{review_url}}" style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#f97316);color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:16px;">
                Deixar Avaliação
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  },
  {
    id: 'announcement',
    name: 'Anúncio Importante',
    description: 'Comunicados e novidades',
    category: 'Comunicação',
    icon: Megaphone,
    subject: '📢 {{announcement_title}}',
    variables: ['announcement_title', 'announcement_content', 'cta_text', 'cta_url'],
    html_content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#1a1a2e 0%,#16162a 100%);border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);padding:30px 40px;text-align:center;">
              <p style="font-size:32px;margin:0 0 10px;">📢</p>
              <h1 style="color:#fff;font-size:22px;margin:0;">{{announcement_title}}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <div style="color:#a1a1aa;font-size:16px;line-height:1.8;margin:0 0 30px;">
                {{announcement_content}}
              </div>
              <div style="text-align:center;">
                <a href="{{cta_url}}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:16px;">
                  {{cta_text}}
                </a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  },
  {
    id: 'reminder',
    name: 'Lembrete',
    description: 'Lembretes de carrinho, evento, etc',
    category: 'Automação',
    icon: Bell,
    subject: '⏰ Lembrete: {{reminder_subject}}',
    variables: ['user_name', 'reminder_subject', 'reminder_message', 'cta_text', 'cta_url'],
    html_content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#1a1a2e 0%,#16162a 100%);border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:50px 40px;text-align:center;">
              <div style="width:64px;height:64px;background:linear-gradient(135deg,#f59e0b,#f97316);border-radius:50%;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;">
                <span style="font-size:28px;">⏰</span>
              </div>
              <h1 style="color:#fff;font-size:24px;margin:0 0 15px;">{{reminder_subject}}</h1>
              <p style="color:#a1a1aa;font-size:16px;line-height:1.6;margin:0 0 30px;">
                Olá {{user_name}}, {{reminder_message}}
              </p>
              <a href="{{cta_url}}" style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#f97316);color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:16px;">
                {{cta_text}}
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  },
  {
    id: 'abandoned_cart',
    name: 'Carrinho Abandonado',
    description: 'Recuperar vendas de carrinhos abandonados',
    category: 'Automação',
    icon: ShoppingBag,
    subject: 'Você esqueceu algo no carrinho! 🛒',
    variables: ['user_name', 'cart_items', 'cart_total', 'checkout_url', 'discount_code'],
    html_content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#1a1a2e 0%,#16162a 100%);border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:50px 40px;text-align:center;">
              <p style="font-size:60px;margin:0 0 20px;">🛒</p>
              <h1 style="color:#fff;font-size:26px;margin:0 0 15px;">Você deixou algo para trás!</h1>
              <p style="color:#a1a1aa;font-size:16px;line-height:1.6;margin:0 0 30px;">
                Olá {{user_name}}, notamos que você deixou alguns itens no seu carrinho. Eles ainda estão esperando por você!
              </p>
              <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:24px;margin:0 0 20px;text-align:left;">
                {{cart_items}}
              </div>
              <div style="background:linear-gradient(135deg,rgba(236,72,153,0.15),rgba(139,92,246,0.15));border:1px solid rgba(236,72,153,0.3);border-radius:12px;padding:20px;margin:0 0 20px;">
                <p style="color:#fff;font-size:14px;margin:0 0 5px;">Total do carrinho:</p>
                <p style="color:#ec4899;font-size:28px;font-weight:700;margin:0;">{{cart_total}}</p>
              </div>
              <div style="background:rgba(34,197,94,0.1);border:2px dashed rgba(34,197,94,0.4);border-radius:8px;padding:15px;margin:0 0 30px;">
                <p style="color:#71717a;font-size:12px;margin:0 0 5px;">🎁 USE O CÓDIGO E GANHE 10% OFF:</p>
                <p style="color:#22c55e;font-size:20px;font-weight:700;letter-spacing:3px;margin:0;">{{discount_code}}</p>
              </div>
              <a href="{{checkout_url}}" style="display:inline-block;background:linear-gradient(135deg,#ec4899,#8b5cf6);color:#fff;text-decoration:none;padding:16px 40px;border-radius:8px;font-weight:700;font-size:18px;">
                FINALIZAR COMPRA
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  },
  {
    id: 'event_confirmation',
    name: 'Confirmação de Evento',
    description: 'Confirmação de inscrição em evento ou webinar',
    category: 'Transacional',
    icon: CalendarCheck,
    subject: 'Inscrição confirmada: {{event_name}} ✅',
    variables: ['user_name', 'event_name', 'event_date', 'event_time', 'event_location', 'event_url', 'calendar_url'],
    html_content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#1a1a2e 0%,#16162a 100%);border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#8b5cf6,#6366f1);padding:30px 40px;text-align:center;">
              <p style="font-size:40px;margin:0 0 10px;">📅</p>
              <h1 style="color:#fff;font-size:22px;margin:0;">Inscrição Confirmada!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <p style="color:#fff;font-size:16px;margin:0 0 20px;">Olá {{user_name}},</p>
              <p style="color:#a1a1aa;font-size:16px;line-height:1.6;margin:0 0 30px;">
                Sua inscrição para o evento foi confirmada! Aqui estão os detalhes:
              </p>
              <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:24px;margin:0 0 30px;">
                <h2 style="color:#ec4899;font-size:20px;margin:0 0 20px;">{{event_name}}</h2>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.1);">
                      <span style="color:#71717a;font-size:14px;">📆 Data:</span>
                      <span style="color:#fff;font-size:14px;float:right;">{{event_date}}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.1);">
                      <span style="color:#71717a;font-size:14px;">🕐 Horário:</span>
                      <span style="color:#fff;font-size:14px;float:right;">{{event_time}}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0;">
                      <span style="color:#71717a;font-size:14px;">📍 Local:</span>
                      <span style="color:#fff;font-size:14px;float:right;">{{event_location}}</span>
                    </td>
                  </tr>
                </table>
              </div>
              <div style="text-align:center;">
                <a href="{{event_url}}" style="display:inline-block;background:linear-gradient(135deg,#8b5cf6,#6366f1);color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:16px;margin:0 10px 10px 0;">
                  Acessar Evento
                </a>
                <a href="{{calendar_url}}" style="display:inline-block;background:transparent;border:1px solid rgba(255,255,255,0.2);color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:16px;">
                  📅 Adicionar ao Calendário
                </a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  },
  {
    id: 'onboarding_series_1',
    name: 'Onboarding - Dia 1',
    description: 'Primeiro e-mail da série de onboarding',
    category: 'Onboarding',
    icon: BookOpen,
    subject: 'Bem-vindo! Comece aqui 🚀',
    variables: ['user_name', 'company_name', 'step1_url', 'help_url'],
    html_content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#1a1a2e 0%,#16162a 100%);border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:50px 40px;text-align:center;">
              <div style="display:inline-block;background:linear-gradient(135deg,#ec4899,#8b5cf6);width:60px;height:60px;border-radius:50%;line-height:60px;font-size:24px;color:#fff;font-weight:bold;margin:0 0 20px;">1</div>
              <h1 style="color:#fff;font-size:26px;margin:0 0 15px;">Bem-vindo à {{company_name}}! 🚀</h1>
              <p style="color:#a1a1aa;font-size:16px;line-height:1.6;margin:0 0 30px;">
                Olá {{user_name}}, estamos muito felizes em ter você aqui! Este é o primeiro e-mail de uma série para te ajudar a começar.
              </p>
              <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:24px;margin:0 0 30px;text-align:left;">
                <h3 style="color:#fff;font-size:16px;margin:0 0 15px;">📋 O que você vai aprender:</h3>
                <ul style="color:#a1a1aa;font-size:14px;line-height:1.8;margin:0;padding:0 0 0 20px;">
                  <li><span style="color:#22c55e;">✓</span> Dia 1: Configuração inicial (este e-mail)</li>
                  <li>Dia 3: Recursos avançados</li>
                  <li>Dia 5: Dicas de especialistas</li>
                  <li>Dia 7: Próximos passos</li>
                </ul>
              </div>
              <a href="{{step1_url}}" style="display:inline-block;background:linear-gradient(135deg,#ec4899,#8b5cf6);color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:16px;">
                Começar Configuração
              </a>
              <p style="color:#71717a;font-size:13px;margin:30px 0 0;">
                Precisa de ajuda? <a href="{{help_url}}" style="color:#ec4899;text-decoration:none;">Fale conosco</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  },
  {
    id: 'onboarding_series_2',
    name: 'Onboarding - Dia 3',
    description: 'Segundo e-mail da série de onboarding',
    category: 'Onboarding',
    icon: BookOpen,
    subject: 'Descubra recursos avançados 💡',
    variables: ['user_name', 'feature1_name', 'feature1_description', 'feature2_name', 'feature2_description', 'features_url'],
    html_content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#1a1a2e 0%,#16162a 100%);border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:50px 40px;text-align:center;">
              <div style="display:inline-block;background:linear-gradient(135deg,#ec4899,#8b5cf6);width:60px;height:60px;border-radius:50%;line-height:60px;font-size:24px;color:#fff;font-weight:bold;margin:0 0 20px;">2</div>
              <h1 style="color:#fff;font-size:26px;margin:0 0 15px;">Recursos que vão te surpreender 💡</h1>
              <p style="color:#a1a1aa;font-size:16px;line-height:1.6;margin:0 0 30px;">
                Olá {{user_name}}, agora que você já começou, veja recursos avançados que podem turbinar seus resultados:
              </p>
              <div style="background:rgba(236,72,153,0.1);border:1px solid rgba(236,72,153,0.2);border-radius:12px;padding:24px;margin:0 0 15px;text-align:left;">
                <h3 style="color:#ec4899;font-size:16px;margin:0 0 10px;">🎯 {{feature1_name}}</h3>
                <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0;">{{feature1_description}}</p>
              </div>
              <div style="background:rgba(139,92,246,0.1);border:1px solid rgba(139,92,246,0.2);border-radius:12px;padding:24px;margin:0 0 30px;text-align:left;">
                <h3 style="color:#8b5cf6;font-size:16px;margin:0 0 10px;">⚡ {{feature2_name}}</h3>
                <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0;">{{feature2_description}}</p>
              </div>
              <a href="{{features_url}}" style="display:inline-block;background:linear-gradient(135deg,#ec4899,#8b5cf6);color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:16px;">
                Ver Todos os Recursos
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  },
  {
    id: 'onboarding_series_3',
    name: 'Onboarding - Dia 7',
    description: 'Terceiro e-mail da série de onboarding',
    category: 'Onboarding',
    icon: BookOpen,
    subject: 'Você está indo muito bem! 🏆',
    variables: ['user_name', 'achievement', 'next_step', 'upgrade_url', 'community_url'],
    html_content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#1a1a2e 0%,#16162a 100%);border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:50px 40px;text-align:center;">
              <p style="font-size:60px;margin:0 0 20px;">🏆</p>
              <h1 style="color:#fff;font-size:26px;margin:0 0 15px;">Parabéns, {{user_name}}!</h1>
              <p style="color:#a1a1aa;font-size:16px;line-height:1.6;margin:0 0 20px;">
                Você completou a primeira semana e já alcançou:
              </p>
              <div style="background:linear-gradient(135deg,rgba(34,197,94,0.15),rgba(16,185,129,0.15));border:1px solid rgba(34,197,94,0.3);border-radius:12px;padding:24px;margin:0 0 30px;">
                <p style="color:#22c55e;font-size:24px;font-weight:700;margin:0;">{{achievement}}</p>
              </div>
              <p style="color:#a1a1aa;font-size:16px;line-height:1.6;margin:0 0 30px;">
                <strong style="color:#fff;">Próximo passo sugerido:</strong><br>{{next_step}}
              </p>
              <div style="margin:0 0 20px;">
                <a href="{{upgrade_url}}" style="display:inline-block;background:linear-gradient(135deg,#ec4899,#8b5cf6);color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:16px;margin:0 10px 10px 0;">
                  Desbloquear Mais Recursos
                </a>
              </div>
              <p style="color:#71717a;font-size:14px;margin:0;">
                Ou <a href="{{community_url}}" style="color:#ec4899;text-decoration:none;">junte-se à nossa comunidade</a> para trocar experiências
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  },
];
interface EmailTemplateLibraryProps {
  onSelectTemplate: (template: EmailTemplate) => void;
}

const EmailTemplateLibrary = ({ onSelectTemplate }: EmailTemplateLibraryProps) => {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const categories = [...new Set(TEMPLATE_LIBRARY.map(t => t.category))];

  const handlePreview = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setPreviewOpen(true);
  };

  const handleCustomize = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    const initialValues: Record<string, string> = {};
    template.variables.forEach(v => {
      initialValues[v] = `{{${v}}}`;
    });
    setVariableValues(initialValues);
    setCustomizeOpen(true);
  };

  const handleUseTemplate = () => {
    if (selectedTemplate) {
      let html = selectedTemplate.html_content;
      let subject = selectedTemplate.subject;
      
      Object.entries(variableValues).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        html = html.replace(regex, value);
        subject = subject.replace(regex, value);
      });

      onSelectTemplate({
        ...selectedTemplate,
        html_content: html,
        subject: subject,
      });

      setCustomizeOpen(false);
      toast({
        title: 'Template selecionado!',
        description: 'O template foi carregado no editor.',
      });
    }
  };

  const getProcessedHtml = () => {
    if (!selectedTemplate) return '';
    let html = selectedTemplate.html_content;
    Object.entries(variableValues).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, value || `{{${key}}}`);
    });
    return html;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Biblioteca de Templates</h3>
        <p className="text-sm text-muted-foreground">
          Escolha um template pronto e personalize rapidamente
        </p>
      </div>

      {categories.map((category) => (
        <div key={category} className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {category}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TEMPLATE_LIBRARY.filter(t => t.category === category).map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-card border-border hover:border-primary/50 transition-all group cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <template.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-foreground truncate">{template.name}</h5>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {template.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handlePreview(template)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-primary hover:bg-primary/90"
                        onClick={() => handleCustomize(template)}
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Usar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      ))}

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="bg-card border-border max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              {selectedTemplate && <selectedTemplate.icon className="w-5 h-5 text-primary" />}
              {selectedTemplate?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto bg-muted/30 rounded-lg p-4">
            <div 
              className="bg-white rounded-lg shadow-lg overflow-hidden"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedTemplate?.html_content || '') }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Fechar
            </Button>
            <Button onClick={() => { setPreviewOpen(false); handleCustomize(selectedTemplate!); }}>
              <Copy className="w-4 h-4 mr-2" />
              Usar Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customize Dialog */}
      <Dialog open={customizeOpen} onOpenChange={setCustomizeOpen}>
        <DialogContent className="bg-card border-border max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Personalizar Template: {selectedTemplate?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
            {/* Variables Form */}
            <div className="space-y-4 overflow-auto pr-2">
              <h4 className="font-medium text-foreground">Variáveis</h4>
              {selectedTemplate?.variables.map((variable) => (
                <div key={variable} className="space-y-2">
                  <Label className="text-sm text-foreground">
                    {variable.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Label>
                  <Input
                    value={variableValues[variable] || ''}
                    onChange={(e) => setVariableValues({ ...variableValues, [variable]: e.target.value })}
                    placeholder={`Digite o valor para ${variable}`}
                    className="bg-muted/50 border-border"
                  />
                </div>
              ))}
            </div>
            {/* Live Preview */}
            <div className="overflow-auto bg-muted/30 rounded-lg p-4">
              <h4 className="font-medium text-foreground mb-4">Preview ao Vivo</h4>
              <div 
                className="bg-white rounded-lg shadow-lg overflow-hidden transform scale-[0.8] origin-top-left"
                style={{ width: '125%' }}
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(getProcessedHtml()) }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomizeOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUseTemplate} className="bg-primary hover:bg-primary/90">
              <Check className="w-4 h-4 mr-2" />
              Aplicar Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmailTemplateLibrary;
