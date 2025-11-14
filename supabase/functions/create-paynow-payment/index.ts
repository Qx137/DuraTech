/// <reference path="./deno_global.d.ts" />
/// <reference path="./deno_std_server.d.ts" />
/// <reference path="./supabase_js_esmsh.d.ts" />
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
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

    // 3. Get authenticated user (avoid unsafe nested destructuring)
    const userResult = await supabase.auth.getUser();
    const user = userResult.data?.user;
    const userError = userResult.error;
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Parse and validate input (ensure amount is a number)
    const body = await req.json();
    let { orderId, amount, email, phone, customerName } = body as PaymentRequest;
    if (typeof amount === 'string') {
      amount = parseFloat(amount);
    }
    if (typeof amount !== 'number' || Number.isNaN(amount)) {
      throw new Error('Invalid amount');
    }

    console.log('Creating Paynow payment for user:', user.id, 'order:', orderId);

    // 4. Verify order ownership and get actual amount
    const orderRes: any = await (supabase
      .from('orders')
      .select('id, user_id, total, payment_status')
      .eq('id', orderId)
      .single() as any);
    const order = orderRes.data;
    const orderError = orderRes.error;
    
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

    // Send request to Paynow with endpoint fallback + retry logic
    let paynowResponse: Response | undefined;
    let lastError: unknown;
    const maxRetries = 3;

    // Build endpoints list with optional config and sandbox
    const paynowEnv = (Deno.env.get('PAYNOW_ENV') || '').toLowerCase();
    const configuredBaseUrl = Deno.env.get('PAYNOW_BASE_URL');
    const endpoints: string[] = [];

    if (configuredBaseUrl) endpoints.push(configuredBaseUrl);
    if (paynowEnv === 'sandbox') {
      endpoints.push('https://sandbox.paynow.co.zw/interface/initiatetransaction');
    }
    // Default production endpoints (try www then non-www)
    endpoints.push(
      'https://www.paynow.co.zw/interface/initiatetransaction',
      'https://paynow.co.zw/interface/initiatetransaction'
    );

    for (const endpoint of endpoints) {
      console.log(`Attempting Paynow endpoint: ${endpoint}`);
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        // Create an AbortController per attempt with a 30s timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30_000);

        try {
          console.log(`Paynow request attempt ${attempt}/${maxRetries}`);
          console.log('Request URL:', endpoint);
          console.log('Request data:', { ...finalPaymentData, hash: '***', id: '***' });

          paynowResponse = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
              'Accept': 'text/plain, */*;q=0.8',
              'User-Agent': 'Supabase-Edge-Function/1.0 (+https://supabase.com)'
            },
            body: new URLSearchParams(finalPaymentData as Record<string, string>).toString(),
            signal: controller.signal
          });

          console.log(`Response status: ${paynowResponse.status}`);

          // If we get here, the request succeeded (network level)
          clearTimeout(timeoutId);
          break;
        } catch (error) {
          lastError = error;
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.error(`Attempt ${attempt} failed:`, errorMsg);
          console.error('Full error details:', error);

          clearTimeout(timeoutId);

          if (attempt < maxRetries) {
            // Wait before retrying (exponential backoff: 1s, 2s, 4s)
            const waitTime = Math.pow(2, attempt - 1) * 1000;
            console.log(`Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
      }

      if (paynowResponse) {
        // Exit endpoint loop if we received a response
        break;
      } else {
        console.warn(`No response from endpoint, trying next: ${endpoint}`);
      }
    }

    if (!paynowResponse) {
      const errorDetails = lastError instanceof Error ? lastError.message : String(lastError);
      console.error('All Paynow connection attempts failed. Last error:', errorDetails);
      console.error('Possible causes: 1) Paynow API is down, 2) Network/firewall blocking, 3) Invalid credentials, 4) Using test credentials against production endpoint');
      throw new Error('Unable to connect to payment gateway. Please try again later or contact support.');
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

  } catch (err) {
    console.error('Error creating Paynow payment:', err);
    const errMsg = err instanceof Error ? err.message : String(err);
    const status = errMsg.includes('Access denied') ? 403 : 400;
    return new Response(
      JSON.stringify({
        success: false,
        error: errMsg
      }),
      {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});