// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function timingSafeEqualHex(a: string, b: string): boolean {
    const normalizedA = a.toLowerCase();
    const normalizedB = b.toLowerCase();
    let diff = normalizedA.length ^ normalizedB.length;
    const maxLength = Math.max(normalizedA.length, normalizedB.length);

    for (let i = 0; i < maxLength; i++) {
        diff |= (normalizedA.charCodeAt(i) || 0) ^ (normalizedB.charCodeAt(i) || 0);
    }

    return diff === 0;
}

serve(async (req: Request) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        console.log('ContiPay webhook received');

        // Initialize Supabase with service role key for webhook processing
        const supabaseUrl = (globalThis as any).Deno.env.get('SUPABASE_URL');
        const supabaseServiceKey = (globalThis as any).Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !supabaseServiceKey) {
            console.error('Supabase configuration missing');
            throw new Error('Supabase configuration missing');
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Parse webhook payload
        const payload = await req.json();
        console.log('Webhook payload:', JSON.stringify(payload, null, 2));

        // Official spec uses merchantRef for our orderId, but reference might also be sent
        const reference = payload.merchantRef || payload.reference;
        const status = payload.status;
        const statusCode = payload.statusCode;
        const amount = payload.amount;
        const signature = payload.signature;
        const statusForSignature = status ?? String(statusCode);

        if (!reference || (!status && statusCode === undefined)) {
            console.error('Missing required webhook fields: reference/merchantRef or status/statusCode');
            return new Response(
                JSON.stringify({ success: false, error: 'Invalid webhook payload' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const apiSecret = (globalThis as any).Deno.env.get('CONTIPAY_API_SECRET');
        if (!apiSecret) {
            console.error('ContiPay API secret not configured');
            throw new Error('Configuration error');
        }

        // Create expected signature
        const dataToVerify = `${reference}${statusForSignature}${amount || ''}`;
        const encoder = new TextEncoder();
        const keyData = encoder.encode(apiSecret);
        const messageData = encoder.encode(dataToVerify);

        const cryptoKey = await crypto.subtle.importKey(
            'raw',
            keyData,
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );

        const expectedSignature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
        const expectedSignatureArray = Array.from(new Uint8Array(expectedSignature));
        const expectedSignatureHex = expectedSignatureArray.map(b => b.toString(16).padStart(2, '0')).join('');

        if (!signature || typeof signature !== 'string' || !timingSafeEqualHex(signature, expectedSignatureHex)) {
            console.error('Invalid webhook signature');
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
            .eq('webhook_status', status || String(statusCode))
            .maybeSingle();

        if (existingLog) {
            console.log('Webhook already processed for reference:', reference, 'status:', status || statusCode);
            return new Response(
                JSON.stringify({ success: true, message: 'Webhook already processed' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Map ContiPay status/statusCode to our order status
        let paymentStatus = 'pending';
        let orderStatus = 'pending';

        // Use statusCode if available (1 = paid/success, 4 = declined/failed)
        if (statusCode !== undefined) {
            const code = Number(statusCode);
            if (code === 1) {
                paymentStatus = 'completed';
                orderStatus = 'confirmed';
            } else if (code === 4 || code === 5) {
                paymentStatus = 'failed';
                orderStatus = 'cancelled';
            }
        } else if (status) {
            // Fallback to string status if statusCode is missing
            switch (status.toUpperCase()) {
                case 'SUCCESSFUL':
                case 'COMPLETED':
                case 'PAID':
                    paymentStatus = 'completed';
                    orderStatus = 'confirmed';
                    break;
                case 'FAILED':
                case 'CANCELLED':
                case 'DECLINED':
                    paymentStatus = 'failed';
                    orderStatus = 'cancelled';
                    break;
                case 'PENDING':
                    paymentStatus = 'pending';
                    orderStatus = 'pending';
                    break;
                default:
                    console.warn('Unknown ContiPay status:', status);
                    paymentStatus = 'pending';
            }
        }

        // Verify the callback amount against server-side order data before changing payment state.
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('id, total, payment_status')
            .eq('id', reference)
            .single();

        if (orderError || !order) {
            console.error('Order lookup failed for webhook reference:', reference, orderError);
            return new Response(
                JSON.stringify({ success: false, error: 'Order not found' }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        let expectedTotal = Number(order.total);
        const { data: delivery } = await supabase
            .from('deliveries')
            .select('estimated_price')
            .eq('order_id', reference)
            .maybeSingle();

        if (delivery?.estimated_price) {
            expectedTotal += Number(delivery.estimated_price);
        }

        const callbackAmount = Number(amount);
        if ((paymentStatus === 'completed' || paymentStatus === 'failed') && (!Number.isFinite(callbackAmount) || Math.abs(callbackAmount - expectedTotal) > 0.01)) {
            console.error('Webhook amount mismatch - received:', amount, 'expected:', expectedTotal, 'order:', reference);
            return new Response(
                JSON.stringify({ success: false, error: 'Invalid amount' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
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

        // Log webhook as processed to prevent replays
        await supabase
            .from('webhook_log')
            .insert({
                webhook_reference: reference,
                webhook_status: status || String(statusCode),
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
                // Don't fail the webhook if email fails
            }
        }

        console.log('Webhook processed successfully');

        return new Response(
            JSON.stringify({ success: true, message: 'Webhook processed' }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error('Error processing ContiPay webhook:', errorMessage);

        return new Response(
            JSON.stringify({
                success: false,
                error: 'Webhook processing failed'
            }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    }
});
