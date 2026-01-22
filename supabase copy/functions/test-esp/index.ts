import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestESPRequest {
  configId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { configId }: TestESPRequest = await req.json();

    if (!configId) {
      return new Response(
        JSON.stringify({ error: "configId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch ESP configuration
    const { data: config, error: configError } = await supabase
      .from("esp_configurations")
      .select("*")
      .eq("id", configId)
      .single();

    if (configError || !config) {
      console.error("Error fetching ESP config:", configError);
      return new Response(
        JSON.stringify({ error: "ESP configuration not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const espConfig = config.config as Record<string, string>;
    let testResult = { success: false, message: "" };

    switch (config.provider) {
      case "resend":
        testResult = await testResend(espConfig);
        break;
      case "brevo":
        testResult = await testBrevo(espConfig);
        break;
      case "sendgrid":
        testResult = await testSendGrid(espConfig);
        break;
      case "mailgun":
        testResult = await testMailgun(espConfig);
        break;
      case "amazon_ses":
        testResult = await testAmazonSES(espConfig);
        break;
      case "mailersend":
        testResult = await testMailerSend(espConfig);
        break;
      case "smtp":
        testResult = await testSMTP(espConfig);
        break;
      default:
        testResult = { success: false, message: "Unknown provider" };
    }

    console.log(`ESP test result for ${config.provider}:`, testResult);

    return new Response(
      JSON.stringify(testResult),
      {
        status: testResult.success ? 200 : 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error testing ESP:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

async function testResend(config: Record<string, string>) {
  try {
    // Test API connectivity
    const domainsResponse = await fetch("https://api.resend.com/domains", {
      method: "GET",
      headers: { Authorization: `Bearer ${config.api_key}` },
    });

    if (!domainsResponse.ok) {
      const error = await domainsResponse.text();
      return { success: false, message: `Resend API error: ${error}` };
    }

    const domains = await domainsResponse.json();
    console.log("Resend domains:", JSON.stringify(domains, null, 2));

    // Check domain verification status
    const domainDetails: string[] = [];
    if (domains.data && Array.isArray(domains.data)) {
      for (const domain of domains.data) {
        const status = domain.status || "unknown";
        const name = domain.name || "unknown";
        const records = domain.records || [];
        
        let recordStatus = "";
        if (records.length > 0) {
          const spf = records.find((r: any) => r.type === "TXT" && r.name.includes("spf"));
          const dkim = records.find((r: any) => r.type === "TXT" && r.name.includes("resend"));
          const mx = records.find((r: any) => r.type === "MX");
          
          recordStatus = ` [SPF: ${spf?.status || "missing"}, DKIM: ${dkim?.status || "missing"}, MX: ${mx?.status || "optional"}]`;
        }
        
        domainDetails.push(`${name}: ${status}${recordStatus}`);
      }
    }

    const domainInfo = domainDetails.length > 0 
      ? `\n📧 Domains: ${domainDetails.join(", ")}` 
      : "\n⚠️ No domains configured";

    return { 
      success: true, 
      message: `Resend API connection successful${domainInfo}`,
      domains: domains.data || []
    };
  } catch (e) {
    return { success: false, message: `Resend connection failed: ${e}` };
  }
}

async function testBrevo(config: Record<string, string>) {
  try {
    // Test account endpoint
    const accountResponse = await fetch("https://api.brevo.com/v3/account", {
      method: "GET",
      headers: {
        "api-key": config.api_key,
        "Content-Type": "application/json",
      },
    });

    if (!accountResponse.ok) {
      const error = await accountResponse.text();
      return { success: false, message: `Brevo API error: ${error}` };
    }

    const account = await accountResponse.json();
    console.log("Brevo account:", JSON.stringify(account, null, 2));

    // Check senders/domains
    const sendersResponse = await fetch("https://api.brevo.com/v3/senders", {
      method: "GET",
      headers: {
        "api-key": config.api_key,
        "Content-Type": "application/json",
      },
    });

    let senderInfo = "";
    if (sendersResponse.ok) {
      const senders = await sendersResponse.json();
      console.log("Brevo senders:", JSON.stringify(senders, null, 2));
      
      if (senders.senders && senders.senders.length > 0) {
        const activeSenders = senders.senders.filter((s: any) => s.active);
        senderInfo = `\n📧 Active senders: ${activeSenders.map((s: any) => `${s.email} (${s.name})`).join(", ")}`;
      }
    }

    const planInfo = account.plan ? `\n📊 Plan: ${account.plan[0]?.type || "Unknown"}` : "";
    const creditsInfo = account.plan && account.plan[0]?.credits 
      ? `\n💳 Credits: ${account.plan[0].credits}` 
      : "";

    return { 
      success: true, 
      message: `Brevo API connection successful${planInfo}${creditsInfo}${senderInfo}`,
      account
    };
  } catch (e) {
    return { success: false, message: `Brevo connection failed: ${e}` };
  }
}

async function testSendGrid(config: Record<string, string>) {
  try {
    const response = await fetch("https://api.sendgrid.com/v3/user/account", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${config.api_key}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      return { success: true, message: "SendGrid API connection successful" };
    }
    const error = await response.text();
    return { success: false, message: `SendGrid API error: ${error}` };
  } catch (e) {
    return { success: false, message: `SendGrid connection failed: ${e}` };
  }
}

async function testMailgun(config: Record<string, string>) {
  try {
    const domain = config.domain || "";
    const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${btoa(`api:${config.api_key}`)}`,
      },
    });

    // Mailgun returns 400 for GET on messages endpoint but confirms auth
    if (response.status === 400 || response.ok) {
      return { success: true, message: "Mailgun API connection successful" };
    }
    const error = await response.text();
    return { success: false, message: `Mailgun API error: ${error}` };
  } catch (e) {
    return { success: false, message: `Mailgun connection failed: ${e}` };
  }
}

async function testAmazonSES(config: Record<string, string>) {
  // For SES, we'd need AWS SDK - simplified check
  if (config.access_key_id && config.secret_access_key && config.region) {
    return { success: true, message: "Amazon SES credentials configured (full test requires AWS SDK)" };
  }
  return { success: false, message: "Missing required SES credentials" };
}

async function testMailerSend(config: Record<string, string>) {
  try {
    const response = await fetch("https://api.mailersend.com/v1/email", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${config.api_key}`,
        "Content-Type": "application/json",
      },
    });

    // MailerSend returns 405 for GET but confirms auth
    if (response.status === 405 || response.ok) {
      return { success: true, message: "MailerSend API connection successful" };
    }
    const error = await response.text();
    return { success: false, message: `MailerSend API error: ${error}` };
  } catch (e) {
    return { success: false, message: `MailerSend connection failed: ${e}` };
  }
}

async function testSMTP(config: Record<string, string>) {
  const host = config.host || "";
  const port = config.port || "587";
  const username = config.username || "";
  const password = config.password || "";
  const secure = config.secure === "true";

  // Validate required fields
  if (!host || !username || !password) {
    return { 
      success: false, 
      message: "Missing required SMTP configuration (host, username, or password)" 
    };
  }

  // Build config summary
  const configSummary = [
    `🖥️ Host: ${host}`,
    `🔌 Port: ${port}`,
    `👤 User: ${username}`,
    `🔒 TLS/SSL: ${secure ? "Enabled" : "Disabled"}`,
  ].join("\n");

  // For SMTP, we can't easily test the connection without actually sending
  // But we can validate the configuration format
  const commonSMTPHosts: Record<string, string> = {
    "smtp-relay.brevo.com": "Brevo SMTP",
    "smtp.gmail.com": "Gmail SMTP",
    "smtp.sendgrid.net": "SendGrid SMTP",
    "smtp.mailgun.org": "Mailgun SMTP",
    "email-smtp.us-east-1.amazonaws.com": "Amazon SES SMTP",
    "smtp.mailersend.net": "MailerSend SMTP",
  };

  const hostProvider = commonSMTPHosts[host] || "Custom SMTP";

  return { 
    success: true, 
    message: `SMTP configuration validated\n📧 Provider: ${hostProvider}\n${configSummary}\n\n⚠️ Note: Full connection test requires sending a test email.`
  };
}

serve(handler);
