import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CampaignEmailRequest {
  to: string;
  subject: string;
  html: string;
  campaignId?: string;
  useBrevo?: boolean;
}

// Dangerous HTML patterns that could enable XSS or phishing
const DANGEROUS_HTML_PATTERNS = [
  /<script\b[^>]*>[\s\S]*?<\/script>/gi,
  /<object\b[^>]*>[\s\S]*?<\/object>/gi,
  /<embed\b[^>]*>/gi,
  /<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi,
  /\bon\w+\s*=/gi,  // Event handlers like onclick, onerror, onload
  /javascript:/gi,
  /vbscript:/gi,
  /data:text\/html/gi,
];

// Validate email HTML for dangerous content
function validateEmailHtml(html: string): { valid: boolean; reason?: string } {
  for (const pattern of DANGEROUS_HTML_PATTERNS) {
    if (pattern.test(html)) {
      return { valid: false, reason: `Template contains dangerous content: ${pattern.source}` };
    }
  }
  return { valid: true };
}

// Send email via Resend API
async function sendWithResend(to: string, subject: string, html: string): Promise<{ success: boolean; id?: string; error?: string }> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  
  if (!apiKey) {
    console.error("RESEND_API_KEY not configured");
    return { success: false, error: "RESEND_API_KEY não configurada" };
  }

  console.log(`[Resend] Sending email to: ${to}`);

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: "SKY BRASIL <noreply@skystreamer.online>",
      to: [to],
      subject: subject,
      html: html,
    });

    if (error) {
      console.error("[Resend] Error:", error);
      return { success: false, error: error.message || "Erro Resend desconhecido" };
    }

    console.log("[Resend] Success:", data);
    return { success: true, id: data?.id };
  } catch (err: any) {
    console.error("[Resend] Exception:", err);
    return { success: false, error: err.message || "Exceção Resend" };
  }
}

// Send email via Brevo API (fallback)
async function sendWithBrevo(to: string, subject: string, html: string): Promise<{ success: boolean; id?: string; error?: string }> {
  const apiKey = Deno.env.get("BREVO_API_KEY");
  
  if (!apiKey) {
    console.error("BREVO_API_KEY not configured");
    return { success: false, error: "BREVO_API_KEY não configurada" };
  }

  console.log(`[Brevo] Sending email to: ${to}`);

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: "SKY BRASIL",
          email: "noreply@skystreamer.online",
        },
        to: [{ email: to }],
        subject: subject,
        htmlContent: html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[Brevo] Error response:", data);
      return { success: false, error: data.message || `Erro Brevo: ${response.status}` };
    }

    console.log("[Brevo] Success:", data);
    return { success: true, id: data.messageId };
  } catch (err: any) {
    console.error("[Brevo] Exception:", err);
    return { success: false, error: err.message || "Exceção Brevo" };
  }
}

// Verify admin authentication
async function verifyAdminAuth(req: Request): Promise<{ success: boolean; userId?: string; error?: string }> {
  const authHeader = req.headers.get("Authorization");
  
  if (!authHeader) {
    return { success: false, error: "Authorization header required" };
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error("[Auth] Invalid token:", authError);
      return { success: false, error: "Invalid authentication token" };
    }

    // Check if user has admin role
    const { data: roles, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (roleError || !roles) {
      console.error("[Auth] User is not admin:", user.id);
      return { success: false, error: "Admin access required" };
    }

    return { success: true, userId: user.id };
  } catch (err: any) {
    console.error("[Auth] Exception:", err);
    return { success: false, error: "Authentication failed" };
  }
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin authentication
    const authResult = await verifyAdminAuth(req);
    if (!authResult.success) {
      console.error("[send-campaign-email] Auth failed:", authResult.error);
      return new Response(
        JSON.stringify({ error: authResult.error }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[send-campaign-email] Authorized admin: ${authResult.userId}`);

    const { to, subject, html, campaignId, useBrevo = false }: CampaignEmailRequest = await req.json();

    console.log(`Campaign email request - to: ${to}, subject: ${subject}, useBrevo: ${useBrevo}`);

    // Validate required fields
    if (!to || !subject || !html) {
      console.error("Missing required fields:", { to: !!to, subject: !!subject, html: !!html });
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios: to, subject, html" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate HTML content for security
    const htmlValidation = validateEmailHtml(html);
    if (!htmlValidation.valid) {
      console.error("[Security] Dangerous HTML detected:", htmlValidation.reason);
      return new Response(
        JSON.stringify({ error: "Template contém conteúdo não permitido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!emailRegex.test(to)) {
      console.error("Invalid email format:", to);
      return new Response(
        JSON.stringify({ error: "Email inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let result: { success: boolean; id?: string; error?: string };

    // Try primary provider first
    if (useBrevo) {
      result = await sendWithBrevo(to, subject, html);
      // Fallback to Resend if Brevo fails
      if (!result.success) {
        console.log("[Fallback] Brevo failed, trying Resend...");
        result = await sendWithResend(to, subject, html);
      }
    } else {
      result = await sendWithResend(to, subject, html);
      // Fallback to Brevo if Resend fails
      if (!result.success) {
        console.log("[Fallback] Resend failed, trying Brevo...");
        result = await sendWithBrevo(to, subject, html);
      }
    }

    if (!result.success) {
      console.error("Both providers failed:", result.error);
      return new Response(
        JSON.stringify({ error: result.error || "Falha ao enviar email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log the email event if campaignId is provided
    if (campaignId) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        await supabase.from("email_events").insert({
          campaign_id: campaignId,
          recipient_email: to,
          event_type: "sent",
          metadata: { provider_id: result.id, sent_by: authResult.userId },
        });
        
        console.log("Email event logged for campaign:", campaignId);
      } catch (logError) {
        console.error("Error logging email event:", logError);
        // Don't fail the request if logging fails
      }
    }

    console.log("Email sent successfully to:", to);

    return new Response(
      JSON.stringify({ success: true, id: result.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Campaign email error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
