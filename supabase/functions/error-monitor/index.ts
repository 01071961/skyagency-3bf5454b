import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ErrorReport {
  type: 'payment' | 'email' | 'auth' | 'chat' | 'general';
  message: string;
  context?: Record<string, unknown>;
  userId?: string;
  retryable?: boolean;
}

interface AutoFixResult {
  fixed: boolean;
  action?: string;
  details?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(
      JSON.stringify({ error: "Missing configuration" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { action, error: errorReport }: { action: string; error?: ErrorReport } = await req.json();

    // Health check endpoint
    if (action === 'health') {
      const checks = {
        database: false,
        email: !!RESEND_API_KEY,
        timestamp: new Date().toISOString()
      };

      // Test database connection
      const { error: dbError } = await supabase.from('profiles').select('count').limit(1);
      checks.database = !dbError;

      return new Response(
        JSON.stringify({ status: 'ok', checks }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Report and auto-fix error
    if (action === 'report' && errorReport) {
      console.log(`[ERROR-MONITOR] Received error report: ${errorReport.type}`, errorReport);

      // Log the error
      await supabase.from('admin_audit_log').insert({
        action: `error_${errorReport.type}`,
        details: {
          message: errorReport.message,
          context: errorReport.context,
          timestamp: new Date().toISOString()
        },
        admin_id: errorReport.userId || null
      });

      // Attempt auto-fix based on error type
      const fixResult = await attemptAutoFix(errorReport, supabase, RESEND_API_KEY);

      // Notify admins if critical and not fixed
      if (!fixResult.fixed && ['payment', 'auth'].includes(errorReport.type)) {
        await notifyAdmins(errorReport, supabase, RESEND_API_KEY);
      }

      return new Response(
        JSON.stringify({ 
          received: true, 
          autoFix: fixResult,
          logged: true
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get error statistics
    if (action === 'stats') {
      const { data: recentErrors } = await supabase
        .from('admin_audit_log')
        .select('action, created_at, details')
        .like('action', 'error_%')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      const errorCounts: Record<string, number> = {};
      recentErrors?.forEach(e => {
        const type = e.action.replace('error_', '');
        errorCounts[type] = (errorCounts[type] || 0) + 1;
      });

      return new Response(
        JSON.stringify({ 
          last24h: recentErrors?.length || 0,
          byType: errorCounts,
          recent: recentErrors?.slice(0, 10)
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[ERROR-MONITOR] Internal error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function attemptAutoFix(
  error: ErrorReport, 
  supabase: any,
  resendKey?: string
): Promise<AutoFixResult> {
  console.log(`[AUTO-FIX] Attempting fix for: ${error.type}`);

  switch (error.type) {
    case 'email':
      // Retry email sending
      if (error.retryable && error.context?.emailData && resendKey) {
        try {
          const emailData = error.context.emailData as { to: string; subject: string; html: string };
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${resendKey}`,
            },
            body: JSON.stringify({
              from: "SKY BRASIL <noreply@skystreamer.online>",
              ...emailData
            }),
          });
          
          if (res.ok) {
            console.log("[AUTO-FIX] Email retry successful");
            return { fixed: true, action: 'email_retry', details: 'Email reenviado com sucesso' };
          }
        } catch (e) {
          console.error("[AUTO-FIX] Email retry failed:", e);
        }
      }
      return { fixed: false, action: 'email_retry_failed' };

    case 'auth':
      // Clear stale sessions or tokens
      if (error.context?.userId) {
        console.log("[AUTO-FIX] Auth error - logged for manual review");
        return { fixed: false, action: 'auth_logged', details: 'Requer revisão manual' };
      }
      return { fixed: false };

    case 'chat':
      // Attempt to reconnect or clear stuck conversations
      if (error.context?.conversationId) {
        const { error: updateError } = await supabase
          .from('chat_conversations')
          .update({ 
            is_typing_visitor: false, 
            is_typing_admin: false,
            last_activity_at: new Date().toISOString()
          })
          .eq('id', error.context.conversationId);
        
        if (!updateError) {
          console.log("[AUTO-FIX] Chat state reset");
          return { fixed: true, action: 'chat_state_reset', details: 'Estado do chat resetado' };
        }
      }
      return { fixed: false };

    case 'payment':
      // Payment errors usually require manual review
      console.log("[AUTO-FIX] Payment error - requires manual review");
      return { fixed: false, action: 'payment_logged', details: 'Pagamento requer revisão manual' };

    default:
      return { fixed: false };
  }
}

async function notifyAdmins(
  error: ErrorReport,
  supabase: any,
  resendKey?: string
) {
  if (!resendKey) return;

  // Get admin emails
  const adminEmails = ['skyagencysc@gmail.com', 'elpenergia@gmail.com'];

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background: #0a0a0a; color: #fff; padding: 20px; }
    .alert { background: #7f1d1d; border: 1px solid #dc2626; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .details { background: #1e1e1e; padding: 16px; border-radius: 8px; margin-top: 16px; }
    code { background: #27272a; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
  </style>
</head>
<body>
  <h2>⚠️ Alerta de Erro Crítico</h2>
  <div class="alert">
    <p><strong>Tipo:</strong> ${error.type}</p>
    <p><strong>Mensagem:</strong> ${error.message}</p>
    <p><strong>Horário:</strong> ${new Date().toLocaleString('pt-BR')}</p>
  </div>
  <div class="details">
    <p><strong>Contexto:</strong></p>
    <code>${JSON.stringify(error.context, null, 2)}</code>
  </div>
  <p style="color: #71717a; font-size: 12px;">Este é um alerta automático do sistema de monitoramento.</p>
</body>
</html>
  `;

  for (const email of adminEmails) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: "SKY BRASIL Alertas <noreply@skystreamer.online>",
          to: [email],
          subject: `[ALERTA] Erro crítico: ${error.type}`,
          html: htmlContent,
        }),
      });
    } catch (e) {
      console.error(`Failed to notify admin ${email}:`, e);
    }
  }
}
