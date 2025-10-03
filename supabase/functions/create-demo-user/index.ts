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
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { email, password, name, role, company_name } = await req.json();

    console.log('Creating demo user:', { email, name, role, company_name });

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
      console.log('Using existing company:', companyId);
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
      console.log('Created new company:', companyId);
    }

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role,
      },
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      throw authError;
    }

    console.log('Created auth user:', authData.user.id);

    // Create or update profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        user_id: authData.user.id,
        company_id: companyId,
        name,
        role: role, // Use the actual role from the request
        email,
        is_active: true,
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      throw profileError;
    }

    console.log('Created profile for user:', authData.user.id);

    // Insert role into user_roles table for RBAC system
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role: role, // This should match the app_role enum values
      });

    if (roleError) {
      console.error('Error creating user role:', roleError);
      // Don't throw - continue even if role insert fails
      console.log('Continuing despite role error...');
    } else {
      console.log('Created role entry for user:', authData.user.id, 'with role:', role);
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
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
