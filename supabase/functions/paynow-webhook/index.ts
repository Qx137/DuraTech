/// <reference path="../create-paynow-payment/deno_std_server.d.ts" />
/// <reference path="../create-paynow-payment/supabase_js_esmsh.d.ts" />
/// <reference path="../create-paynow-payment/deno_global.d.ts" />

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Verify Paynow webhook signature using SHA-512 hash
async function verifyPaynowSignature(data: Record<string, string>, receivedHash: string): Promise<boolean> {
  try {
    const integrationKey = Deno.env.get('PAYNOW_INTEGRATION_KEY');
    if (!integrationKey) {
      console.error('PAYNOW_INTEGRATION_KEY not configured');
      return false;
    }

    // Create string from all values + integration key
    const values = Object.keys(data)
      .sort() // Sort keys for consistent ordering
      .map(key => data[key])
      .join('') + integrationKey;

    // Generate SHA-512 hash
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-512', encoder.encode(values));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const calculatedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

    console.log('Hash verification:', {
      received: receivedHash.toUpperCase(),
      calculated: calculatedHash,
      match: calculatedHash === receivedHash.toUpperCase()
    });

    return calculatedHash === receivedHash.toUpperCase();
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}

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

    console.log('Paynow webhook received:', { ...webhookData, hash: '***' });

    // Extract hash and verify signature
    const { hash, ...dataToVerify } = webhookData;
    
    if (!hash) {
      console.error('No hash provided in webhook');
      throw new Error('Missing signature hash');
    }

    // Verify the webhook is from Paynow
    const isValid = await verifyPaynowSignature(dataToVerify, hash);
    if (!isValid) {
      console.error('Invalid webhook signature');
      throw new Error('Invalid webhook signature - request rejected');
    }

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
    const { error: updateError } = await (supabase.from('orders') as any)
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

  } catch (err) {
    console.error('Error processing Paynow webhook:', err);
    const errMsg = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ 
        error: errMsg
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
