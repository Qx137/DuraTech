import 'package:flutter/foundation.dart';
import 'package:url_launcher/url_launcher.dart';
import '../core/supabase_client.dart';

class PaynowService {
  final _client = SupabaseConfig.client;

  Future<void> initiatePayment({
    required String orderId,
    required double amount,
    required String email,
    required String customerName,
    String? phone,
  }) async {
    try {
      final response = await _client.functions.invoke(
        'create-paynow-payment',
        body: {
          'orderId': orderId,
          'amount': amount,
          'email': email,
          'customerName': customerName,
          'phone': phone,
        },
      );

      final data = response.data;

      if (data != null &&
          data['success'] == true &&
          data['paymentUrl'] != null) {
        final url = Uri.parse(data['paymentUrl']);
        if (await canLaunchUrl(url)) {
          await launchUrl(url, mode: LaunchMode.externalApplication);
        } else {
          throw Exception('Could not launch payment URL');
        }
      } else {
        throw Exception(data?['error'] ?? 'Payment initialization failed');
      }
    } catch (e) {
      debugPrint('Error initiating Paynow payment: $e');
      rethrow;
    }
  }
}
