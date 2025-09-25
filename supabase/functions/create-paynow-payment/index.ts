import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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
    const { orderId, amount, email, phone, customerName }: PaymentRequest = await req.json();

    console.log('Creating Paynow payment for:', { orderId, amount, email, customerName });

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

    // Send request to Paynow
    const paynowResponse = await fetch('https://www.paynow.co.zw/interface/initiatetransaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(finalPaymentData).toString()
    });

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
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});