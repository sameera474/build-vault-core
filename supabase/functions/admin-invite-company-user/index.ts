import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: corsHeaders });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const jwt = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    if (!jwt) return json({ error: "Missing Authorization header" }, 401);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !ANON_KEY || !SERVICE_KEY) {
      return json({ error: "Missing Supabase environment variables" }, 500);
    }

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Check caller role
    const { data: authUser } = await userClient.auth.getUser();
    if (!authUser?.user) return json({ error: "Not authenticated" }, 401);

    const { data: me, error: meErr } = await userClient
      .from("profiles")
      .select("is_super_admin")
      .eq("user_id", authUser.user.id)
      .single();

    if (meErr || !me || !me.is_super_admin) {
      return json({ error: "Only super_admin can use this endpoint" }, 403);
    }

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const { company_id, email, role, name, phone, job_title, department } = body;

    if (!company_id || !email || !role) {
      return json({ error: "company_id, email, and role are required" }, 400);
    }

    console.log("Inviting user:", { company_id, email, role, name });

    // Create auth user (no password -> magic link flow)
    const { data: newUser, error: signUpErr } = await admin.auth.admin.createUser({
      email,
      email_confirm: false,
      user_metadata: { name: name || email }
    });

    if (signUpErr) {
      console.error("Error creating auth user:", signUpErr);
      return json({ error: signUpErr.message }, 500);
    }

    if (!newUser.user) {
      return json({ error: "Failed to create user" }, 500);
    }

    // Create profile for that company
    const profileData = {
      user_id: newUser.user.id,
      company_id,
      role,
      name: name || email,
      phone: phone || null,
      job_title: job_title || null,
      department: department || null,
      is_active: true
    };

    const { error: profErr } = await admin
      .from("profiles")
      .insert(profileData);

    if (profErr) {
      console.error("Error creating profile:", profErr);
      // Clean up auth user if profile creation fails
      await admin.auth.admin.deleteUser(newUser.user.id);
      return json({ error: profErr.message }, 500);
    }

    console.log("User invited successfully:", newUser.user.id);

    return json({ 
      ok: true, 
      user_id: newUser.user.id,
      email: newUser.user.email
    }, 200);
  } catch (e) {
    console.error("admin-invite-company-user error:", e);
    return json({ error: "Internal error", details: String(e) }, 500);
  }
});