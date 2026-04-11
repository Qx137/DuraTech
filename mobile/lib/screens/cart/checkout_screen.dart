import 'package:flutter/material.dart';
import 'dart:async';
import '../../services/cart_service.dart';
import '../../services/contipay_service.dart';
import '../../services/paynow_service.dart';
import '../../theme/app_colors.dart';
import 'package:provider/provider.dart';
import '../../providers/cart_provider.dart';
import '../../services/auth_service.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';

class CheckoutScreen extends StatefulWidget {
  final List<Map<String, dynamic>> items;
  final double totalPrice;

  const CheckoutScreen({
    super.key,
    required this.items,
    required this.totalPrice,
  });

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final _service = CartService();
  final _contipayService = ContiPayService();
  final _paynowService = PaynowService();
  final _authService = AuthService();
  final _emailController = TextEditingController();
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();

  String _paymentMethod = 'contipay';
  bool _isLoading = false;
  bool _isLocating = false;

  @override
  void initState() {
    super.initState();
    _autoFillCredentials();
  }

  Future<void> _autoFillCredentials() async {
    final user = _authService.currentUser;
    if (user != null) {
      setState(() {
        _emailController.text = user.email ?? '';
        final name = user.userMetadata?['name'] as String? ?? '';
        final nameParts = name.split(' ');
        if (nameParts.isNotEmpty) {
          _firstNameController.text = nameParts.first;
          if (nameParts.length > 1) {
            _lastNameController.text = nameParts.sublist(1).join(' ');
          }
        }
      });
    }
  }

