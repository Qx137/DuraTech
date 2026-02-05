import '../core/supabase_client.dart';

class DeliveryService {
  final _client = SupabaseConfig.client;

  Future<List<Map<String, dynamic>>> fetchDriverDeliveries() async {
    final user = _client.auth.currentUser;
    if (user == null) return [];

    // First find the driver_id associated with this user
    final driverResponse = await _client
        .from('drivers')
        .select('id')
        .eq('user_id', user.id)
        .single();

    final driverId = driverResponse['id'];

    final response = await _client
        .from('deliveries')
        .select('*, orders(*)')
        .eq('driver_id', driverId)
        .order('created_at', ascending: false);

    return List<Map<String, dynamic>>.from(response);
  }

  Future<void> updateDeliveryStatus(String deliveryId, String status) async {
    await _client
        .from('deliveries')
        .update({'status': status}).eq('id', deliveryId);
  }

  Future<List<Map<String, dynamic>>> fetchDeliveryHistory() async {
    final user = _client.auth.currentUser;
    if (user == null) return [];

    final driverResponse = await _client
        .from('drivers')
        .select('id')
        .eq('user_id', user.id)
        .single();
    final driverId = driverResponse['id'];

    final response = await _client
        .from('deliveries')
        .select('*, orders(*)')
        .eq('driver_id', driverId)
        .inFilter('status', ['delivered', 'cancelled']).order('created_at',
            ascending: false);

    return List<Map<String, dynamic>>.from(response);
  }

  Future<Map<String, dynamic>> fetchDriverEarnings() async {
    final user = _client.auth.currentUser;
    if (user == null) return {'total': 0.0, 'recent': []};

    final driverResponse = await _client
        .from('drivers')
        .select('id')
        .eq('user_id', user.id)
        .single();
    final driverId = driverResponse['id'];

    // Get all completed deliveries
    final response = await _client
        .from('deliveries')
        .select('estimated_price, created_at')
        .eq('driver_id', driverId)
        .eq('status', 'delivered')
        .order('created_at', ascending: false);

    double total = 0.0;
    for (var delivery in response) {
      if (delivery['estimated_price'] != null) {
        total += (delivery['estimated_price'] as num).toDouble();
      }
    }

    return {
      'total': total,
      'recent': List<Map<String, dynamic>>.from(response),
    };
  }
}
