import 'package:flutter/material.dart';
import '../core/supabase_client.dart';

class CartProvider extends ChangeNotifier {
  final _client = SupabaseConfig.client;
  int _itemCount = 0;

  int get itemCount => _itemCount;

  Future<void> refreshCount() async {
    final user = _client.auth.currentUser;
    if (user == null) {
      _itemCount = 0;
      notifyListeners();
      return;
    }

    try {
      final response = await _client
          .from('cart_items')
          .select('quantity')
          .eq('user_id', user.id);

      final items = response as List;
      _itemCount =
          items.fold<int>(0, (sum, item) => sum + (item['quantity'] as int));
      notifyListeners();
    } catch (e) {
      debugPrint('Error refreshing cart count: $e');
    }
  }

  void updateCount(int count) {
    _itemCount = count;
    notifyListeners();
  }
}
