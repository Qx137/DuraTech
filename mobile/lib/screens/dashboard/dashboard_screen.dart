import 'package:flutter/material.dart';
import '../../core/supabase_client.dart';
import '../../services/auth_service.dart';
import 'seller_inventory_screen.dart';
import 'driver_deliveries_screen.dart';
import 'add_product_screen.dart';
import 'driver_docs_screen.dart';
import 'delivery_history_screen.dart';
import 'earnings_screen.dart';
import 'my_orders_screen.dart';
import 'coming_soon_screen.dart';
import '../../theme/app_colors.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final _authService = AuthService();
  Map<String, dynamic>? _profile;
  bool _isLoading = true;
  String _driverStatus = 'offline';

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    final user = _authService.currentUser;
    setState(() {
      _profile = {
        'name': user?.userMetadata?['name'] ?? 'User',
        'email': user?.email,
        'user_type': user?.userMetadata?['user_type'] ?? 'buyer',
      };
    });

    if (_profile?['user_type'] == 'driver') {
      await _loadDriverStatus();
    }

    setState(() => _isLoading = false);
  }

  Future<void> _loadDriverStatus() async {
    final user = _authService.currentUser;
    if (user == null) return;
    try {
      final response = await SupabaseConfig.client
          .from('drivers')
          .select('status')
          .eq('user_id', user.id)
          .single();
      setState(() => _driverStatus = response['status'] ?? 'offline');
    } catch (e) {
      debugPrint('Error loading driver status: $e');
    }
  }

  Future<void> _updateDriverStatus(String status) async {
    final user = _authService.currentUser;
    if (user == null) return;
    setState(() => _driverStatus = status);
    try {
      await SupabaseConfig.client
          .from('drivers')
          .update({'status': status}).eq('user_id', user.id);
    } catch (e) {
      debugPrint('Error updating driver status: $e');
    }
  }

  Widget _buildDriverStatusToggle() {
    final isOnline = _driverStatus == 'available';
    final isBusy = _driverStatus == 'busy';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Container(
                width: 12,
                height: 12,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isOnline
                      ? Colors.green
                      : (isBusy ? Colors.orange : Colors.grey),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                'Status: ${_driverStatus.toUpperCase()}',
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
            ],
          ),
          Switch(
            value: isOnline,
            onChanged: (val) {
              _updateDriverStatus(val ? 'available' : 'offline');
            },
            activeColor: AppColors.emerald,
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    final userType = _profile?['user_type'] ?? 'buyer';

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'My Dashboard',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () async {
              final result = await Navigator.pushNamed(context, '/settings');
              if (result == true) {
                _loadProfile(); // Refresh dashboard data if settings were saved
              }
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildProfileCard(),
            if (_profile?['user_type'] == 'driver') ...[
              const SizedBox(height: 16),
              _buildDriverStatusToggle(),
            ],
            const SizedBox(height: 24),
            Text(
              'Quick Actions',
              style: Theme.of(
                context,
              ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            if (userType == 'buyer') _buildBuyerActions(),
            if (userType == 'seller') _buildSellerActions(),
            if (userType == 'driver') _buildDriverActions(),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: () async {
                await _authService.signOut();
                if (mounted) {
                  // ignore: use_build_context_synchronously
                  Navigator.pushReplacementNamed(context, '/login');
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red[50],
                foregroundColor: Colors.red,
                minimumSize: const Size(double.infinity, 50),
              ),
              child: const Text('Sign Out'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileCard() {
    return Card(
      elevation: 0,
      color: AppColors.emeraldLight,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Row(
          children: [
            CircleAvatar(
              radius: 30,
              backgroundColor: AppColors.emerald,
              child: Text(
                _profile?['name']?[0] ?? 'U',
                style: const TextStyle(
                  fontSize: 24,
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            const SizedBox(width: 16),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _profile?['name'] ?? 'User',
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(_profile?['email'] ?? ''),
                const SizedBox(height: 4),
                Chip(
                  label: Text(_profile?['user_type'].toUpperCase()),
                  backgroundColor: AppColors.emeraldLight,
                  labelStyle: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBuyerActions() {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 1.5,
      children: [
        _actionCard(
          Icons.shopping_bag,
          'My Orders',
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const MyOrdersScreen()),
            );
          },
        ),
        _actionCard(
          Icons.favorite,
          'Wishlist',
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => const ComingSoonScreen(title: 'Wishlist'),
              ),
            );
          },
        ),
        _actionCard(
          Icons.location_on,
          'Addresses',
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) =>
                    const ComingSoonScreen(title: 'Addresses'),
              ),
            );
          },
        ),
        _actionCard(
          Icons.payment,
          'Payments',
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => const ComingSoonScreen(title: 'Payments'),
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildSellerActions() {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 1.5,
      children: [
        _actionCard(
          Icons.add_box,
          'Add Product',
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const AddProductScreen()),
            );
          },
        ),
        _actionCard(
          Icons.inventory,
          'My Inventory',
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => const SellerInventoryScreen(),
              ),
            );
          },
        ),
        _actionCard(
          Icons.analytics,
          'Sales Reports',
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) =>
                    const ComingSoonScreen(title: 'Sales Reports'),
              ),
            );
          },
        ),
        _actionCard(
          Icons.verified_user,
          'Verification',
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) =>
                    const ComingSoonScreen(title: 'Verification'),
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildDriverActions() {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 1.5,
      children: [
        _actionCard(
          Icons.delivery_dining,
          'Active Deliveries',
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => const DriverDeliveriesScreen(),
              ),
            );
          },
        ),
        _actionCard(
          Icons.history,
          'Delivery History',
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => const DeliveryHistoryScreen(),
              ),
            );
          },
        ),
        _actionCard(
          Icons.account_balance_wallet,
          'Earnings',
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const EarningsScreen()),
            );
          },
        ),
        _actionCard(
          Icons.verified,
          'Driver Docs',
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => const DriverDocsScreen(),
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _actionCard(IconData icon, String label, {VoidCallback? onTap}) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey[200]!),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: AppColors.emerald, size: 28),
            const SizedBox(height: 8),
            Text(
              label,
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
            ),
          ],
        ),
      ),
    );
  }
}
