import '../core/supabase_client.dart';

class OrderService {
  final _client = SupabaseConfig.client;

  Future<List<Map<String, dynamic>>> fetchBuyerOrders() async {
    final user = _client.auth.currentUser;
    if (user == null) return [];

    final response = await _client
        .from('orders')
        .select('*, order_items(*, products(*))')
        .eq('user_id', user.id)
        .order('created_at', ascending: false);

    return List<Map<String, dynamic>>.from(response);
  }

  Future<List<Map<String, dynamic>>> fetchSellerOrders() async {
    final user = _client.auth.currentUser;
    if (user == null) return [];

    // This is more complex as we need items belonging to this seller's products
    final response = await _client
        .from('order_items')
        .select('*, orders(*, profiles(name)), products(*)')
        .eq('products.seller_id', user.id)
        .order('created_at', ascending: false);

    return List<Map<String, dynamic>>.from(response);
  }

  Future<Map<String, dynamic>> fetchSellerStats() async {
    final user = _client.auth.currentUser;
    if (user == null) return {};

    final orders = await fetchSellerOrders();

    double totalRevenue = 0;
    int totalSales = 0;

    for (var item in orders) {
      if (item['orders']['status'] != 'cancelled') {
        totalRevenue += (item['price'] as num).toDouble() *
            (item['quantity'] as num).toInt();
        totalSales += (item['quantity'] as num).toInt();
      }
    }

    return {
      'total_revenue': totalRevenue,
      'total_sales': totalSales,
      'order_count': orders.length,
    };
  }
}
