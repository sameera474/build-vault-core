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

    const payload = await req.json();
    const { action } = payload;

    if (action === 'delete_all') {
      // Delete all demo users
      const demoEmails = [
        'john.manager@alpha.com',
        'sarah.quality@alpha.com',
        'mike.tech@beta.com',
        'emily.admin@beta.com',
        'robert.supervisor@gamma.com'
      ];

      console.log('Deleting demo users...');

      for (const email of demoEmails) {
        // Get user_id from profiles
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('user_id')
          .eq('email', email)
          .maybeSingle();

        if (profile?.user_id) {
          // Delete from user_roles
          await supabaseAdmin
            .from('user_roles')
            .delete()
            .eq('user_id', profile.user_id);

          // Delete from profiles
          await supabaseAdmin
            .from('profiles')
            .delete()
            .eq('user_id', profile.user_id);

          // Delete auth user
          await supabaseAdmin.auth.admin.deleteUser(profile.user_id);

          console.log(`Deleted user: ${email}`);
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: 'All demo users deleted' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'fix_user') {
      const { email, correct_name, correct_role, correct_tenant_role, correct_department, correct_job_title, correct_company_name } = payload;

      console.log('Fixing user:', { email, correct_name, correct_role, correct_tenant_role, correct_department, correct_job_title, correct_company_name });

      // Get user from profiles
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('user_id, company_id')
        .eq('email', email)
        .maybeSingle();

      if (!profile) {
        throw new Error('User not found');
      }

      // Get or create the correct company
      let targetCompanyId = profile.company_id;
      
      if (correct_company_name) {
        const { data: company } = await supabaseAdmin
          .from('companies')
          .select('id')
          .eq('name', correct_company_name)
          .maybeSingle();

        if (company) {
          targetCompanyId = company.id;
        } else {
          // Create the company if it doesn't exist
          const { data: newCompany, error: companyError } = await supabaseAdmin
            .from('companies')
            .insert({
              name: correct_company_name,
              description: 'Demo company',
              country: 'South Africa',
              is_active: true
            })
            .select('id')
            .single();

          if (companyError) throw companyError;
          targetCompanyId = newCompany.id;
        }
      }

      // Confirm the user's email in auth system
      const { error: emailConfirmError } = await supabaseAdmin.auth.admin.updateUserById(
        profile.user_id,
        { email_confirm: true }
      );

      if (emailConfirmError) {
        console.error('Error confirming email:', emailConfirmError);
      }

      // Update profile
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
          name: correct_name,
          role: correct_role,
          tenant_role: correct_tenant_role,
          department: correct_department,
          job_title: correct_job_title,
          company_id: targetCompanyId,
          is_demo_user: true,
        })
        .eq('user_id', profile.user_id);

      if (profileError) throw profileError;

      // Delete existing role
      await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('user_id', profile.user_id);

      // Insert correct role
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: profile.user_id,
          role: correct_role,
        });

      if (roleError) throw roleError;

      console.log('Fixed user:', email);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Fixed user ${email}`,
          user_id: profile.user_id 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error in fix-demo-users:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
