// @ts-nocheck
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js';
import { Paynow } from 'npm:paynow';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface PaymentRequest {
    orderId: string;
    amount: number;
    email: string;
    phone?: string;
    customerName: string;
}

function getSafeErrorMessage(error: string): string {
    const errorMap: Record<string, string> = {
        'Missing authorization header': 'Authentication required',
        'Unauthorized': 'Authentication required',
        'Supabase configuration missing': 'Service temporarily unavailable',
        'Invalid amount': 'Invalid payment amount',
        'Order not found': 'Unable to process payment',
        'Access denied: Order belongs to another user': 'Unable to process payment',
        'Order already paid': 'This order has already been paid',
        'Amount mismatch': 'Unable to process payment',
        'Paynow credentials not configured': 'Payment service temporarily unavailable',
        'Payment gateway temporarily unavailable': 'The payment gateway is temporarily unavailable. Please try again in a few moments.',
    };

    return errorMap[error] || 'Payment processing failed. Please try again.';
}

serve(async (req: Request) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // 1. Verify authentication
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            console.error('Missing authorization header');
            throw new Error('Missing authorization header');
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');

        if (!supabaseUrl || !supabaseKey) {
            console.error('Supabase configuration missing');
            throw new Error('Supabase configuration missing');
        }

        const supabase = createClient(supabaseUrl, supabaseKey, {
            global: { headers: { Authorization: authHeader } }
        });

        // 3. Get authenticated user
        const userResult = await supabase.auth.getUser();
        const user = userResult.data?.user;
        const userError = userResult.error;
        if (userError || !user) {
            console.error('User authentication failed:', userError);
            throw new Error('Unauthorized');
        }

        // Parse and validate input
        const body = await req.json();
        console.log('Request body:', JSON.stringify(body));
        let { orderId, amount, email, phone, customerName } = body as PaymentRequest;
        if (typeof amount === 'string') {
            amount = parseFloat(amount);
        }
        if (typeof amount !== 'number' || Number.isNaN(amount)) {
            console.error('Invalid amount received:', body.amount);
            throw new Error('Invalid amount');
        }

        console.log('Creating Paynow payment for user:', user.id, 'order:', orderId);

        // 4. Verify order ownership and get actual amount
        const orderRes: any = await supabase
            .from('orders')
            .select('id, user_id, total, payment_status')
            .eq('id', orderId)
            .single();

        const order = orderRes.data;
        const orderError = orderRes.error;

        if (orderError || !order) {
            console.error('Order lookup failed:', orderError, 'for orderId:', orderId);
            throw new Error('Order not found');
        }

        // 5. Verify user owns this order
        if (order.user_id !== user.id) {
            console.error('User', user.id, 'attempted to access order belonging to', order.user_id);
            throw new Error('Access denied: Order belongs to another user');
        }

        // 6. Verify order hasn't been paid
        if (order.payment_status === 'completed') {
            console.error('Order already paid:', orderId);
            throw new Error('Order already paid');
        }

        // 7. Verify amount matches (prevent price manipulation)
        if (Math.abs(order.total - amount) > 0.01) {
            console.error('Amount mismatch - requested:', amount, 'actual:', order.total);
            throw new Error('Amount mismatch');
        }

        // Get Paynow credentials from environment
        const integrationId = Deno.env.get('PAYNOW_INTEGRATION_ID');
        const integrationKey = Deno.env.get('PAYNOW_INTEGRATION_KEY');

        if (!integrationId || !integrationKey) {
            console.error('Paynow credentials not configured correctly. Missing:', !integrationId ? 'INTEGRATION_ID' : '', !integrationKey ? 'INTEGRATION_KEY' : '');
            throw new Error('Paynow credentials not configured');
        }

        // Configure Paynow instance
        const paynow = new Paynow(integrationId, integrationKey);
        
        let frontendUrl = Deno.env.get('FRONTEND_URL') || supabaseUrl.replace('/rest/v1', '');
        if (frontendUrl.includes('.supabase.co')) {
            // Fallback if FRONTEND_URL is not set and it's a supabase URL
            frontendUrl = 'https://wutfcyskvfkunmvrvafz.lovable.app';
        }
        
        paynow.resultUrl = `${supabaseUrl}/functions/v1/paynow-webhook`;
        paynow.returnUrl = `${frontendUrl}/payment-success?orderId=${orderId}`;

        // Create a new Payment
        const payment = paynow.createPayment(orderId, email);
        payment.add(`Payment for order ${orderId}`, amount);

        console.log('Sending request to Paynow...');
        
        // Send request to Paynow
        const response = await paynow.send(payment);
        
        if (response.success) {
            const redirectUrl = response.redirectUrl;
            console.log('Paynow response successful!', redirectUrl);

            // Update order with Paynow info
            await supabase
                .from('orders')
                .update({ payment_method: 'paynow' })
                .eq('id', orderId);

            return new Response(
                JSON.stringify({
                    success: true,
                    paymentUrl: redirectUrl,
                    reference: orderId,
                    pollUrl: response.pollUrl
                }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            );
        } else {
            console.error('Paynow API error:', response.error);
            return new Response(
                JSON.stringify({
                    success: false,
                    error: response.error || 'Payment gateway temporarily unavailable'
                }),
                {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            );
        }

    } catch (err) {
        const internalError = err instanceof Error ? err.message : String(err);
        console.error('Error creating Paynow payment:', internalError);

        // Return safe error message to client
        const safeMessage = getSafeErrorMessage(internalError);
        const status = internalError.includes('Access denied') ? 403 :
            internalError.includes('Unauthorized') ? 401 : 400;

        return new Response(
            JSON.stringify({
                success: false,
                error: safeMessage
            }),
            {
                status,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    }
});
