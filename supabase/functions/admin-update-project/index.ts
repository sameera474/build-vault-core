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

    // Verify auth
    const { data: userRes } = await userClient.auth.getUser();
    if (!userRes?.user) return json({ error: "Not authenticated" }, 401);

    // Authorize super admin
    const { data: me, error: meErr } = await userClient
      .from("profiles")
      .select("is_super_admin")
      .eq("user_id", userRes.user.id)
      .single();

    if (meErr || !me) return json({ error: "Profile not found" }, 403);
    if (!me.is_super_admin) return json({ error: "Only super admin can use this endpoint" }, 403);

    // Parse and validate body
    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const id = (body as any)?.id as string | undefined;
    if (!id) return json({ error: "Missing field: id" }, 400);

    // Build update payload (whitelist fields)
    const allowed = [
      "company_id",
      "name",
      "contract_number",
      "contractor_name",
      "contractor_logo",
      "client_name",
      "client_logo",
      "consultant_name",
      "consultant_logo",
      "description",
      "location",
      "start_date",
      "end_date",
      "status",
      "project_prefix",
      "region_code",
      "lab_code",
    ] as const;

    const dateFields = ["start_date", "end_date"];
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(body, key)) {
        const v = (body as any)[key];
        // Convert empty strings to null, especially for date fields
        if (v === undefined || v === "" || (dateFields.includes(key) && !v)) {
          update[key] = null;
        } else {
          update[key] = v;
        }
      }
    }

    const { data, error } = await admin
      .from("projects")
      .update(update)
      .eq("id", id)
      .select()
      .single();

    if (error) return json({ error: "Update failed", details: error.message }, 500);

    return json({ success: true, project: data });
  } catch (e) {
    console.error("admin-update-project error", e);
    return json({ error: "Internal error", details: String(e) }, 500);
  }
});