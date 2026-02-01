import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Maximum age for webhook timestamps (5 minutes in milliseconds)
const MAX_WEBHOOK_AGE_MS = 5 * 60 * 1000;

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

// Check if webhook has already been processed (idempotency)
async function isWebhookProcessed(supabase: any, paynowReference: string): Promise<boolean> {
  try {
    // Check if we've already processed this paynow reference
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id, payment_status')
      .or(`id.eq.${paynowReference}`)
      .single();

    // If order is already completed, it's been processed
    if (existingOrder?.payment_status === 'completed') {
      console.log(`Webhook already processed for reference: ${paynowReference}`);
      return true;
    }
    return false;
  } catch (error) {
    // If error, assume not processed to be safe
    return false;
  }
}

// Validate webhook timestamp to prevent replay attacks
function isTimestampValid(timestamp: string | undefined): boolean {
  if (!timestamp) {
    // If no timestamp provided, we can't validate - log warning but continue
    // Some payment providers don't include timestamps
    console.warn('No timestamp in webhook, skipping timestamp validation');
    return true;
  }

  try {
    const webhookTime = new Date(timestamp).getTime();
    const now = Date.now();
    const age = now - webhookTime;

    if (age > MAX_WEBHOOK_AGE_MS) {
      console.error(`Webhook too old: ${age}ms (max: ${MAX_WEBHOOK_AGE_MS}ms)`);
      return false;
    }

    if (age < -60000) { // Allow 1 minute clock skew into the future
      console.error(`Webhook timestamp in future: ${age}ms`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error parsing timestamp:', error);
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
      // Return 200 to prevent retries but log the issue
      return new Response('Invalid request', {
        status: 200,
        headers: corsHeaders,
      });
    }

    // Verify the webhook is from Paynow
    const isValid = await verifyPaynowSignature(dataToVerify, hash);
    if (!isValid) {
      console.error('Invalid webhook signature');
      // Return 200 to prevent retries of invalid webhooks
      return new Response('Invalid signature', {
        status: 200,
        headers: corsHeaders,
      });
    }

    const { reference, paynowreference, amount, status, timestamp } = webhookData;

    if (!reference) {
      console.error('No reference provided in webhook');
      return new Response('Missing reference', {
        status: 200,
        headers: corsHeaders,
      });
    }

    // Validate timestamp to prevent replay attacks
    if (!isTimestampValid(timestamp)) {
      console.error('Webhook timestamp validation failed');
      return new Response('Timestamp validation failed', {
        status: 200,
        headers: corsHeaders,
      });
    }

    // Check idempotency - prevent duplicate processing
    if (paynowreference && await isWebhookProcessed(supabase, reference)) {
      console.log(`Duplicate webhook detected for: ${reference}`);
      return new Response('Already processed', {
        status: 200,
        headers: corsHeaders,
      });
    }

    // Verify order exists and check current payment status
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, payment_status')
      .eq('id', reference)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', reference);
      return new Response('Order not found', {
        status: 200,
        headers: corsHeaders,
      });
    }

    // Prevent updating already completed orders
    if (order.payment_status === 'completed') {
      console.log(`Order ${reference} already completed, skipping update`);
      return new Response('Already completed', {
        status: 200,
        headers: corsHeaders,
      });
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
      // Return 500 so webhook can be retried
      return new Response('Update failed', {
        status: 500,
        headers: corsHeaders,
      });
    }

    console.log(`Order ${reference} updated: payment_status=${paymentStatus}, status=${orderStatus}`);

    return new Response('OK', {
      status: 200,
      headers: corsHeaders,
    });

  } catch (err) {
    console.error('Error processing Paynow webhook:', err);
    // Return generic error message to client
    return new Response('Processing error', {
      status: 500,
      headers: corsHeaders,
    });
  }
});
