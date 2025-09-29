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
    const { company_id } = body;

    if (!company_id) {
      return json({ error: "company_id required" }, 400);
    }

    console.log("Listing users for company:", company_id);

    // Fetch users for the specified company
    const { data, error } = await admin
      .from("profiles")
      .select(`
        user_id,
        company_id,
        role,
        name,
        phone,
        department,
        job_title,
        employee_id,
        avatar_url,
        is_active,
        created_at,
        updated_at
      `)
      .eq("company_id", company_id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching company users:", error);
      return json({ error: error.message }, 500);
    }

    console.log(`Found ${data?.length || 0} users for company ${company_id}`);

    return json({ ok: true, users: data || [] }, 200);
  } catch (e) {
    console.error("admin-list-company-users error:", e);
    return json({ error: "Internal error", details: String(e) }, 500);
  }
});