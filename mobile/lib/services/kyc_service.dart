import 'package:supabase_flutter/supabase_flutter.dart';
import '../core/supabase_client.dart';

class KycService {
  final SupabaseClient _client = SupabaseConfig.client;

  Future<String> getKycStatus() async {
    final user = _client.auth.currentUser;
    if (user == null) return 'none';

    final response = await _client
        .from('profiles')
        .select('kyc_status')
        .eq('id', user.id)
        .single();

    return response['kyc_status'] ?? 'none';
  }

  Future<Map<String, dynamic>?> getKycVerification() async {
    final user = _client.auth.currentUser;
    if (user == null) return null;

    try {
      final response = await _client
          .from('kyc_verifications')
          .select()
          .eq('user_id', user.id)
          .maybeSingle();
      return response;
    } catch (e) {
      return null;
    }
  }

  Future<void> submitKyc({
    required String idType,
    required String idFrontUrl,
    String? idBackUrl,
    required String selfieUrl,
  }) async {
    final user = _client.auth.currentUser;
    if (user == null) throw Exception('User not logged in');

    // 1. Upsert KYC Verification record
    await _client.from('kyc_verifications').upsert({
      'user_id': user.id,
      'id_type': idType,
      'id_front_url': idFrontUrl,
      'id_back_url': idBackUrl,
      'selfie_url': selfieUrl,
      'status': 'pending',
      'updated_at': DateTime.now().toIso8601String(),
    });

    // 2. Update Profile status
    await _client.from('profiles').update({
      'kyc_status': 'pending',
    }).eq('id', user.id);

    // 3. Update Auth Metadata (optional but helpful for dashboard)
    await _client.auth
        .updateUser(UserAttributes(data: {'kyc_status': 'pending'}));
  }
}
