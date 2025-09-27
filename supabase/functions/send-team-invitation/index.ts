import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  email: string;
  role: string;
  company_name?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { email, role, company_name }: InvitationRequest = await req.json();
    
    // Get user info from the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    // Get user's profile and company info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id, name')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('Profile not found');
    }

    // Generate invitation token
    const invitationToken = crypto.randomUUID();
    const invitationUrl = `${Deno.env.get('SUPABASE_URL')}/auth/v1/verify?token=${invitationToken}&type=invite&redirect_to=${Deno.env.get('SITE_URL')}/dashboard`;

    // Create invitation record
    const { error: inviteError } = await supabase
      .from('team_invitations')
      .insert({
        company_id: profile.company_id,
        email,
        role,
        invited_by: user.id,
        invitation_token: invitationToken,
      });

    if (inviteError) {
      throw new Error(`Failed to create invitation: ${inviteError.message}`);
    }

    // Send invitation email
    const emailResponse = await resend.emails.send({
      from: "ConstructTest Pro <onboarding@resend.dev>",
      to: [email],
      subject: `You're invited to join ${company_name || 'ConstructTest Pro'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1e40af, #f97316); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">You're Invited!</h1>
          </div>
          
          <div style="padding: 30px 20px; background: #f8fafc;">
            <h2 style="color: #1e40af; margin-top: 0;">Join ${company_name || 'our team'} on ConstructTest Pro</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #334155;">
              ${profile.name} has invited you to join their construction materials testing team as a <strong>${role}</strong>.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${invitationUrl}" 
                 style="background: #1e40af; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Accept Invitation
              </a>
            </div>
            
            <p style="font-size: 14px; color: #64748b; margin-top: 30px;">
              This invitation will expire in 7 days. If you don't have an account, one will be created for you when you accept.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #475569; margin-top: 0;">What is ConstructTest Pro?</h3>
              <p style="color: #64748b; margin-bottom: 0;">
                ConstructTest Pro is a comprehensive platform for managing construction materials testing, 
                reports, and compliance tracking. Join your team to collaborate on testing workflows and maintain quality standards.
              </p>
            </div>
          </div>
          
          <div style="padding: 20px; text-align: center; background: #e2e8f0;">
            <p style="margin: 0; color: #64748b; font-size: 14px;">
              If you have any questions, contact your team administrator or visit our support center.
            </p>
          </div>
        </div>
      `,
    });

    console.log("Invitation email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true,
      message: "Invitation sent successfully",
      invitation_token: invitationToken
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-team-invitation function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);