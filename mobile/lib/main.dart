import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'screens/marketplace/cart_screen.dart';
import 'screens/main_navigation.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/register_screen.dart';
import 'screens/dashboard/settings_screen.dart';
import 'services/auth_service.dart';
import 'core/supabase_client.dart';
import 'providers/cart_provider.dart';
import 'package:provider/provider.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await SupabaseConfig.initialize();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => CartProvider()..refreshCount()),
      ],
      child: const DuraHubApp(),
    ),
  );
}

class DuraHubApp extends StatelessWidget {
  const DuraHubApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'DuraHub',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF10B981),
          primary: const Color(0xFF10B981),
        ),
        textTheme: GoogleFonts.interTextTheme(),
        useMaterial3: true,
      ),
      initialRoute: AuthService().currentUser == null ? '/login' : '/',
      routes: {
        '/': (context) => const MainNavigation(),
        '/login': (context) => const LoginScreen(),
        '/register': (context) => const RegisterScreen(),
        '/cart': (context) => const CartScreen(),
        '/settings': (context) => const SettingsScreen(),
      },
    );
  }
}
