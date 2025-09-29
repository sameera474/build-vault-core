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
    const { company_id, user_id, updates } = body;

    if (!company_id || !user_id || !updates) {
      return json({ error: "company_id, user_id, and updates are required" }, 400);
    }

    console.log("Updating user:", { company_id, user_id, updates });

    // Ensure target user belongs to company_id
    const { data: target, error: tgtErr } = await admin
      .from("profiles")
      .select("company_id")
      .eq("user_id", user_id)
      .single();

    if (tgtErr || !target || target.company_id !== company_id) {
      console.error("Target user not in company:", { user_id, company_id, target });
      return json({ error: "Target user not found in specified company" }, 400);
    }

    // Filter updates to only include allowed fields
    const allowedFields = [
      'role', 'name', 'phone', 'job_title', 'department', 
      'employee_id', 'avatar_url', 'is_active'
    ];
    
    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .reduce((obj: any, key) => {
        obj[key] = updates[key];
        return obj;
      }, {});

    if (Object.keys(filteredUpdates).length === 0) {
      return json({ error: "No valid fields to update" }, 400);
    }

    // Add updated_at timestamp
    filteredUpdates.updated_at = new Date().toISOString();

    const { error } = await admin
      .from("profiles")
      .update(filteredUpdates)
      .eq("user_id", user_id);

    if (error) {
      console.error("Error updating user profile:", error);
      return json({ error: error.message }, 500);
    }

    console.log("User updated successfully:", user_id);

    return json({ ok: true }, 200);
  } catch (e) {
    console.error("admin-update-company-user error:", e);
    return json({ error: "Internal error", details: String(e) }, 500);
  }
});