import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WorkflowNotificationRequest {
  type: 'deadline' | 'approval' | 'compliance' | 'test';
  title: string;
  message: string;
  recipient_email: string;
  priority?: 'low' | 'medium' | 'high';
  action_url?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, title, message, recipient_email, priority = 'medium', action_url }: WorkflowNotificationRequest = await req.json();

    console.log('Sending workflow notification:', { type, title, recipient_email });

    const getPriorityColor = (priority: string) => {
      switch (priority) {
        case 'high': return '#dc3545';
        case 'medium': return '#ffc107';
        case 'low': return '#28a745';
        default: return '#6c757d';
      }
    };

    const getTypeIcon = (type: string) => {
      switch (type) {
        case 'deadline': return '📅';
        case 'approval': return '✅';
        case 'compliance': return '⚠️';
        case 'test': return '🧪';
        default: return '🔔';
      }
    };

    const emailResponse = await resend.emails.send({
      from: "ConstructTest Pro <onboarding@resend.dev>",
      to: [recipient_email],
      subject: `[ConstructTest Pro] ${title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0;">ConstructTest Pro</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Workflow Notification</p>
          </div>
          
          <div style="padding: 30px; background: white; border: 1px solid #e9ecef;">
            <div style="display: flex; align-items: center; margin-bottom: 20px;">
              <div style="font-size: 24px; margin-right: 15px;">${getTypeIcon(type)}</div>
              <div>
                <h2 style="color: #333; margin: 0; font-size: 20px;">${title}</h2>
                <div style="display: inline-block; background: ${getPriorityColor(priority)}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; text-transform: uppercase; margin-top: 5px;">
                  ${priority} Priority
                </div>
              </div>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <p style="color: #555; line-height: 1.6; margin: 0;">
                ${message}
              </p>
            </div>
            
            ${action_url ? `
              <div style="text-align: center; margin: 30px 0;">
                <a href="${action_url}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  View Details
                </a>
              </div>
            ` : ''}
            
            <div style="background: #e3f2fd; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="color: #1565c0; margin: 0; font-size: 14px;">
                <strong>📋 Quick Actions:</strong><br>
                • Review your dashboard for pending items<br>
                • Check compliance status and reports<br>
                • Update team on any required actions
              </p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                This is an automated notification from ConstructTest Pro<br>
                Generated on ${new Date().toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      `,
    });

    console.log("Workflow notification sent successfully:", emailResponse);

    return new Response(JSON.stringify({
      success: true,
      messageId: emailResponse.data?.id,
      type,
      priority
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-workflow-notification function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to send workflow notification'
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);