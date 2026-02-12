import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
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
        console.log('ContiPay webhook received');

        // Initialize Supabase with service role key for webhook processing
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !supabaseServiceKey) {
            console.error('Supabase configuration missing');
            throw new Error('Supabase configuration missing');
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Parse webhook payload
        const payload = await req.json();
        console.log('Webhook payload:', JSON.stringify(payload, null, 2));

        const { reference, status, amount, signature, transactionId } = payload;

        if (!reference || !status) {
            console.error('Missing required webhook fields');
            return new Response(
                JSON.stringify({ success: false, error: 'Invalid webhook payload' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Verify signature
        const apiSecret = Deno.env.get('CONTIPAY_API_SECRET');
        if (!apiSecret) {
            console.error('ContiPay API secret not configured');
            throw new Error('Configuration error');
        }

        // Create expected signature
        const dataToVerify = `${reference}${status}${amount || ''}`;
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

        if (signature && signature !== expectedSignatureHex) {
            console.error('Invalid webhook signature');
            return new Response(
                JSON.stringify({ success: false, error: 'Invalid signature' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Map ContiPay status to our order status
        let paymentStatus = 'pending';
        let orderStatus = 'pending';

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
