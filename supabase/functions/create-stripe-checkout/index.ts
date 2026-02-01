import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-STRIPE-CHECKOUT] ${step}${detailsStr}`);
};

// Map internal errors to safe client messages
function getSafeErrorMessage(error: string): string {
  const errorMap: Record<string, string> = {
    'STRIPE_SECRET_KEY is not configured': 'Payment service temporarily unavailable',
    'No authorization header provided': 'Authentication required',
    'User not authenticated': 'Authentication required',
    'Missing required fields: orderId and amount': 'Invalid request',
    'Order not found or unauthorized': 'Unable to process payment',
  };

  // Check for known error patterns
  for (const [pattern, message] of Object.entries(errorMap)) {
    if (error.includes(pattern)) {
      return message;
    }
  }

  return 'Payment processing failed. Please try again.';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error("STRIPE_SECRET_KEY is not configured");
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    logStep("Stripe key verified");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      console.error("User authentication failed:", userError);
      throw new Error("User not authenticated");
    }
    
    const user = userData.user;
    logStep("User authenticated", { userId: user.id });

    // Parse request body
    const { orderId, amount, email, customerName, items } = await req.json();
    logStep("Request body parsed", { orderId, itemCount: items?.length });

    if (!orderId || !amount) {
      console.error("Missing required fields:", { orderId, amount });
      throw new Error("Missing required fields: orderId and amount");
    }

    // Verify order belongs to user
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('id, user_id, total')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (orderError || !order) {
      console.error("Order verification failed for order:", orderId);
      throw new Error("Order not found or unauthorized");
    }
    logStep("Order verified", { orderId: order.id });

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: email || user.email, limit: 1 });
    let customerId: string | undefined;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing Stripe customer");
    }

    // Build line items for the order
    const lineItems = items?.map((item: { name: string; quantity: number; price: number }) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
        },
        unit_amount: Math.round(item.price * 100), // Convert to cents
      },
      quantity: item.quantity,
    })) || [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: `Order #${orderId.slice(0, 8)}`,
        },
        unit_amount: Math.round(amount * 100),
      },
      quantity: 1,
    }];

    logStep("Creating checkout session");

    const origin = req.headers.get("origin") || "https://durahub.lovable.app";

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : (email || user.email),
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
      cancel_url: `${origin}/checkout?cancelled=true`,
      metadata: {
        orderId: orderId,
        userId: user.id,
      },
    });

    logStep("Checkout session created");

    // Update order with Stripe session info
    await supabaseClient
      .from('orders')
      .update({ 
        payment_method: 'stripe',
      })
      .eq('id', orderId);

    return new Response(JSON.stringify({ 
      success: true,
      url: session.url,
      sessionId: session.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const internalError = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: internalError });
    
    // Return safe error message to client
    const safeMessage = getSafeErrorMessage(internalError);
    const status = internalError.includes('not authenticated') || internalError.includes('authorization') ? 401 : 
                   internalError.includes('unauthorized') ? 403 : 500;
    
    return new Response(JSON.stringify({ 
      success: false,
      error: safeMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status,
    });
  }
});
