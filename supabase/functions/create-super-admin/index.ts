import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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

    const { email, password, name } = await req.json();

    console.log('Creating/updating super admin user:', email);

    // Check if auth user exists
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      return new Response(
        JSON.stringify({ error: listError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const existingAuthUser = users?.find(u => u.email === email);
    let userId: string;

    if (existingAuthUser) {
      console.log('Auth user exists, updating metadata:', existingAuthUser.id);
      userId = existingAuthUser.id;
      
      // Update user metadata
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        {
          user_metadata: {
            name,
            is_super_admin: true,
            role: 'super_admin'
          }
        }
      );

      if (updateError) {
        console.error('Error updating user metadata:', updateError);
      }
    } else {
      console.log('Creating new auth user');
      // Create auth user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          name,
          is_super_admin: true,
          role: 'super_admin'
        }
      });

      if (authError) {
        console.error('Auth error:', authError);
        return new Response(
          JSON.stringify({ error: authError.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      userId = authData.user.id;
    }

    // Create/update profile with super admin flag
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        user_id: userId,
        company_id: null,
        name,
        email,
        role: 'super_admin',
        is_super_admin: true,
        is_active: true
      }, {
        onConflict: 'user_id'
      });

    if (profileError) {
      console.error('Profile error:', profileError);
      return new Response(
        JSON.stringify({ error: profileError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Ensure user_roles entry exists
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .upsert({
        user_id: userId,
        role: 'super_admin'
      }, {
        onConflict: 'user_id,role'
      });

    if (roleError) {
      console.error('Role error:', roleError);
      return new Response(
        JSON.stringify({ error: roleError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('Super admin created successfully:', userId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        user_id: userId,
        message: 'Super admin created successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
