// supabase/functions/create-team-member/index.ts
// Edge-safe: creates actual users + profiles, no Node polyfills
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers });
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers });

  try {
    // 1) Auth header (caller must be signed in)
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace("Bearer ", "");
    if (!jwt) return json({ error: "Missing Authorization header" }, 401);

    // 2) Clients
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    const admin = createClient(SUPABASE_URL, SERVICE);

    // 3) Parse input
    const body = await req.json().catch(() => ({}));
    const { name, email, role, phone, department, avatar_url } = body as Record<string, any>;
    
    if (!name?.trim() || !email?.trim() || !role) {
      return json({ error: "name, email and role are required" }, 400);
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return json({ error: "Invalid email" }, 400);
    }
    
    if (!ALLOWED_ROLES.has(role)) {
      return json({ error: "Invalid role" }, 400);
    }

    // 4) Get caller profile / company
    const {
      data: { user },
      error: userErr,
    } = await userClient.auth.getUser();
    if (userErr || !user) return json({ error: "Not authenticated" }, 401);

    const { data: me, error: meErr } = await userClient
      .from("profiles")
      .select("user_id, company_id, tenant_role, is_super_admin")
      .eq("user_id", user.id)
      .single();
    if (meErr || !me) return json({ error: "Profile not found" }, 403);

    // Permission check - only admin can add members
    const isAdmin = me.is_super_admin === true || me.tenant_role === "admin";
    if (!isAdmin) {
      return json({ error: "Forbidden: admin only" }, 403);
    }

    // 5) Create auth user or find existing
    let newUserId: string;
    
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: cleanEmail,
      email_confirm: true,
      user_metadata: { name: cleanName },
    });

    if (createErr) {
      // Handle "email already exists"
      const code = (createErr as any)?.code || (createErr as any)?.status;
      if (code === 'email_exists' || code === 422) {
        // Find existing user by email
        const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 } as any);
        if (listErr) {
          console.error('listUsers error', listErr);
          return json({ error: 'Failed to locate existing user' }, 500);
        }
        
        const found = (list as any)?.users?.find((u: any) => (u.email || '').toLowerCase() === cleanEmail);
        if (!found) {
          return json({ error: 'Email already registered to another account' }, 409);
        }
        newUserId = found.id;
      } else {
        console.error("createUser error", createErr);
        return json({ error: createErr?.message || "Failed to create user" }, 500);
      }
    } else {
      newUserId = created!.user!.id;
    }

    // 6) Check if user already belongs to another company
    const { data: existingProfile, error: existingErr } = await admin
      .from("profiles")
      .select("company_id")
      .eq("user_id", newUserId)
      .maybeSingle();

    if (existingErr) {
      console.error("profile lookup error", existingErr);
    }

    if (existingProfile && existingProfile.company_id && existingProfile.company_id !== me.company_id) {
      return json({ error: "User already belongs to another company" }, 409);
    }

    // 7) Upsert profile
    const { error: profileUpsertErr } = await admin
      .from("profiles")
      .upsert({
        user_id: newUserId,
        company_id: me.company_id,
        name: cleanName,
        role: "admin", // legacy field
        tenant_role: role,
        phone: phone || null,
        department: department || null,
        avatar_url: avatar_url || null,
      }, { onConflict: 'user_id' });

    if (profileUpsertErr) {
      console.error("profile upsert error", profileUpsertErr);
      return json({ error: profileUpsertErr.message }, 500);
    }

    return json({ ok: true, user_id: newUserId }, 200);
  } catch (e) {
    console.error("create-team-member crashed:", e);
    return json({ error: "Internal error", details: String(e) }, 500);
  }
});