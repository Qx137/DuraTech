import 'package:supabase_flutter/supabase_flutter.dart';
import '../core/supabase_client.dart';

class AuthService {
  final SupabaseClient _client = SupabaseConfig.client;

  Future<AuthResponse> signUp({
    required String email,
    required String password,
    required String name,
    required String userType,
    String? businessName,
    String? description,
  }) async {
    return await _client.auth.signUp(
      email: email,
      password: password,
      data: {
        'name': name,
        'user_type': userType,
        'business_name': businessName,
        'description': description,
      },
    );
  }

  Future<AuthResponse> signIn({
    required String email,
    required String password,
  }) async {
    return await _client.auth.signInWithPassword(
      email: email,
      password: password,
    );
  }

  Future<void> resetPassword(String email) async {
    await _client.auth.resetPasswordForEmail(email);
  }

  Future<void> signOut() async {
    await _client.auth.signOut();
  }

  Future<void> updateProfile({
    String? name,
    String? businessName,
    String? description,
  }) async {
    final user = currentUser;
    if (user == null) throw Exception('User not logged in');

    final updates = {
      if (name != null) 'name': name,
      if (businessName != null) 'business_name': businessName,
      if (description != null) 'description': description,
    };

    if (updates.isEmpty) return;

    // 1. Update Auth Metadata
    await _client.auth.updateUser(UserAttributes(data: updates));

    // 2. Update Profiles Table
    await _client.from('profiles').update(updates).eq('id', user.id);
  }

  Future<void> updateRole(String newRole, {String? businessName, String? description}) async {
    final user = currentUser;
    if (user == null) throw Exception('User not logged in');

    // Use edge function for secure role change
    final response = await _client.functions.invoke('update-user-role', body: {
      'role': newRole,
      if (businessName != null) 'business_name': businessName,
      if (description != null) 'description': description,
    });

    if (response.status != 200) {
      throw Exception('Failed to update role');
    }
  }

  User? get currentUser => _client.auth.currentUser;

  Session? get currentSession => _client.auth.currentSession;

  Stream<AuthState> get authStateChanges => _client.auth.onAuthStateChange;
}
