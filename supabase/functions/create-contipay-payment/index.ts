
import { createClient } from '@supabase/supabase-js';

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
    };

    // Return mapped message or generic error
    return errorMap[error] || 'Payment processing failed. Please try again.';
}

Deno.serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // 1. Verify authentication
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            console.error('Missing authorization header');
            throw new Error('Missing authorization header');
        }

        // 2. Initialize Supabase with user's JWT
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
        let { orderId, amount, email, phone, customerName } = body as PaymentRequest;
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
            console.error('Order lookup failed:', orderError);
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

        // Get ContiPay credentials from environment
        const apiKey = Deno.env.get('CONTIPAY_API_KEY');
        const apiSecret = Deno.env.get('CONTIPAY_API_SECRET');
        const baseUrl = Deno.env.get('CONTIPAY_BASE_URL') || 'https://api.contipay.co.zw';

        if (!apiKey || !apiSecret) {
            console.error('ContiPay credentials not configured');
            throw new Error('ContiPay credentials not configured');
        }

        // Create payment request to ContiPay
        const returnUrl = `${Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '') || 'https://wutfcyskvfkunmvrvafz.lovable.app'}/payment-success?orderId=${orderId}`;
        const resultUrl = `${supabaseUrl}/functions/v1/contipay-webhook`;

        const paymentData = {
            apiKey: apiKey,
            amount: amount.toFixed(2),
            reference: orderId,
            email: email,
            phone: phone || '',
            customerName: customerName,
            returnUrl: returnUrl,
            resultUrl: resultUrl,
            description: `Payment for order ${orderId}`
        };

        // Create HMAC signature
        const dataToSign = `${apiKey}${amount.toFixed(2)}${orderId}${email}`;
        const encoder = new TextEncoder();
        const keyData = encoder.encode(apiSecret);
        const messageData = encoder.encode(dataToSign);

        const cryptoKey = await crypto.subtle.importKey(
            'raw',
            keyData,
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );

        const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
        const signatureArray = Array.from(new Uint8Array(signature));
        const signatureHex = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');

        // Add signature to payment data
        const finalPaymentData = {
            ...paymentData,
            signature: signatureHex
        };

        console.log('Sending request to ContiPay:', baseUrl);

        // Send request to ContiPay
        const contiPayResponse = await fetch(`${baseUrl}/acquire/payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(finalPaymentData)
        });

        if (!contiPayResponse.ok) {
            const errorText = await contiPayResponse.text();
            console.error('ContiPay API error:', contiPayResponse.status, errorText);
            throw new Error('Payment gateway temporarily unavailable');
        }

        const responseData = await contiPayResponse.json();
        console.log('ContiPay response received');

        if (responseData.success && responseData.paymentUrl) {
            // Update order with ContiPay reference
            await supabase
                .from('orders')
                .update({ payment_method: 'contipay' })
                .eq('id', orderId);

            return new Response(
                JSON.stringify({
                    success: true,
                    paymentUrl: responseData.paymentUrl,
                    reference: orderId
                }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            );
        } else {
            console.error('ContiPay returned error:', responseData.error || responseData.message);
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Payment initialization failed. Please try again.'
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
