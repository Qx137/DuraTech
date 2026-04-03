// @ts-nocheck
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Paynow hashing function
function generateHash(values: Record<string, string>, integrationKey: string): string {
    const sortedKeys = Object.keys(values).filter(k => k !== 'hash').sort();
    let concatenatedString = '';
    
    for (const key of sortedKeys) {
        concatenatedString += values[key];
    }
    
    concatenatedString += integrationKey;
    
    return crypto.subtle.digest('SHA-512', new TextEncoder().encode(concatenatedString))
        .then(hashBuffer => {
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
        });
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        console.log('Paynow webhook received');

        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const integrationKey = Deno.env.get('PAYNOW_INTEGRATION_KEY');

        if (!supabaseUrl || !supabaseServiceKey || !integrationKey) {
            console.error('Supabase configuration or Paynow integration key missing');
            throw new Error('Supabase configuration missing');
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Paynow sends x-www-form-urlencoded data
        const bodyText = await req.text();
        console.log('Webhook payload raw:', bodyText);
        
        const params = new URLSearchParams(bodyText);
        const payload: Record<string, string> = {};
        for (const [key, value] of params.entries()) {
            payload[key] = value;
        }
        
        console.log('Webhook payload parsed:', JSON.stringify(payload, null, 2));

        const reference = payload.reference;
        const paynowReference = payload.paynowreference;
        const status = payload.status;
        const hash = payload.hash;

        if (!reference || !status || !hash) {
            console.error('Missing required webhook fields: reference, status, or hash');
            return new Response(
                JSON.stringify({ success: false, error: 'Invalid webhook payload' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Verify hash
        const expectedHash = await generateHash(payload, integrationKey);
        
        if (hash.toUpperCase() !== expectedHash) {
            console.error('Invalid webhook hash', { expected: expectedHash, received: hash });
            return new Response(
                JSON.stringify({ success: false, error: 'Invalid signature' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Idempotency check: prevent replay attacks
        const { data: existingLog } = await supabase
            .from('webhook_log')
            .select('id')
            .eq('webhook_reference', reference)
            .eq('webhook_status', status)
            .maybeSingle();

        if (existingLog) {
            console.log('Webhook already processed for reference:', reference, 'status:', status);
            return new Response(
                JSON.stringify({ success: true, message: 'Webhook already processed' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        let paymentStatus = 'pending';
        let orderStatus = 'pending';

        switch (status.toUpperCase()) {
            case 'PAID':
                paymentStatus = 'completed';
                orderStatus = 'confirmed';
                break;
            case 'AWAITING DELIVERY':
                paymentStatus = 'completed';
                orderStatus = 'confirmed';
                break;
            case 'DELIVERED':
                paymentStatus = 'completed';
                break;
            case 'CANCELLED':
            case 'REFUNDED':
                paymentStatus = 'failed';
                orderStatus = 'cancelled';
                break;
            case 'CREATED':
            case 'SENT':
                paymentStatus = 'pending';
                orderStatus = 'pending';
                break;
            default:
                console.warn('Unknown Paynow status:', status);
                paymentStatus = 'pending';
        }

        console.log(`Updating order ${reference} to payment_status: ${paymentStatus}, status: ${orderStatus}`);

        // Update order in database
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

        // Log webhook as processed
        await supabase
            .from('webhook_log')
            .insert({
                webhook_reference: reference,
                webhook_status: status,
            })
            .single();

        // If payment successful, send confirmation email
        if (paymentStatus === 'completed') {
            try {
                await supabase.functions.invoke('send-order-email', {
                    body: { orderId: reference, type: 'confirmation' }
                });
                console.log('Confirmation email sent for order:', reference);
            } catch (emailError) {
                console.error('Failed to send confirmation email:', emailError);
            }
        }

        return new Response(
            JSON.stringify({ success: true, message: 'Webhook processed' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error('Error processing Paynow webhook:', errorMessage);

        return new Response(
            JSON.stringify({ success: false, error: 'Webhook processing failed' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
