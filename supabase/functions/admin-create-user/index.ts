import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { email, password, role } = await req.json()

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'email and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Create the user with admin API
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm email
    })

    if (createError) {
      console.error('Error creating user:', createError)
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('User created successfully:', userData.user?.id)

    // If role is specified, add to user_roles table
    if (role && userData.user) {
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: userData.user.id,
          role: role
        })

      if (roleError) {
        console.error('Error assigning role:', roleError)
        // Don't fail the whole operation, user was created
      } else {
        console.log('Role assigned successfully:', role)
      }
    }

    // Add to admin_emails if admin role
    if (role === 'admin' && userData.user) {
      const { error: adminEmailError } = await supabaseAdmin
        .from('admin_emails')
        .insert({ email: email })

      if (adminEmailError && !adminEmailError.message.includes('duplicate')) {
        console.error('Error adding to admin_emails:', adminEmailError)
      }
    }

    // Update invitation status if exists
    const { error: inviteError } = await supabaseAdmin
      .from('admin_invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('email', email)

    if (inviteError) {
      console.log('No invitation to update or error:', inviteError.message)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User created successfully',
        user_id: userData.user?.id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
