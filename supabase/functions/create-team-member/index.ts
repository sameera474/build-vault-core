// supabase/functions/create-team-member/index.ts
// Edge-safe: uses Deno.serve, fetch, web crypto, no Node std polyfills.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers });

  try {
    // 1) Auth header (caller must be signed in)
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace("Bearer ", "");
    if (!jwt) return json({ error: "Missing Authorization header" }, 401);

    // 2) Clients (anon with caller JWT, and service-role for RLS-bypass writes)
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const SITE_URL = Deno.env.get("SITE_URL") ?? "https://<your-app>.lovable.app";

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    const admin = createClient(SUPABASE_URL, SERVICE);

    // 3) Parse input
    const body = await req.json().catch(() => ({}));
    const { email, role, projects = [], expiresInDays = 7, sendEmail = false } = body as Record<string, any>;
    if (!email || !role) return json({ error: "email and role are required" }, 400);

    // 4) Get caller profile / company
    const {
      data: { user },
      error: userErr,
    } = await userClient.auth.getUser();
    if (userErr || !user) return json({ error: "Not authenticated" }, 401);

    const { data: me, error: meErr } = await userClient
      .from("profiles")
      .select("user_id, company_id, role")
      .eq("user_id", user.id)
      .single();
    if (meErr || !me) return json({ error: "Profile not found" }, 403);

    // Optional: permission gate (allow admin + quality_manager)
    if (!["admin", "quality_manager"].includes(me.role)) {
      return json({ error: "Insufficient permission" }, 403);
    }

    // 5) Create invitation (token) with service-role (bypass RLS)
    const token = crypto.randomUUID();
    const expires_at = new Date(Date.now() + expiresInDays * 864e5).toISOString();

    const { data: invite, error: invErr } = await admin
      .from("team_invitations")
      .insert({
        company_id: me.company_id,
        email,
        role,
        invitation_token: token,
        invited_by: me.user_id,
        expires_at,
      })
      .select()
      .single();
    if (invErr) return json({ error: "Insert invitation failed", details: invErr.message }, 500);

    const acceptUrl = `${SITE_URL.replace(/\/$/, "")}/invite/${encodeURIComponent(token)}`;

    // 6) (Optional) Email via Resend HTTP API (no Node SDK)
    if (sendEmail) {
      const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
      if (RESEND_API_KEY) {
        try {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "ConstructTest Pro <noreply@yourdomain.com>",
              to: [email],
              subject: "You’re invited to ConstructTest Pro",
              html: `<p>You’ve been invited.</p><p><a href="${acceptUrl}">Accept Invite</a></p>`,
            }),
          });
        } catch (e) {
          console.error("Resend error:", e);
        }
      }
    }

    return json({ ok: true, inviteId: invite.id, acceptUrl }, 200);
  } catch (e) {
    console.error("create-team-member crashed:", e);
    return json({ error: "Internal error", details: String(e) }, 500);
  }
});
