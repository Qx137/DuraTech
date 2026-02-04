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
}
