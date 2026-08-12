// @ts-nocheck
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from '@supabase/supabase-js';

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
    returnUrl?: string;
}

// Map internal errors to safe client messages
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
        'ContiPay credentials not configured': 'Payment service temporarily unavailable',
        'Payment gateway temporarily unavailable': 'The payment gateway is temporarily unavailable. Please try again in a few moments.',
    };

    // Return mapped message or generic error
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

        // 2. Initialize Supabase with user's JWT
        const supabaseUrl = (globalThis as any).Deno.env.get('SUPABASE_URL');
        const supabaseKey = (globalThis as any).Deno.env.get('SUPABASE_ANON_KEY');

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
        let { orderId, deliveryId, amount, email, phone, customerName, returnUrl: clientReturnUrl } = body as PaymentRequest;
        if (typeof amount === 'string') {
            amount = parseFloat(amount);
        }
        if (typeof amount !== 'number' || Number.isNaN(amount)) {
            console.error('Invalid amount received:', body.amount);
            throw new Error('Invalid amount');
        }

        console.log('Creating ContiPay payment for user:', user.id, 'order:', orderId);

        // 4. Verify order ownership and get actual amount
        const orderRes: any = await (supabase
            .from('orders')
            .select('id, user_id, total, payment_status')
            .eq('id', orderId)
            .single() as any);
        const order = orderRes.data;
        const orderError = orderRes.error;

        if (orderError || !order) {
            console.error('Order lookup failed:', orderError, 'for orderId:', orderId);
            throw new Error('Order not found');
        }

        console.log('Order found:', JSON.stringify(order));

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

        let expectedTotal = order.total;
        
        // If a deliveryId is provided, factor in the delivery estimated price.
        // Look it up by orderId (not just its own id) so a caller can't point at an
        // unrelated delivery to manipulate the expected total.
        if (deliveryId) {
            const deliveryRes: any = await (supabase
                .from('deliveries')
                .select('estimated_price')
                .eq('id', deliveryId)
                .eq('order_id', orderId)
                .single() as any);

            if (deliveryRes.data?.estimated_price) {
                expectedTotal += Number(deliveryRes.data.estimated_price);
            }
        }

        // 7. Verify amount matches (prevent price manipulation)
        if (Math.abs(expectedTotal - amount) > 0.01) {
            console.error('Amount mismatch - requested:', amount, 'expected:', expectedTotal, 'db_order_total:', order.total);
            throw new Error('Amount mismatch');
        }

        // Get ContiPay credentials from environment
        const apiKey = (globalThis as any).Deno.env.get('CONTIPAY_API_KEY');
        const apiSecret = (globalThis as any).Deno.env.get('CONTIPAY_API_SECRET');
        const merchantIdRaw = (globalThis as any).Deno.env.get('CONTIPAY_MERCHANT_ID');
        // Official ContiPay URLs: 
        // TEST: https://api-uat.contipay.net
        // LIVE: https://api.contipay.net (or https://api-v2.contipay.co.zw)
        const rawBaseUrl = (globalThis as any).Deno.env.get('CONTIPAY_BASE_URL') || 'https://api-uat.contipay.net';
        // Ensure baseUrl has a protocol and remove trailing slash
        const baseUrl = (rawBaseUrl.startsWith('http') ? rawBaseUrl : `https://${rawBaseUrl}`).replace(/\/$/, '');

        if (!apiKey || !apiSecret || !merchantIdRaw) {
            console.error('ContiPay credentials not configured correctly. Missing:', !apiKey ? 'API_KEY' : '', !apiSecret ? 'API_SECRET' : '', !merchantIdRaw ? 'MERCHANT_ID' : '');
            throw new Error('ContiPay credentials not configured');
        }

        const merchantId = parseInt(merchantIdRaw, 10);
        if (isNaN(merchantId)) {
            console.error('Invalid CONTIPAY_MERCHANT_ID: must be a number');
            throw new Error('ContiPay credentials not configured');
        }

        // Determine frontend return URL
        let frontendUrl = (globalThis as any).Deno.env.get('FRONTEND_URL') || (globalThis as any).Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '') || 'https://wutfcyskvfkunmvrvafz.lovable.app';
        if (frontendUrl.includes('.supabase.co')) {
            frontendUrl = 'https://wutfcyskvfkunmvrvafz.lovable.app';
        }
        
        let returnUrl = clientReturnUrl;
        if (!returnUrl) {
            returnUrl = `${frontendUrl}/payment-success?orderId=${orderId}`;
        }
        else if (!returnUrl.includes('?')) {
            returnUrl = `${returnUrl}?orderId=${orderId}`;
        }
        const resultUrl = `${(globalThis as any).Deno.env.get('SUPABASE_URL')}/functions/v1/contipay-webhook`;

        // Split customer name into first/last
        const nameParts = customerName.trim().split(' ');
        const firstName = nameParts[0] || 'Customer';
        const lastName = nameParts.slice(1).join(' ') || '';

        const paymentData = {
            webhookUrl: resultUrl,
            successUrl: returnUrl,
            cancelUrl: returnUrl,
            description: `Payment for order ${orderId}`.substring(0, 100),
            amount: parseFloat(amount.toFixed(2)),
            reference: orderId,
            merchantId: merchantId,
            currencyCode: 'USD',
            customer: {
                firstName: firstName || 'Customer',
                surname: lastName || 'N/A',
                middleName: '',
                email: email,
                cell: phone && phone.trim() !== '' ? phone : '0000000000',
                countryCode: 'ZW',
                nationalId: '', // Optional/Placeholder
            },
        };

        console.log('Sending request to ContiPay:', baseUrl);
        console.log('Final Payment Data:', JSON.stringify(paymentData));

        // Use Basic Auth with token (apiKey) and secret (apiSecret) per ContiPay JS client
        const basicAuth = btoa(`${apiKey}:${apiSecret}`);

        // Send redirect payment request to ContiPay
        const contiPayResponse = await fetch(`${baseUrl}/acquire/payment`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Basic ${basicAuth}`,
            },
            body: JSON.stringify(paymentData)
        });

        if (!contiPayResponse.ok) {
            const errorText = await contiPayResponse.text();
            console.error('ContiPay API error:', contiPayResponse.status, errorText);
            throw new Error('Payment gateway temporarily unavailable');
        }

        const responseData = await contiPayResponse.json();
        console.log('ContiPay response received:', JSON.stringify(responseData));

        // ContiPay redirect responses may return a URL in different fields
        const paymentUrl = responseData.paymentUrl || responseData.url || responseData.redirectUrl || responseData.redirect_url;

        if (paymentUrl) {
            // Update order with ContiPay reference
            await supabase
                .from('orders')
                .update({ payment_method: 'contipay' })
                .eq('id', orderId);

            return new Response(
                JSON.stringify({
                    success: true,
                    paymentUrl: paymentUrl,
                    reference: orderId
                }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            );
        } else {
            console.error('ContiPay returned no payment URL:', JSON.stringify(responseData));
            return new Response(
                JSON.stringify({
                    success: false,
                    error: responseData.message || responseData.error || 'Payment initialization failed. Please try again.'
                }),
                {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            );
        }

    } catch (err) {
        const internalError = err instanceof Error ? err.message : String(err);
        console.error('Error creating ContiPay payment:', internalError);

        // Return safe error message to client
        const safeMessage = getSafeErrorMessage(internalError);
        const status = internalError.includes('Access denied') ? 403 :
            internalError.includes('Unauthorized') ? 401 : 400;

        // Log detailed error server-side for debugging
        console.error('Payment error context:', JSON.stringify({
            internalError,
            userId: typeof user !== 'undefined' ? user?.id : 'unknown',
            timestamp: new Date().toISOString()
        }));

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
