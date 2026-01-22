import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { token, userId } = await req.json();

    if (!token || !userId) {
      throw new Error("Token and userId are required");
    }

    // Find the invitation
    const { data: invitation, error: fetchError } = await supabase
      .from('admin_invitations')
      .select('*')
      .eq('token', token)
      .is('accepted_at', null)
      .single();

    if (fetchError || !invitation) {
      throw new Error("Convite inválido ou já utilizado");
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      throw new Error("Este convite expirou. Solicite um novo convite.");
    }

    // Assign the role to the user
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: userId,
        role: invitation.role
      }, { onConflict: 'user_id' });

    if (roleError) {
      console.error("Error assigning role:", roleError);
      throw new Error("Erro ao atribuir permissões");
    }

    // Mark invitation as accepted
    const { error: updateError } = await supabase
      .from('admin_invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitation.id);

    if (updateError) {
      console.error("Error updating invitation:", updateError);
    }

    // Log the action
    await supabase.from('admin_audit_log').insert({
      action: 'invite_accepted',
      admin_id: userId,
      details: {
        role: invitation.role,
        invited_by: invitation.invited_by,
        email: invitation.email
      }
    });

    console.log(`Invite accepted: ${invitation.email} as ${invitation.role}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        role: invitation.role,
        message: `Você agora é ${invitation.role} no painel SKY BRASIL!`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error accepting invite:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
