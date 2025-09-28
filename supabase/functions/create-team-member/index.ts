import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface CreateMemberRequest {
  name: string;
  email: string;
  role: string; // tenant_role
  phone?: string;
  department?: string;
  avatar_url?: string;
}

const ALLOWED_ROLES = new Set([
  "admin",
  "project_manager",
  "quality_manager",
  "material_engineer",
  "technician",
  "consultant_engineer",
  "consultant_technician",
]);

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    // Client-scoped supabase (to read the caller)
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    // Admin client (service role) for privileged ops
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Identify caller
    const {
      data: { user },
      error: userError,
    } = await client.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Load caller profile to get company and permissions
    const { data: callerProfile, error: profileErr } = await admin
      .from("profiles")
      .select("user_id, company_id, tenant_role, is_super_admin")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileErr || !callerProfile) {
      return new Response(JSON.stringify({ error: "Caller profile not found" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const isAdmin = callerProfile.is_super_admin === true || callerProfile.tenant_role === "admin";
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: admin only" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Parse and validate request body
    const body = (await req.json()) as CreateMemberRequest;
    const email = (body.email || "").trim().toLowerCase();
    const name = (body.name || "").trim();
    const tenantRole = (body.role || "technician").trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    if (!name) {
      return new Response(JSON.stringify({ error: "Name is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    if (!ALLOWED_ROLES.has(tenantRole)) {
      return new Response(JSON.stringify({ error: "Invalid role" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Create auth user (email confirmed so they can login immediately)
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { name },
    });
    if (createErr || !created?.user) {
      console.error("createUser error", createErr);
      return new Response(JSON.stringify({ error: createErr?.message || "Failed to create user" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const newUserId = created.user.id;

    // Update the automatically created profile (from trigger) with the correct company and details
    const { error: profileUpdateErr } = await admin.from("profiles").update({
      company_id: callerProfile.company_id,
      name,
      role: "admin", // legacy field kept as in schema, real perms via tenant_role
      tenant_role: tenantRole,
      phone: body.phone || null,
      department: body.department || null,
      avatar_url: body.avatar_url || null,
    }).eq("user_id", newUserId);

    if (profileUpdateErr) {
      console.error("profile update error", profileUpdateErr);
      return new Response(JSON.stringify({ error: profileUpdateErr.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(
      JSON.stringify({ ok: true, user_id: newUserId }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (e: any) {
    console.error("create-team-member error", e);
    return new Response(JSON.stringify({ error: e?.message || "Unexpected error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
