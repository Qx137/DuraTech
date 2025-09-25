import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Parse webhook data from Paynow
    const formData = await req.formData();
    const webhookData: Record<string, string> = {};
    
    for (const [key, value] of formData.entries()) {
      webhookData[key.toLowerCase()] = value.toString();
    }

    console.log('Paynow webhook received:', webhookData);

    const { reference, paynowreference, amount, status } = webhookData;

    if (!reference) {
      throw new Error('No reference provided in webhook');
    }

    // Update order payment status based on Paynow status
    let paymentStatus = 'pending';
    let orderStatus = 'pending';

    if (status === 'Paid') {
      paymentStatus = 'completed';
      orderStatus = 'confirmed';
    } else if (status === 'Cancelled') {
      paymentStatus = 'failed';
      orderStatus = 'cancelled';
    } else if (status === 'Failed') {
      paymentStatus = 'failed';
      orderStatus = 'cancelled';
    }

    // Update the order in the database
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_status: paymentStatus,
        status: orderStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', reference);

    if (updateError) {
      console.error('Error updating order:', updateError);
      throw updateError;
    }

    console.log(`Order ${reference} updated: payment_status=${paymentStatus}, status=${orderStatus}`);

    return new Response('OK', {
      status: 200,
      headers: corsHeaders,
    });

  } catch (error) {
    console.error('Error processing Paynow webhook:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});