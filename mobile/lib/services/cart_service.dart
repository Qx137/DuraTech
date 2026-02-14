import '../core/supabase_client.dart';

class CartService {
  final _client = SupabaseConfig.client;

  Future<List<Map<String, dynamic>>> fetchCartItems() async {
    final user = _client.auth.currentUser;
    if (user == null) return [];

    final response = await _client
        .from('cart_items')
        .select('*, products(*)')
        .eq('user_id', user.id);

    return List<Map<String, dynamic>>.from(response);
  }

  Future<void> updateQuantity(String itemId, int quantity) async {
    if (quantity <= 0) {
      await _client.from('cart_items').delete().eq('id', itemId);
    } else {
      await _client
          .from('cart_items')
          .update({'quantity': quantity}).eq('id', itemId);
    }
  }

  Future<String> createOrder({
    required String email,
    required String firstName,
    required String lastName,
    required String phone,
    required String address,
    required String paymentMethod,
    required double total,
  }) async {
    final user = _client.auth.currentUser;
    if (user == null) throw Exception('User not logged in');

    // 1. Get cart items
    final cartItems = await fetchCartItems();
    if (cartItems.isEmpty) throw Exception('Cart is empty');

    // 2. Create Order
    final orderResponse = await _client
        .from('orders')
        .insert({
          'user_id': user.id,
          'total': total,
          'tax': total * 0.1, // Simplification
          'delivery_address': {
            'firstName': firstName,
            'lastName': lastName,
            'address': address,
            'phone': phone,
            'email': email,
          },
          'payment_method': paymentMethod,
          'status': 'pending',
          'payment_status': 'pending',
        })
        .select()
        .single();

    final orderId = orderResponse['id'];

    // 3. Create Order Items
    for (final item in cartItems) {
      await _client.from('order_items').insert({
        'order_id': orderId,
        'product_id': item['product_id'],
        'quantity': item['quantity'],
        'price': item['products']['price'],
      });
    }

    // 4. Create Delivery (minimal version)
    await _client.from('deliveries').insert({
      'order_id': orderId,
      'pickup_address': {'address': 'Framer Pickup'}, // Simplified
      'delivery_address': {
        'firstName': firstName,
        'lastName': lastName,
        'address': address,
        'phone': phone,
      },
      'status': 'pending',
      'bidding_enabled': false,
    });

    // 5. Clear Cart
    await _client.from('cart_items').delete().eq('user_id', user.id);

    return orderId;
  }
}
