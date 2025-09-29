import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: corsHeaders });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace("Bearer ", "");
    if (!jwt) return json({ error: "Missing Authorization header" }, 401);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const ANON = Deno.env.get("SUPABASE_ANON_KEY");
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !ANON || !SERVICE) {
      return json({ error: "Missing Supabase environment variables" }, 500);
    }

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    const admin = createClient(SUPABASE_URL, SERVICE);

    const { data: userRes } = await userClient.auth.getUser();
    if (!userRes?.user) return json({ error: "Not authenticated" }, 401);

    // Authorize: only super admins can list cross-company projects
    const { data: me, error: meErr } = await userClient
      .from("profiles")
      .select("is_super_admin")
      .eq("user_id", userRes.user.id)
      .single();

    if (meErr || !me) return json({ error: "Profile not found" }, 403);
    if (!me.is_super_admin) {
      return json({ error: "Only super_admin can use this endpoint" }, 403);
    }

    // Parse filter
    let companyId: string | undefined;
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({} as Record<string, unknown>));
      const raw = (body as any)?.company_id;
      if (typeof raw === "string" && raw && raw !== "all") {
        companyId = raw;
      }
    }

    let query = admin
      .from("projects")
      .select("*, companies(name)")
      .order("created_at", { ascending: false });

    if (companyId) query = query.eq("company_id", companyId);

    const { data: projects, error } = await query;
    if (error) return json({ error: error.message }, 500);

    return json({ ok: true, projects });
  } catch (e) {
    console.error("admin-list-projects error", e);
    return json({ error: "Internal error", details: String(e) }, 500);
  }
});