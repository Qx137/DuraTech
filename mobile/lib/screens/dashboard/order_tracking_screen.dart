import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/supabase_client.dart';
import '../../theme/app_colors.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

class OrderTrackingScreen extends StatefulWidget {
  final String orderId;

  const OrderTrackingScreen({super.key, required this.orderId});

  @override
  State<OrderTrackingScreen> createState() => _OrderTrackingScreenState();
}

class _OrderTrackingScreenState extends State<OrderTrackingScreen> {
  final _supabase = SupabaseConfig.client;
  Map<String, dynamic>? _order;
  Map<String, dynamic>? _delivery;
  Map<String, dynamic>? _driver;
  bool _isLoading = true;
  RealtimeChannel? _subscription;

  @override
  void initState() {
    super.initState();
    _loadData();
    _setupSubscription();
  }

  @override
  void dispose() {
    _subscription?.unsubscribe();
    super.dispose();
  }

  void _setupSubscription() {
    _subscription = _supabase
        .channel('order_tracking_${widget.orderId}')
        .onPostgresChanges(
          event: PostgresChangeEvent.update,
          schema: 'public',
          table: 'orders',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'id',
            value: widget.orderId,
          ),
          callback: (payload) {
            if (mounted) {
              setState(() {
                _order = payload.newRecord;
              });
            }
          },
        )
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'deliveries',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'order_id',
            value: widget.orderId,
          ),
          callback: (payload) {
            _loadData(); // Re-fetch all data to get joined relations if delivery updates
          },
        )
        .subscribe();
  }

  Future<void> _loadData() async {
    try {
      final orderResponse = await _supabase
          .from('orders')
          .select('*, order_items(*, products(*))')
          .eq('id', widget.orderId)
          .single();

      final deliveryResponse = await _supabase
          .from('deliveries')
          .select('*, drivers(*, profiles:user_id(name))')
          .eq('order_id', widget.orderId)
          .maybeSingle();

      setState(() {
        _order = orderResponse;
        _delivery = deliveryResponse;
        if (deliveryResponse != null && deliveryResponse['drivers'] != null) {
          _driver = deliveryResponse['drivers'];
        }
        _isLoading = false;
      });
    } catch (e) {
      debugPrint('Error loading tracking data: $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    if (_order == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Track Order')),
        body: const Center(child: Text('Order not found')),
      );
    }

    final status = _order!['status'] ?? 'pending';

    return Scaffold(
      appBar: AppBar(
        title: Text('Order #${widget.orderId.substring(0, 8).toUpperCase()}'),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildStatusHeader(status),
            const SizedBox(height: 32),
            _buildTrackingTimeline(status),
            if (_driver != null) ...[
              const SizedBox(height: 32),
              _buildDriverInfo(),
            ],
            const SizedBox(height: 32),
            _buildOrderInfo(),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusHeader(String status) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.emerald.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.emerald.withValues(alpha: 0.2)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: const BoxDecoration(
              color: AppColors.emerald,
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.local_shipping, color: Colors.white),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _getStatusText(status),
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppColors.emerald,
                  ),
                ),
                if (_delivery?['estimated_delivery_time'] != null)
                  Text(
                    'Estimated: ${DateFormat('hh:mm a').format(DateTime.parse(_delivery!['estimated_delivery_time']))}',
                    style: TextStyle(color: Colors.grey[600], fontSize: 13),
                  )
                else
                  Text(
                    'Updated: ${DateFormat('hh:mm a').format(DateTime.parse(_order!['updated_at']))}',
                    style: TextStyle(color: Colors.grey[600], fontSize: 13),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTrackingTimeline(String currentStatus) {
    final stages = [
      {'id': 'pending', 'label': 'Order Placed'},
      {'id': 'confirmed', 'label': 'Confirmed'},
      {'id': 'preparing', 'label': 'Preparing'},
      {'id': 'ready_for_delivery', 'label': 'Ready for Delivery'},
      {'id': 'out_for_delivery', 'label': 'Out for Delivery'},
      {'id': 'delivered', 'label': 'Delivered'},
    ];

    int currentIndex = stages.indexWhere((s) => s['id'] == currentStatus);
    if (currentIndex == -1) currentIndex = 0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Delivery Status',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 20),
        ...List.generate(stages.length, (index) {
          final isCompleted = index <= currentIndex;
          final isLast = index == stages.length - 1;

          return IntrinsicHeight(
            child: Row(
              children: [
                Column(
                  children: [
                    Container(
                      width: 24,
                      height: 24,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color:
                            isCompleted ? AppColors.emerald : Colors.grey[200],
                        border: Border.all(
                          color: isCompleted
                              ? AppColors.emerald
                              : Colors.grey[300]!,
                        ),
                      ),
                      child: isCompleted
                          ? const Icon(Icons.check,
                              size: 14, color: Colors.white)
                          : null,
                    ),
                    if (!isLast)
                      Expanded(
                        child: Container(
                          width: 2,
                          color: isCompleted
                              ? AppColors.emerald
                              : Colors.grey[200],
                        ),
                      ),
                  ],
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Padding(
                    padding: EdgeInsets.only(bottom: isLast ? 0 : 20),
                    child: Text(
                      stages[index]['label']!,
                      style: TextStyle(
                        fontWeight:
                            isCompleted ? FontWeight.bold : FontWeight.normal,
                        color: isCompleted ? Colors.black87 : Colors.grey,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          );
        }),
      ],
    );
  }

  Widget _buildDriverInfo() {
    final driverName = _driver!['profiles']?['name'] ?? 'Driver';
    final vehicle = _driver!['vehicle_type'] ?? 'Vehicle';
    final phone = _driver!['phone'];

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: Colors.grey[200]!),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Row(
              children: [
                CircleAvatar(
                  backgroundColor: AppColors.emerald.withValues(alpha: 0.1),
                  child: const Icon(Icons.person, color: AppColors.emerald),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        driverName,
                        style: const TextStyle(
                            fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                      Text(
                        vehicle,
                        style: TextStyle(color: Colors.grey[600], fontSize: 12),
                      ),
                    ],
                  ),
                ),
                if (phone != null)
                  IconButton(
                    icon: const Icon(Icons.phone, color: AppColors.emerald),
                    onPressed: () => launchUrl(Uri.parse('tel:$phone')),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOrderInfo() {
    final address =
        _order!['delivery_address']?['address'] ?? 'No address provided';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Delivery Details',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Icon(Icons.location_on, size: 20, color: Colors.grey),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                address,
                style: TextStyle(color: Colors.grey[700]),
              ),
            ),
          ],
        ),
      ],
    );
  }

  String _getStatusText(String status) {
    switch (status) {
      case 'pending':
        return 'Order Placed';
      case 'confirmed':
        return 'Preparing your Order';
      case 'preparing':
        return 'Packaging Items';
      case 'ready_for_delivery':
        return 'Ready for Pickup';
      case 'out_for_delivery':
        return 'Driver is on the way';
      case 'delivered':
        return 'Successfully Delivered';
      default:
        return 'Processing';
    }
  }
}
