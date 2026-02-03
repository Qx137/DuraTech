import 'package:supabase_flutter/supabase_flutter.dart';

class SupabaseConfig {
  static const String url = 'https://wutfcyskvfkunmvrvafz.supabase.co';
  static const String anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1dGZjeXNrdmZrdW5tdnJ2YWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTg0NzAsImV4cCI6MjA2ODI3NDQ3MH0.R0ogVNfrpZJUV9SK2J2ZjdGU8a6_lyx_UxX-vDOdSQ4';

  static Future<void> initialize() async {
    await Supabase.initialize(
      url: url,
      anonKey: anonKey,
    );
  }

  static SupabaseClient get client => Supabase.instance.client;
}
