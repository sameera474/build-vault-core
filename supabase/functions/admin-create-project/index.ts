import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create user-scoped client to verify permissions
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    // Create service role client for admin operations
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify user is authenticated and is super admin
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is super admin
    const { data: profile, error: profileError } = await userClient
      .from("profiles")
      .select("is_super_admin")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile?.is_super_admin) {
      console.error('Permission error:', profileError);
      return new Response(JSON.stringify({ error: "Only super admin can use this endpoint" }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const body = await req.json();
    const {
      company_id,
      name,
      contract_number,
      contractor_name,
      contractor_logo,
      client_name,
      client_logo,
      consultant_name,
      consultant_logo,
      start_date,
      end_date,
      location,
      description,
      project_prefix,
      region_code,
      lab_code
    } = body;

    // Validate required fields
    if (!company_id || !name) {
      return new Response(JSON.stringify({ error: "Missing required fields: company_id, name" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Super admin creating project for company:', company_id);

    // Insert project using service role (bypasses RLS)
    const { data: project, error: insertError } = await adminClient
      .from("projects")
      .insert({
        company_id,
        name,
        contract_number: contract_number || null,
        contractor_name: contractor_name || null,
        contractor_logo: contractor_logo || null,
        client_name: client_name || null,
        client_logo: client_logo || null,
        consultant_name: consultant_name || null,
        consultant_logo: consultant_logo || null,
        start_date: start_date || null,
        end_date: end_date || null,
        location: location || null,
        description: description || null,
        project_prefix: project_prefix || "PU2",
        region_code: region_code || "R1",
        lab_code: lab_code || "LAB",
        created_by: user.id,
        status: 'active'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(JSON.stringify({ error: "Failed to create project", details: insertError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Project created successfully:', project.id);

    return new Response(JSON.stringify({ success: true, project }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(JSON.stringify({ error: "Internal server error", details: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});