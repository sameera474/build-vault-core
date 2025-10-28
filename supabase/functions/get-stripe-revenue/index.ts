import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    // Verify super admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('is_super_admin')
      .eq('user_id', userData.user.id)
      .single();
    
    if (!profile?.is_super_admin) {
      throw new Error("Unauthorized: Super admin access required");
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Get balance
    const balance = await stripe.balance.retrieve();
    
    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      status: 'active',
      limit: 100,
    });

    // Calculate monthly recurring revenue
    let mrr = 0;
    subscriptions.data.forEach((sub: any) => {
      sub.items.data.forEach((item: any) => {
        if (item.price.recurring?.interval === 'month') {
          mrr += (item.price.unit_amount || 0) * item.quantity;
        } else if (item.price.recurring?.interval === 'year') {
          mrr += ((item.price.unit_amount || 0) * item.quantity) / 12;
        }
      });
    });

    // Get payment intents from last 30 days for actual revenue
    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);
    const charges = await stripe.charges.list({
      created: { gte: thirtyDaysAgo },
      limit: 100,
    });

    let actualRevenue = 0;
    charges.data.forEach((charge: any) => {
      if (charge.paid) {
        actualRevenue += charge.amount;
      }
    });

    // Get subscription breakdown by product
    const productBreakdown: Record<string, number> = {};
    subscriptions.data.forEach((sub: any) => {
      sub.items.data.forEach((item: any) => {
        const productId = typeof item.price.product === 'string' 
          ? item.price.product 
          : item.price.product.id;
        productBreakdown[productId] = (productBreakdown[productId] || 0) + 1;
      });
    });

    return new Response(JSON.stringify({
      balance: {
        available: balance.available.map((b: any) => ({
          amount: b.amount / 100,
          currency: b.currency
        })),
        pending: balance.pending.map((b: any) => ({
          amount: b.amount / 100,
          currency: b.currency
        }))
      },
      subscriptions: {
        total: subscriptions.data.length,
        active: subscriptions.data.length,
        mrr: mrr / 100, // Convert cents to dollars
        breakdown: productBreakdown
      },
      revenue: {
        last_30_days: actualRevenue / 100, // Convert cents to dollars
        currency: 'usd'
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("ERROR in get-stripe-revenue:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
