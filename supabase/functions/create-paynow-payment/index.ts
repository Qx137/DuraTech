import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  orderId: string;
  amount: number;
  email: string;
  phone?: string;
  customerName: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // 2. Initialize Supabase with user's JWT
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // 3. Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { orderId, amount, email, phone, customerName }: PaymentRequest = await req.json();

    console.log('Creating Paynow payment for user:', user.id, 'order:', orderId);

    // 4. Verify order ownership and get actual amount
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, total, payment_status')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', orderError);
      throw new Error('Order not found');
    }

    // 5. Verify user owns this order
    if (order.user_id !== user.id) {
      console.error('Access denied: Order belongs to another user');
      throw new Error('Access denied: Order belongs to another user');
    }

    // 6. Verify order hasn't been paid
    if (order.payment_status === 'completed') {
      throw new Error('Order already paid');
    }

    // 7. Verify amount matches (prevent price manipulation)
    if (Math.abs(order.total - amount) > 0.01) {
      console.error('Amount mismatch:', { requested: amount, actual: order.total });
      throw new Error('Amount mismatch');
    }

    // Get Paynow credentials from environment
    const integrationId = Deno.env.get('PAYNOW_INTEGRATION_ID');
    const integrationKey = Deno.env.get('PAYNOW_INTEGRATION_KEY');

    if (!integrationId || !integrationKey) {
      throw new Error('Paynow credentials not configured');
    }

    // Create payment request to Paynow
    const paymentData = {
      resulturl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/paynow-webhook`,
      returnurl: `https://wutfcyskvfkunmvrvafz.lovable.app/payment-success?orderId=${orderId}`,
      reference: orderId,
      amount: amount.toFixed(2),
      id: integrationId,
      additionalinfo: `Payment for order ${orderId}`,
      authemail: email,
      phone: phone || '',
      status: 'Message'
    };

    // Create signature for Paynow
    const values = Object.values(paymentData).join('') + integrationKey;
    const encoder = new TextEncoder();
    const data = encoder.encode(values);
    const hashBuffer = await crypto.subtle.digest('SHA-512', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Add hash to payment data
    const finalPaymentData = {
      ...paymentData,
      hash: hashHex.toUpperCase()
    };

    // Send request to Paynow with retry logic
    let paynowResponse;
    let lastError;
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Paynow request attempt ${attempt}/${maxRetries}`);
        
        paynowResponse = await fetch('https://www.paynow.co.zw/interface/initiatetransaction', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams(finalPaymentData).toString(),
          signal: AbortSignal.timeout(30000) // 30 second timeout
        });
        
        // If we get here, the request succeeded
        break;
      } catch (error) {
        lastError = error;
        console.error(`Attempt ${attempt} failed:`, error);
        
        if (attempt < maxRetries) {
          // Wait before retrying (exponential backoff: 1s, 2s, 4s)
          const waitTime = Math.pow(2, attempt - 1) * 1000;
          console.log(`Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    if (!paynowResponse) {
      console.error('All Paynow connection attempts failed');
      throw new Error('Unable to connect to payment gateway. Please try again later.');
    }

    const responseText = await paynowResponse.text();
    console.log('Paynow response:', responseText);

    // Parse Paynow response
    const responseLines = responseText.split('\n');
    const responseData: Record<string, string> = {};
    
    responseLines.forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        responseData[key.toLowerCase()] = value;
      }
    });

    if (responseData.status === 'ok') {
      return new Response(
        JSON.stringify({
          success: true,
          paymentUrl: responseData.browserurl,
          pollUrl: responseData.pollurl,
          reference: orderId
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else {
      throw new Error(responseData.error || 'Failed to create payment');
    }

  } catch (error) {
    console.error('Error creating Paynow payment:', error);
    const status = error instanceof Error && error.message.includes('Access denied') ? 403 : 400;
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      }),
      {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});