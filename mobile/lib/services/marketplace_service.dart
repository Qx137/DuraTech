import '../core/supabase_client.dart';
import '../models/product.dart';

class MarketplaceService {
  final _client = SupabaseConfig.client;

  Future<List<Product>> fetchProducts() async {
    final response = await _client
        .from('products')
        .select('*, profiles(name, business_name, kyc_status)')
        .order('created_at', ascending: false);

    return (response as List).map((data) => Product.fromMap(data)).toList();
  }

  Future<void> addToCart(String productId, int quantity) async {
    final user = _client.auth.currentUser;
    if (user == null) throw Exception('User not logged in');

    // Check if item already exists
    final existingItems = await _client
        .from('cart_items')
        .select()
        .eq('user_id', user.id)
        .eq('product_id', productId);

    if (existingItems.isEmpty) {
      await _client.from('cart_items').insert({
        'user_id': user.id,
        'product_id': productId,
        'quantity': quantity,
      });
    } else {
      final existingQuantity = existingItems[0]['quantity'] as int;
      await _client
          .from('cart_items')
          .update({'quantity': existingQuantity + quantity}).eq(
              'id', existingItems[0]['id']);
    }
  }

  Future<List<Product>> fetchSellerProducts(String sellerId) async {
    final response = await _client
        .from('products')
        .select('*, profiles(name, business_name, kyc_status)')
        .eq('seller_id', sellerId)
        .order('created_at', ascending: false);

    return (response as List).map((data) => Product.fromMap(data)).toList();
  }

  Future<void> addProduct(Map<String, dynamic> productData) async {
    final user = _client.auth.currentUser;
    if (user == null) throw Exception('User not logged in');

    await _client.from('products').insert({
      ...productData,
      'seller_id': user.id,
    });
  }

  Future<List<Map<String, dynamic>>> fetchProductReviews(String productId) async {
    final response = await _client
        .from('product_reviews')
        .select()
        .eq('product_id', productId)
        .order('created_at', ascending: false);

    final reviews = List<Map<String, dynamic>>.from(response as List);
    if (reviews.isEmpty) return reviews;

    final userIds = reviews.map((r) => r['user_id'] as String).toSet().toList();
    final profilesRes = await _client
        .from('profiles')
        .select('id, name')
        .inFilter('id', userIds);

    final profileMap = {
      for (final p in profilesRes as List)
        p['id'] as String: p['name'] as String?
    };

    for (final r in reviews) {
      r['author_name'] = profileMap[r['user_id']] ?? 'Anonymous';
    }
    return reviews;
  }

  Future<void> submitReview(
    String productId,
    int rating,
    String? reviewText,
  ) async {
    final user = _client.auth.currentUser;
    if (user == null) throw Exception('User not logged in');

    await _client.from('product_reviews').insert({
      'product_id': productId,
      'user_id': user.id,
      'rating': rating,
      'review_text': reviewText,
    });
  }
}
