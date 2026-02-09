import 'package:flutter/material.dart';
import '../../services/auth_service.dart';
import '../../theme/app_colors.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _authService = AuthService();

  String _userType = 'buyer';
  bool _isLoading = false;

  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _businessNameController = TextEditingController();

  Future<void> _handleRegister() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      await _authService.signUp(
        email: _emailController.text.trim(),
        password: _passwordController.text.trim(),
        name: _nameController.text.trim(),
        userType: _userType,
        businessName:
            _userType != 'buyer' ? _businessNameController.text.trim() : null,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content:
                  Text('Registration successful! Please check your email.')),
        );
        Navigator.pushReplacementNamed(context, '/');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text('Error: ${e.toString()}'),
              backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 400),
            child: Card(
              elevation: 4,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16)),
              child: Padding(
                padding: const EdgeInsets.all(32.0),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Image.asset(
                        'assets/images/logo.png',
                        height: 64,
                        semanticLabel: 'DuraHub Logo',
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Create Account',
                        style: Theme.of(context)
                            .textTheme
                            .headlineSmall
                            ?.copyWith(fontWeight: FontWeight.bold),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 24),
                      const Text('I want to:',
                          style: TextStyle(fontWeight: FontWeight.w500)),
                      const SizedBox(height: 8),
                      _buildUserTypeSelector(),
                      const SizedBox(height: 24),
                      _buildTextField(
                          _nameController, 'Full Name', Icons.person),
                      const SizedBox(height: 16),
                      _buildTextField(
                          _emailController, 'Email Address', Icons.email),
                      const SizedBox(height: 16),
                      _buildTextField(
                          _passwordController, 'Password', Icons.lock,
                          isPassword: true),
                      if (_userType != 'buyer') ...[
                        const SizedBox(height: 16),
                        _buildTextField(
                            _businessNameController,
                            _userType == 'seller'
                                ? 'Farm/Business Name'
                                : 'Service Name',
                            _userType == 'seller'
                                ? Icons.store
                                : Icons.local_shipping),
                      ],
                      const SizedBox(height: 32),
                      ElevatedButton(
                        onPressed: _isLoading ? null : _handleRegister,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.emerald,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8)),
                        ),
                        child: _isLoading
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(
                                    color: Colors.white, strokeWidth: 2))
                            : const Text('Create Account',
                                style: TextStyle(
                                    fontSize: 16, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildUserTypeSelector() {
    return Column(
      children: [
        _userTypeRadio('buyer', 'Buy', Icons.shopping_cart),
        const SizedBox(height: 8),
        _userTypeRadio('seller', 'Sell', Icons.agriculture),
        const SizedBox(height: 8),
        _userTypeRadio('driver', 'Deliver', Icons.local_shipping),
      ],
    );
  }

  Widget _userTypeRadio(String value, String label, IconData icon) {
    final isSelected = _userType == value;
    return InkWell(
      onTap: () => setState(() => _userType = value),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          border: Border.all(
              color: isSelected ? AppColors.emerald : Colors.grey.shade300,
              width: 2),
          borderRadius: BorderRadius.circular(8),
          color: isSelected
              ? AppColors.emerald.withValues(alpha: 0.05)
              : Colors.transparent,
        ),
        child: Row(
          children: [
            Icon(icon, color: isSelected ? AppColors.emerald : Colors.grey),
            const SizedBox(width: 12),
            Text(label,
                style: TextStyle(
                    fontWeight:
                        isSelected ? FontWeight.bold : FontWeight.normal)),
            const Spacer(),
            if (isSelected)
              const Icon(Icons.check_circle,
                  color: AppColors.emerald, size: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildTextField(
      TextEditingController controller, String label, IconData icon,
      {bool isPassword = false}) {
    return TextFormField(
      controller: controller,
      obscureText: isPassword,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
      ),
      validator: (value) =>
          value == null || value.isEmpty ? 'Field required' : null,
    );
  }
}
