// @ts-nocheck
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from '@supabase/supabase-js';

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

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) throw new Error('Unauthorized');

        const { orderId } = await req.json();
        if (!orderId) throw new Error('Missing orderId');

        // Verify order ownership
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('user_id, payment_status')
            .eq('id', orderId)
            .single();

        if (orderError || !order) throw new Error('Order not found');
        if (order.user_id !== user.id) throw new Error('Access denied');

        // If already completed in DB, just return that
        if (order.payment_status === 'completed') {
            return new Response(JSON.stringify({ status: 'paid', statusCode: 1 }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Otherwise, fetch latest status from ContiPay
        const apiKey = (globalThis as any).Deno.env.get('CONTIPAY_API_KEY');
        const apiSecret = (globalThis as any).Deno.env.get('CONTIPAY_API_SECRET');
        const merchantId = (globalThis as any).Deno.env.get('CONTIPAY_MERCHANT_ID');
        const rawBaseUrl = (globalThis as any).Deno.env.get('CONTIPAY_BASE_URL') || 'https://api-uat.contipay.net';
        const baseUrl = (rawBaseUrl.startsWith('http') ? rawBaseUrl : `https://${rawBaseUrl}`).replace(/\/$/, '');

        if (!apiKey || !apiSecret || !merchantId) throw new Error('Configuration error');

        const basicAuth = btoa(`${apiKey}:${apiSecret}`);
        const statusUrl = `${baseUrl}/acquire/payment?merchantId=${merchantId}&merchantRef=${orderId}`;

        console.log('Checking ContiPay status:', statusUrl);
        const response = await fetch(statusUrl, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Basic ${basicAuth}`,
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('ContiPay Status API error:', response.status, errorText);
            throw new Error('Status check failed');
        }

        const data = await response.json();
        console.log('ContiPay Status Response:', JSON.stringify(data));

        // If it's paid, we could trigger the update here too as a fallback, 
        // but the webhook should handle it. Returning the status is enough for the UI.
        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
