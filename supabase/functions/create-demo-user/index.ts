import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Authenticate the caller
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await callerClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const callerId = claimsData.claims.sub;

    // Verify caller is super admin
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('is_super_admin')
      .eq('user_id', callerId)
      .single();

    if (!callerProfile?.is_super_admin) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: only super admins can create demo users' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { email, password, name, role, tenant_role, company_name } = await req.json();

    console.log('Creating demo user:', { email, name, role, tenant_role, company_name });

    // Check if user already exists by checking profiles table
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('user_id')
      .eq('email', email)
      .single();
    
    if (existingProfile) {
      console.log('User already exists:', email);
      return new Response(
        JSON.stringify({ 
          error: 'User already exists',
          user_id: existingProfile.user_id 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get or create company
    let companyId: string;
    
    const { data: existingCompany } = await supabaseAdmin
      .from('companies')
      .select('id')
      .eq('name', company_name)
      .single();

    if (existingCompany) {
      companyId = existingCompany.id;
    } else {
      const { data: newCompany, error: companyError } = await supabaseAdmin
        .from('companies')
        .insert({
          name: company_name,
          description: `Demo company - ${company_name}`,
          country: 'South Africa',
          is_active: true,
        })
        .select()
        .single();

      if (companyError) {
        console.error('Error creating company:', companyError);
        throw companyError;
      }

      companyId = newCompany.id;
    }

    // Create auth user with confirmed email
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role },
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      throw authError;
    }

    // Create or update profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        user_id: authData.user.id,
        company_id: companyId,
        name,
        tenant_role: tenant_role,
        email,
        is_super_admin: false,
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      throw profileError;
    }

    // Insert role into user_roles table
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role: role,
      });

    if (roleError) {
      console.error('Error creating user role:', roleError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_id: authData.user.id,
        company_id: companyId,
        message: 'User created successfully',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in create-demo-user:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred while creating the user' }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
