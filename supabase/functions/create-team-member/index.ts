// supabase/functions/create-team-member/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: CORS });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace("Bearer ", "");
    if (!jwt) return json({ error: "Missing Authorization header" }, 401);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const SITE_URL = Deno.env.get("SITE_URL") ?? "https://scwhurqvgeskseugwcrx.lovable.app";
    const admin = createClient(SUPABASE_URL, SERVICE);
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });

    const body = await req.json().catch(() => ({}));
    const { email, role, projects = [], expiresInDays = 7, sendEmail = false } = body;
    if (!email || !role) return json({ error: "email and role are required" }, 400);

    // Who is calling?
    const { data: authUser } = await userClient.auth.getUser();
    if (!authUser?.user) return json({ error: "Not authenticated" }, 401);

    const { data: me, error: meErr } = await userClient
      .from("profiles")
      .select("user_id, company_id, tenant_role, is_super_admin")
      .eq("user_id", authUser.user.id)
      .single();
    if (meErr || !me) return json({ error: "Profile not found" }, 403);
    
    const isAdmin = me.is_super_admin === true || me.tenant_role === "admin";
    if (!isAdmin) {
      return json({ error: "Insufficient permission" }, 403);
    }

    // 1) If the email already belongs to a user who is a member in this company, return 409
    // Try to find auth user by email
    const { data: userByEmail } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existingUser = userByEmail?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      const { data: existingProfile } = await admin
        .from("profiles")
        .select("user_id")
        .eq("user_id", existingUser.id)
        .eq("company_id", me.company_id)
        .maybeSingle();
      if (existingProfile) {
        return json(
          { error: "User is already a member of this company", code: "ALREADY_MEMBER" },
          409
        );
      }
    }

    // 2) Check for existing pending invite (idempotent behavior)
    const { data: pending } = await admin
      .from("team_invitations")
      .select("id, invitation_token, expires_at")
      .eq("company_id", me.company_id)
      .eq("email", email)
      .is("accepted_at", null)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (pending) {
      const acceptUrl = `${SITE_URL}/accept-invitation?token=${encodeURIComponent(pending.invitation_token)}`;
      return json(
        { error: "Invitation already exists", code: "INVITE_EXISTS", acceptUrl, inviteId: pending.id },
        409
      );
    }

    // 3) Create a new invite
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

    if (invErr) {
      // Map unique violation to 409
      if ((invErr as any).code === "23505") {
        const acceptUrl = `${SITE_URL}/accept-invitation?token=${encodeURIComponent(token)}`;
        return json(
          { error: "Duplicate invitation", code: "INVITE_EXISTS", details: invErr.message, acceptUrl },
          409
        );
      }
      return json({ error: "Insert invitation failed", details: invErr.message }, 500);
    }

    const acceptUrl = `${SITE_URL}/accept-invitation?token=${encodeURIComponent(invite.invitation_token)}`;

    // 4) Optional: send email via provider HTTP API using fetch (no Node sdk)
    // If email fails, do not fail the whole request—still return acceptUrl
    try {
      const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
      if (sendEmail && RESEND_API_KEY) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "ConstructTest Pro <noreply@yourdomain.com>",
            to: [email],
            subject: "You're invited to ConstructTest Pro",
            html: `<p>You've been invited.</p><p><a href="${acceptUrl}">Accept Invite</a></p>`,
          }),
        });
      }
    } catch (e) {
      console.error("Invite email failed:", e);
    }

    return json({ ok: true, inviteId: invite.id, acceptUrl }, 200);
  } catch (e) {
    console.error("create-team-member crashed:", e);
    return json({ error: "Internal error", details: String(e) }, 500);
  }
});