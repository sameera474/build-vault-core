// Accept team invitation edge function
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AcceptRequest { token: string }

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const authHeader = req.headers.get('Authorization') ?? '';

  // User-scoped client to read auth user
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  // Admin client for cross-tenant writes
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    const { token } = (await req.json()) as AcceptRequest;
    if (!token) {
      return new Response(JSON.stringify({ error: 'Missing token' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized. Please sign in first.' }), { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    // Load invitation
    const { data: invite, error: invErr } = await admin
      .from('team_invitations')
      .select('id, company_id, role, invitation_token, accepted_at, expires_at, email')
      .eq('invitation_token', token)
      .maybeSingle();

    if (invErr) throw invErr;
    if (!invite) {
      return new Response(JSON.stringify({ error: 'Invitation not found.' }), { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    if (invite.accepted_at) {
      return new Response(JSON.stringify({ error: 'Invitation already accepted.' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'Invitation has expired.' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    // Upsert profile
    const { data: existingProfile } = await admin
      .from('profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    const profilePayload: any = {
      user_id: user.id,
      company_id: invite.company_id,
      role: invite.role,
      tenant_role: invite.role,
      is_super_admin: false,
      name: user.user_metadata?.name ?? null,
    };

    let profErr;
    if (existingProfile) {
      const { error } = await admin
        .from('profiles')
        .update(profilePayload)
        .eq('user_id', user.id);
      profErr = error;
    } else {
      const { error } = await admin
        .from('profiles')
        .insert(profilePayload);
      profErr = error;
    }
    if (profErr) throw profErr;

    // Mark invitation as accepted
    const { error: updErr } = await admin
      .from('team_invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invite.id);
    if (updErr) throw updErr;

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  } catch (err: any) {
    console.error('accept-team-invitation error', err);
    return new Response(JSON.stringify({ error: err.message || 'Unknown error' }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }
});