  Future<void> _getCurrentLocation() async {
    setState(() => _isLocating = true);
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        throw Exception('Location services are disabled.');
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          throw Exception('Location permissions are denied');
        }
      }

      if (permission == LocationPermission.deniedForever) {
        throw Exception(
            'Location permissions are permanently denied, we cannot request permissions.');
      }

      Position position = await Geolocator.getCurrentPosition(
          locationSettings: LocationSettings(accuracy: LocationAccuracy.high));

      List<Placemark> placemarks =
          await placemarkFromCoordinates(position.latitude, position.longitude);

      if (placemarks.isNotEmpty) {
        Placemark place = placemarks[0];
        setState(() {
          _addressController.text =
              '${place.street}, ${place.locality}, ${place.country}';
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error getting location: $e')));
      }
    } finally {
      if (mounted) setState(() => _isLocating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Checkout')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _sectionTitle('Contact Information'),
            const SizedBox(height: 12),
            TextField(
              controller: _emailController,
              decoration: const InputDecoration(
                labelText: 'Email Address',
                prefixIcon: Icon(Icons.email_outlined),
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _firstNameController,
                    decoration: const InputDecoration(labelText: 'First Name'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextField(
                    controller: _lastNameController,
                    decoration: const InputDecoration(labelText: 'Last Name'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _phoneController,
              decoration: const InputDecoration(
                labelText: 'Phone Number',
                prefixIcon: Icon(Icons.phone_outlined),
              ),
            ),
            const SizedBox(height: 24),
            _sectionTitle('Delivery Address'),
            const SizedBox(height: 12),
            TextField(
              controller: _addressController,
              decoration: InputDecoration(
                labelText: 'Shipping Address',
                prefixIcon: const Icon(Icons.location_on_outlined),
                hintText: 'Unit number, street, city...',
                suffixIcon: IconButton(
                  icon: _isLocating
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2))
                      : const Icon(Icons.my_location, color: AppColors.emerald),
                  onPressed: _isLocating ? null : _getCurrentLocation,
                  tooltip: 'Use current location',
                ),
              ),
              maxLines: 2,
            ),
            const SizedBox(height: 24),
            _sectionTitle('Payment Method'),
            const SizedBox(height: 12),
            _paymentOption(
                'contipay',
                'ContiPay (EcoCash, OneMoney, InnBucks, ZIPIT, Card)',
                Icons.payment),
            const SizedBox(height: 12),
            _paymentOption(
                'paynow',
                'Paynow (EcoCash, OneMoney, InnBucks, Visa / MC)',
                Icons.security),
            const SizedBox(height: 32),
            _orderSummary(),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: _isLoading ? null : _handleCheckout,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.emerald,
                foregroundColor: Colors.white,
                minimumSize: const Size(double.infinity, 55),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: _isLoading
                  ? const CircularProgressIndicator(color: Colors.white)
                  : const Text(
                      'Complete Order & Pay',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
            ),
            const SizedBox(height: 48),
          ],
        ),
      ),
    );
  }

  Widget _sectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
    );
  }

  Widget _paymentOption(String value, String label, IconData icon) {
    final isSelected = _paymentMethod == value;
    return InkWell(
      onTap: () => setState(() => _paymentMethod = value),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          border: Border.all(
            color: isSelected ? AppColors.emerald : Colors.grey[300]!,
            width: 2,
          ),
          borderRadius: BorderRadius.circular(12),
          color: isSelected
              ? AppColors.emerald.withValues(alpha: 0.05)
              : Colors.transparent,
        ),
        child: Row(
          children: [
            Icon(icon, color: isSelected ? AppColors.emerald : Colors.grey),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                ),
              ),
            ),
            if (isSelected)
              const Icon(Icons.check_circle, color: AppColors.emerald),
          ],
        ),
      ),
    );
  }

  Widget _orderSummary() {
    return Column(
      children: [
        const Divider(),
        const SizedBox(height: 16),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Total Amount',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            Text(
              '\$${widget.totalPrice.toStringAsFixed(2)}',
              style: const TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: AppColors.emerald,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Future<bool> _showShippingWarning(double itemsTotal, double total) async {
    int countdown = 3;

    return await showDialog<bool>(
          context: context,
          barrierDismissible: false,
          builder: (context) {
            return StatefulBuilder(
              builder: (context, setDialogState) {
                // Timer will be managed by a simple delayed future for the countdown
                return AlertDialog(
                  title: const Row(
                    children: [
                      Icon(Icons.warning_amber_rounded, color: Colors.orange),
                      SizedBox(width: 8),
                      Text('High Delivery Cost'),
                    ],
                  ),
                  content: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'The delivery and tax costs for this order are high compared to the item value.',
                        style: TextStyle(fontWeight: FontWeight.w500),
                      ),
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.orange.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.orange.withOpacity(0.2)),
                        ),
                        child: Column(
                          children: [
                            _costRow('Cart Items', itemsTotal),
                            _costRow('Delivery & Tax', total - itemsTotal),
                            const Divider(),
                            _costRow('Total Cost', total, isBold: true),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'This often happens when ordering from multiple distant farmers. Do you want to proceed?',
                        style: TextStyle(fontSize: 12, color: Colors.grey),
                      ),
                    ],
                  ),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(context, false),
                      child: const Text('Review Order'),
                    ),
                    _CountdownButton(
                      countdown: countdown,
                      onPressed: () => Navigator.pop(context, true),
                      onCountdownComplete: () {
                        if (context.mounted) {
                          setDialogState(() {
                            countdown = 0;
                          });
                        }
                      },
                    ),
                  ],
                );
              },
            );
          },
        ) ??
        false;
  }

  Widget _costRow(String label, double amount, {bool isBold = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label,
              style: TextStyle(
                  fontWeight: isBold ? FontWeight.bold : FontWeight.normal)),
          Text('\$${amount.toStringAsFixed(2)}',
              style: TextStyle(
                  fontWeight: isBold ? FontWeight.bold : FontWeight.normal)),
        ],
      ),
    );
  }

  Future<void> _handleCheckout() async {
    if (_emailController.text.isEmpty ||
        _firstNameController.text.isEmpty ||
        _addressController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill in all required fields')),
      );
      return;
    }

    final itemsTotal = widget.items.fold<double>(
      0.0,
      (sum, item) => sum + (item['products']['price'] * item['quantity']),
    );

    if (widget.totalPrice > itemsTotal * 1.5) {
      final confirmed = await _showShippingWarning(itemsTotal, widget.totalPrice);
      if (!confirmed) return;
    }

    setState(() => _isLoading = true);
    try {
      // 1. Create the order
      final orderId = await _service.createOrder(
        email: _emailController.text,
        firstName: _firstNameController.text,
        lastName: _lastNameController.text,
        phone: _phoneController.text,
        address: _addressController.text,
        paymentMethod: _paymentMethod,
        total: widget.totalPrice,
      );

      if (mounted) {
        context.read<CartProvider>().refreshCount();
      }

      // 2. Initiate Payment if ContiPay or Paynow is selected
      if (_paymentMethod == 'contipay') {
        await _contipayService.initiatePayment(
          orderId: orderId,
          amount: widget.totalPrice,
          email: _emailController.text,
          customerName:
              '${_firstNameController.text} ${_lastNameController.text}',
          phone: _phoneController.text,
        );
      } else if (_paymentMethod == 'paynow') {
        await _paynowService.initiatePayment(
          orderId: orderId,
          amount: widget.totalPrice,
          email: _emailController.text,
          customerName:
              '${_firstNameController.text} ${_lastNameController.text}',
          phone: _phoneController.text,
        );
      }

      if (mounted) {
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (context) => AlertDialog(
            title: const Text('Order Placed!'),
            content: const Text(
              'Your order has been initiated. Please complete the payment in the browser window that opened. You can track your delivery in the dashboard once payment is confirmed.',
            ),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.of(context).popUntil((route) => route.isFirst);
                },
                child: const Text('Back to Shopping'),
              ),
            ],
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  void dispose() {
    _emailController.dispose();
    _firstNameController.dispose();
    _lastNameController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    super.dispose();
  }
}

class _CountdownButton extends StatefulWidget {
  final int countdown;
  final VoidCallback onPressed;
  final VoidCallback onCountdownComplete;

  const _CountdownButton({
    required this.countdown,
    required this.onPressed,
    required this.onCountdownComplete,
  });

  @override
  State<_CountdownButton> createState() => _CountdownButtonState();
}

class _CountdownButtonState extends State<_CountdownButton> {
  late int _currentCountdown;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _currentCountdown = widget.countdown;
    _startTimer();
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted) {
        if (_currentCountdown > 0) {
          setState(() {
            _currentCountdown--;
          });
        } else {
          _timer?.cancel();
          widget.onCountdownComplete();
        }
      } else {
        _timer?.cancel();
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: _currentCountdown > 0 ? null : widget.onPressed,
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.emerald,
        foregroundColor: Colors.white,
      ),
      child: Text(_currentCountdown > 0
          ? 'Wait ${_currentCountdown}s...'
          : 'Proceed Anyway'),
    );
  }
}

