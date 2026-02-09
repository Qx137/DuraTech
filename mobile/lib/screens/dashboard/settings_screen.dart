import 'package:flutter/material.dart';
import '../../services/auth_service.dart';
import '../../theme/app_colors.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final _authService = AuthService();
  final _formKey = GlobalKey<FormState>();

  late TextEditingController _nameController;
  late TextEditingController _businessNameController;
  late TextEditingController _descriptionController;

  String _selectedRole = 'buyer';
  bool _isLoading = false;
  Map<String, dynamic>? _initialData;

  @override
  void initState() {
    super.initState();
    final user = _authService.currentUser;
    _initialData = {
      'name': user?.userMetadata?['name'] ?? '',
      'user_type': user?.userMetadata?['user_type'] ?? 'buyer',
      'business_name': user?.userMetadata?['business_name'] ?? '',
      'description': user?.userMetadata?['description'] ?? '',
    };

    _nameController = TextEditingController(text: _initialData!['name']);
    _businessNameController =
        TextEditingController(text: _initialData!['business_name']);
    _descriptionController =
        TextEditingController(text: _initialData!['description']);
    _selectedRole = _initialData!['user_type'];
  }

  @override
  void dispose() {
    _nameController.dispose();
    _businessNameController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _handleSave() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);
    try {
      // 1. Update Profile Information
      await _authService.updateProfile(
        name: _nameController.text,
        businessName:
            _selectedRole == 'seller' ? _businessNameController.text : null,
        description:
            _selectedRole == 'seller' ? _descriptionController.text : null,
      );

      // 2. Update Role if changed
      if (_selectedRole != _initialData!['user_type']) {
        await _authService.updateRole(_selectedRole);
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Settings saved successfully!')),
        );
        Navigator.pop(context, true); // Return true to indicate refresh needed
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error saving settings: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings',
            style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Profile Information',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(
                  labelText: 'Full Name',
                  prefixIcon: Icon(Icons.person_outline),
                ),
                validator: (val) => val == null || val.isEmpty
                    ? 'Please enter your name'
                    : null,
              ),
              const SizedBox(height: 32),
              const Text(
                'Account Type',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              const Text(
                'Switch between buyer and seller roles. As a seller, you can list products.',
                style: TextStyle(color: Colors.grey, fontSize: 13),
              ),
              const SizedBox(height: 16),
              _buildRoleOption('buyer', 'Buyer', Icons.shopping_bag_outlined,
                  'Browse and purchase products'),
              const SizedBox(height: 12),
              _buildRoleOption('seller', 'Seller', Icons.storefront_outlined,
                  'List and sell your products'),
              if (_selectedRole == 'seller') ...[
                const SizedBox(height: 32),
                const Text(
                  'Business Information',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _businessNameController,
                  decoration: const InputDecoration(
                    labelText: 'Business Name',
                    prefixIcon: Icon(Icons.business_outlined),
                  ),
                  validator: (val) =>
                      _selectedRole == 'seller' && (val == null || val.isEmpty)
                          ? 'Please enter business name'
                          : null,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _descriptionController,
                  decoration: const InputDecoration(
                    labelText: 'Business Description',
                    prefixIcon: Icon(Icons.description_outlined),
                  ),
                  maxLines: 3,
                ),
              ],
              const SizedBox(height: 48),
              ElevatedButton(
                onPressed: _isLoading ? null : _handleSave,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.emerald,
                  foregroundColor: Colors.white,
                  minimumSize: const Size(double.infinity, 55),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
                child: _isLoading
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text('Save Settings',
                        style: TextStyle(
                            fontSize: 16, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRoleOption(
      String role, String title, IconData icon, String subtitle) {
    final isSelected = _selectedRole == role;
    return InkWell(
      onTap: () => setState(() => _selectedRole = role),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          border: Border.all(
            color: isSelected ? AppColors.emerald : Colors.grey[300]!,
            width: 2,
          ),
          borderRadius: BorderRadius.circular(12),
          color: isSelected
              ? AppColors.emeraldLight.withValues(alpha: 0.1)
              : Colors.transparent,
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: isSelected ? AppColors.emeraldLight : Colors.grey[100],
                shape: BoxShape.circle,
              ),
              child: Icon(icon,
                  color: isSelected ? AppColors.emerald : Colors.grey),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title,
                      style: const TextStyle(fontWeight: FontWeight.bold)),
                  Text(subtitle,
                      style: const TextStyle(color: Colors.grey, fontSize: 12)),
                ],
              ),
            ),
            if (isSelected)
              const Icon(Icons.check_circle, color: AppColors.emerald),
          ],
        ),
      ),
    );
  }
}
