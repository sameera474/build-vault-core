import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactRequest {
  name: string;
  email: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Contact confirmation email function called");
    
    const { name, email, message }: ContactRequest = await req.json();
    
    console.log(`Sending confirmation email to: ${email}`);

    // Send confirmation email to the person who submitted the form
    const confirmationEmail = await resend.emails.send({
      from: "ConstructTest Pro <onboarding@resend.dev>",
      to: [email],
      subject: "We received your message!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1e40af, #f97316); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Thank you for contacting us!</h1>
          </div>
          
          <div style="padding: 30px 20px; background: #f8fafc; border-left: 4px solid #1e40af;">
            <h2 style="color: #1e40af; margin-top: 0;">Hello ${name},</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #334155;">
              We have received your message and will get back to you as soon as possible. 
              Our team typically responds within 24 hours during business days.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #475569; margin-top: 0;">Your message:</h3>
              <p style="color: #64748b; font-style: italic; margin-bottom: 0;">"${message}"</p>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6; color: #334155;">
              In the meantime, feel free to explore our platform and learn more about how 
              ConstructTest Pro can streamline your construction materials testing workflow.
            </p>
          </div>
          
          <div style="padding: 20px; text-align: center; background: #e2e8f0;">
            <p style="margin: 0; color: #64748b; font-size: 14px;">
              Best regards,<br>
              <strong>The ConstructTest Pro Team</strong>
            </p>
          </div>
        </div>
      `,
    });

    console.log("Confirmation email sent successfully:", confirmationEmail);

    // Optional: Send notification email to your team
    const notificationEmail = await resend.emails.send({
      from: "ConstructTest Pro <onboarding@resend.dev>",
      to: ["hello@constructtestpro.com"], // Replace with your actual email
      subject: "New Contact Form Submission",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e40af;">New Contact Form Submission</h2>
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px;">
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Message:</strong></p>
            <p style="background: white; padding: 15px; border-radius: 4px;">${message}</p>
            <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `,
    });

    console.log("Notification email sent successfully:", notificationEmail);

    return new Response(JSON.stringify({ 
      success: true,
      confirmation: confirmationEmail,
      notification: notificationEmail 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-contact-confirmation function:", error);
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