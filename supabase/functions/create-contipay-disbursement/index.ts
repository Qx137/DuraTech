// @ts-nocheck
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization header');

    const supabaseUrl = (globalThis as any).Deno.env.get('SUPABASE_URL');
    const supabaseKey = (globalThis as any).Deno.env.get('SUPABASE_ANON_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Check user authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Unauthorized');

    // This endpoint has no caller anywhere in the app and no data model that tracks
    // who is actually owed a payout (no earnings/commission/pending-payout table).
    // Previously it accepted any authenticated user's account details and amount and
    // paid them out from the merchant's live ContiPay account - a direct fund-drain
    // vulnerability. Disabled until a real payout-entitlement flow exists.
    throw new Error('Disbursements are not currently available');

    // Parse disbursement payload from request
    // Expected: { customer: {...}, transaction: {...}, accountDetails: {...} }
    const payload = await req.json();
    const { customer, transaction, accountDetails } = payload;

    if (!customer || !transaction || !accountDetails) {
      throw new Error('Missing required payout objects (customer, transaction, or accountDetails)');
    }

    // Config & Secrets
    const authKey = (globalThis as any).Deno.env.get('CONTIPAY_API_KEY');
    const apiSecret = (globalThis as any).Deno.env.get('CONTIPAY_API_SECRET');
    const merchantId = (globalThis as any).Deno.env.get('CONTIPAY_MERCHANT_ID');
    const privKeyPem = (globalThis as any).Deno.env.get('CONTIPAY_PRIVATE_KEY');
    const rawBaseUrl = (globalThis as any).Deno.env.get('CONTIPAY_BASE_URL') || 'https://api-uat.contipay.net';
    const baseUrl = (rawBaseUrl.startsWith('http') ? rawBaseUrl : `https://${rawBaseUrl}`).replace(/\/$/, '');

    if (!authKey || !apiSecret || !merchantId || !privKeyPem) {
      throw new Error('Disbursement configuration missing (API Key, Secret, Merchant ID, or Private Key)');
    }

    // --- CHECKSUM CALCULATION ---
    // Rule: authKey + reference + merchantId + accountNumber + amount
    const reference = transaction.reference || '';
    const accountNumber = accountDetails.accountNumber || 'null';
    const amount = transaction.amount !== undefined ? String(transaction.amount) : 'null';
    
    const dataToSign = `${authKey}${reference}${merchantId}${accountNumber}${amount}`;

    // --- RSA-SHA256 SIGNING ---
    // Prepare Private Key
    const pemHeader = "-----BEGIN PRIVATE KEY-----";
    const pemFooter = "-----END PRIVATE KEY-----";
    const pemContents = privKeyPem
      .replace(pemHeader, "")
      .replace(pemFooter, "")
      .replace(/\s/g, "");
    
    const binaryDerString = atob(pemContents);
    const binaryDer = new Uint8Array(binaryDerString.length);
    for (let i = 0; i < binaryDerString.length; i++) {
      binaryDer[i] = binaryDerString.charCodeAt(i);
    }

    const key = await crypto.subtle.importKey(
      "pkcs8",
      binaryDer.buffer,
      {
        name: "RSASSA-PKCS1-v1_5",
        hash: "SHA-256",
      },
      false,
      ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      key,
      new TextEncoder().encode(dataToSign)
    );

    const checksum = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));

    // --- EXECUTE DISBURSEMENT ---
    const basicAuth = btoa(`${authKey}:${apiSecret}`);
    const disburseUrl = `${baseUrl}/acquire/payment`; // Based on provided doc PUT /acquire/payment or POST /disburse/payment?
    // Note: The previous "Create Disbursement" snippet said POST /disburse/payment
    const finalUrl = `${baseUrl}/disburse/payment`;

    console.log(`Executing disbursement to ${finalUrl} for ref ${reference}`);

    const response = await fetch(finalUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${basicAuth}`,
        'checksum': checksum
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    console.log('ContiPay Disbursement Response:', JSON.stringify(result));

    if (!response.ok) {
        return new Response(JSON.stringify({ 
            success: false, 
            error: 'Disbursement request failed', 
            details: result 
        }), {
            status: response.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Disbursement Implementation Error:', err.message);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
