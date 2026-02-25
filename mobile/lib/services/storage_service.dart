import 'dart:io';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../core/supabase_client.dart';

class StorageService {
  final SupabaseClient _client = SupabaseConfig.client;

  Future<String> uploadProductImage(File file) async {
    final user = _client.auth.currentUser;
    if (user == null) throw Exception('User not logged in');

    final fileName = '${user.id}/${DateTime.now().millisecondsSinceEpoch}.jpg';

    await _client.storage.from('products').upload(
          fileName,
          file,
          fileOptions: const FileOptions(cacheControl: '3600', upsert: false),
        );

    return _client.storage.from('products').getPublicUrl(fileName);
  }

  Future<String> uploadDriverDoc(File file, String docType) async {
    final user = _client.auth.currentUser;
    if (user == null) throw Exception('User not logged in');

    final fileName =
        '${user.id}/$docType-${DateTime.now().millisecondsSinceEpoch}.jpg';

    await _client.storage.from('driver-docs').upload(
          fileName,
          file,
          fileOptions: const FileOptions(cacheControl: '3600', upsert: false),
        );

    return _client.storage.from('driver-docs').getPublicUrl(fileName);
  }

  Future<String> uploadKycDoc(File file, String docType) async {
    final user = _client.auth.currentUser;
    if (user == null) throw Exception('User not logged in');

    final fileName =
        '${user.id}/$docType-${DateTime.now().millisecondsSinceEpoch}.jpg';

    await _client.storage.from('kyc-documents').upload(
          fileName,
          file,
          fileOptions: const FileOptions(cacheControl: '3600', upsert: false),
        );

    return _client.storage.from('kyc-documents').getPublicUrl(fileName);
  }
}
