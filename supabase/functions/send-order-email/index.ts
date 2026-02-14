
import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  orderId: string;
  type: 'confirmation' | 'status_update' | 'cancellation';
}

// Map internal errors to safe client messages
function getSafeErrorMessage(error: string): string {
  const errorMap: Record<string, string> = {
    'Missing authorization header': 'Authentication required',
    'Unauthorized': 'Authentication required',
    'Missing orderId or type': 'Invalid request',
    'Order not found': 'Unable to process request',
    'You are not authorized to send emails for this order': 'Access denied',
    'Invalid email type': 'Invalid request',
  };

  for (const [pattern, message] of Object.entries(errorMap)) {
    if (error.includes(pattern)) {
      return message;
    }
  }

  return 'Unable to process request. Please try again.';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create client with user's JWT to verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Client for verifying user auth
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    console.log('Authenticated user:', user.id);

    // Service role client for privileged operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { orderId, type }: EmailRequest = await req.json();

    if (!orderId || !type) {
      console.error('Missing required fields:', { orderId, type });
      return new Response(
        JSON.stringify({ error: 'Invalid request' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('Processing email request for order:', orderId, 'Type:', type);

    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        profiles!orders_user_id_fkey (
          name,
          email
        ),
        order_items (
          quantity,
          price,
          products (
            name,
            unit
          )
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Order fetch error:', orderError);
      return new Response(
        JSON.stringify({ error: 'Unable to process request' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // AUTHORIZATION CHECK: Verify the user owns this order
    if (order.user_id !== user.id) {
      console.error('Authorization failed: User', user.id, 'does not own order', orderId);
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    console.log('Authorization passed. Preparing email for order:', orderId);

    // Generate email content based on type
    let subject = '';
    let htmlContent = '';

    switch (type) {
      case 'confirmation':
        subject = `Order Confirmation - #${orderId.slice(-8).toUpperCase()}`;
        htmlContent = generateConfirmationEmail(order);
        break;
      case 'status_update':
        subject = `Order Status Update - #${orderId.slice(-8).toUpperCase()}`;
        htmlContent = generateStatusUpdateEmail(order);
        break;
      case 'cancellation':
        subject = `Order Cancelled - #${orderId.slice(-8).toUpperCase()}`;
        htmlContent = generateCancellationEmail(order);
        break;
      default:
        console.error('Invalid email type:', type);
        return new Response(
          JSON.stringify({ error: 'Invalid request' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }

    console.log('Email prepared successfully');

    // Note: To actually send emails, integrate with a service like Resend
    // For now, we just log the email content

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email notification prepared'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    const internalError = error.message || String(error);
    console.error('Error in send-order-email:', internalError);

    const safeMessage = getSafeErrorMessage(internalError);

    return new Response(
      JSON.stringify({ error: safeMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

function generateConfirmationEmail(order: any): string {
  const items = order.order_items
    .map((item: any) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          ${item.products.name}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
          ${item.quantity} ${item.products.unit}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
          $${(item.price * item.quantity).toFixed(2)}
        </td>
      </tr>
    `)
    .join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Order Confirmation</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0;">Order Confirmed! 🎉</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Thank you for your order</p>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Hi ${order.profiles?.name || 'Customer'},</p>
            <p>We've received your order and we're getting it ready for delivery!</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="margin: 0 0 10px 0; color: #10b981;">Order #${order.id.slice(-8).toUpperCase()}</h2>
              <p style="color: #6b7280; margin: 0;">Order Date: ${new Date(order.created_at).toLocaleDateString()}</p>
            </div>
            
            <h3 style="color: #374151; margin: 20px 0 10px 0;">Order Details</h3>
            <table style="width: 100%; background: white; border-radius: 8px; overflow: hidden;">
              <thead>
                <tr style="background: #f3f4f6;">
                  <th style="padding: 10px; text-align: left;">Item</th>
                  <th style="padding: 10px; text-align: center;">Quantity</th>
                  <th style="padding: 10px; text-align: right;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${items}
                <tr style="font-weight: bold; background: #f9fafb;">
                  <td colspan="2" style="padding: 15px;">Total</td>
                  <td style="padding: 15px; text-align: right; color: #10b981;">$${order.total.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #374151; margin: 0 0 10px 0;">Delivery Address</h3>
              <p style="margin: 0; color: #6b7280;">${order.delivery_address?.address || 'Address not provided'}</p>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              If you have any questions, please don't hesitate to contact us.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function generateStatusUpdateEmail(order: any): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Order Status Update</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0;">Order Status Update</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Hi ${order.profiles?.name || 'Customer'},</p>
            <p>Your order status has been updated:</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <h2 style="margin: 0 0 10px 0;">Order #${order.id.slice(-8).toUpperCase()}</h2>
              <div style="display: inline-block; padding: 10px 20px; background: #10b981; color: white; border-radius: 20px; font-weight: bold; text-transform: uppercase;">
                ${order.status}
              </div>
            </div>
            
            <p style="color: #6b7280;">
              We'll keep you updated on your order's progress. Thank you for your patience!
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function generateCancellationEmail(order: any): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Order Cancelled</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0;">Order Cancelled</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Hi ${order.profiles?.name || 'Customer'},</p>
            <p>Your order has been cancelled as requested.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="margin: 0 0 10px 0;">Order #${order.id.slice(-8).toUpperCase()}</h2>
              <p style="color: #6b7280; margin: 0;">Total: $${order.total.toFixed(2)}</p>
            </div>
            
            <p style="color: #6b7280;">
              If you paid for this order, a refund will be processed within 5-7 business days.
            </p>
            
            <p style="color: #6b7280;">
              We hope to serve you again in the future!
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}
