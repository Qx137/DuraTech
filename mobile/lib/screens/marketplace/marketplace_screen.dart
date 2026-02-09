import 'package:flutter/material.dart';
import '../../models/product.dart';
import '../../services/marketplace_service.dart';
import '../../theme/app_colors.dart';
import 'product_detail_screen.dart';
import 'package:provider/provider.dart';
import '../../providers/cart_provider.dart';

class MarketplaceScreen extends StatefulWidget {
  const MarketplaceScreen({super.key});

  @override
  State<MarketplaceScreen> createState() => _MarketplaceScreenState();
}

class _MarketplaceScreenState extends State<MarketplaceScreen> {
  final _service = MarketplaceService();
  List<Product> _allProducts = [];
  List<Product> _filteredProducts = [];
  bool _isLoading = true;
  String _searchTerm = '';
  String _selectedCategory = 'All';
  bool _showFilters = false;
  double _minPrice = 0;
  double _maxPrice = 1000;
  int? _minQuantity;
  String _sortBy = 'relevance';

  @override
  void initState() {
    super.initState();
    _loadProducts();
  }

  Future<void> _loadProducts() async {
    try {
      final products = await _service.fetchProducts();
      if (mounted) {
        setState(() {
          _allProducts = products;
          _filteredProducts = products;
          _isLoading = false;
        });
        _filterProducts(); // Initial filter apply
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error loading products: $e')));
      }
    }
  }

  void _filterProducts() {
    setState(() {
      _filteredProducts = _allProducts.where((p) {
        final matchesSearch =
            p.name.toLowerCase().contains(_searchTerm.toLowerCase()) ||
                p.farmer.toLowerCase().contains(_searchTerm.toLowerCase());
        final matchesCategory =
            _selectedCategory == 'All' || p.category == _selectedCategory;

        if (!_showFilters) return matchesSearch && matchesCategory;

        final matchesPrice = p.price >= _minPrice && p.price <= _maxPrice;
        final matchesQuantity =
            _minQuantity == null || p.stockQuantity >= _minQuantity!;

        return matchesSearch &&
            matchesCategory &&
            matchesPrice &&
            matchesQuantity;
      }).toList();

      if (_showFilters) {
        if (_sortBy == 'price_asc') {
          _filteredProducts.sort((a, b) => a.price.compareTo(b.price));
        } else if (_sortBy == 'price_desc') {
          _filteredProducts.sort((a, b) => b.price.compareTo(a.price));
        } else if (_sortBy == 'rating') {
          _filteredProducts
              .sort((a, b) => (b.rating ?? 0).compareTo(a.rating ?? 0));
        }
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final categories = ['All', ..._allProducts.map((p) => p.category).toSet()];

    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text(
          'DuraHub Marketplace',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        actions: [
          Consumer<CartProvider>(
            builder: (context, cart, child) => IconButton(
              icon: Badge(
                label: Text(cart.itemCount.toString()),
                isLabelVisible: cart.itemCount > 0,
                backgroundColor: AppColors.emerald,
                child: const Icon(Icons.shopping_cart_outlined),
              ),
              onPressed: () => Navigator.pushNamed(context, '/cart').then((_) {
                // Refresh count when returning from cart
                context.read<CartProvider>().refreshCount();
              }),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        decoration: InputDecoration(
                          hintText: 'Search fresh produce...',
                          prefixIcon: const Icon(Icons.search),
                          filled: true,
                          fillColor: Colors.white,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide.none,
                          ),
                        ),
                        onChanged: (value) {
                          _searchTerm = value;
                          _filterProducts();
                        },
                      ),
                    ),
                    const SizedBox(width: 8),
                    IconButton.filledTonal(
                      onPressed: () =>
                          setState(() => _showFilters = !_showFilters),
                      icon: Icon(_showFilters
                          ? Icons.filter_list_off
                          : Icons.filter_list),
                      color: _showFilters ? AppColors.emerald : null,
                    ),
                  ],
                ),
                if (_showFilters) ...[
                  const SizedBox(height: 16),
                  _buildAdvancedFilters(),
                ],
              ],
            ),
          ),
          SizedBox(
            height: 40,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: categories.length,
              itemBuilder: (context, index) {
                final category = categories[index];
                final isSelected = _selectedCategory == category;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: Text(category),
                    selected: isSelected,
                    onSelected: (selected) {
                      setState(() {
                        _selectedCategory = category;
                        _filterProducts();
                      });
                    },
                    selectedColor: AppColors.emeraldLight,
                    checkmarkColor: AppColors.emerald,
                    labelStyle: TextStyle(
                      color:
                          isSelected ? AppColors.emeraldDark : Colors.black87,
                      fontWeight:
                          isSelected ? FontWeight.bold : FontWeight.normal,
                    ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 16),
          _buildAIRecommendationsBanner(),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : RefreshIndicator(
                    onRefresh: _loadProducts,
                    child: _filteredProducts.isEmpty
                        ? const Center(child: Text('No products found'))
                        : GridView.builder(
                            padding: const EdgeInsets.all(16),
                            gridDelegate:
                                const SliverGridDelegateWithMaxCrossAxisExtent(
                              maxCrossAxisExtent: 220,
                              childAspectRatio: 0.75,
                              crossAxisSpacing: 16,
                              mainAxisSpacing: 16,
                            ),
                            itemCount: _filteredProducts.length,
                            itemBuilder: (context, index) {
                              final product = _filteredProducts[index];
                              return InkWell(
                                onTap: () => Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) =>
                                        ProductDetailScreen(product: product),
                                  ),
                                ),
                                child: _ProductCard(
                                  product: product,
                                  onAdd: () async {
                                    await _service.addToCart(product.id, 1);
                                    if (context.mounted) {
                                      context
                                          .read<CartProvider>()
                                          .refreshCount();
                                    }
                                  },
                                ),
                              );
                            },
                          ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildAdvancedFilters() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Sort By',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
          ),
          const SizedBox(height: 8),
          DropdownButtonFormField<String>(
            value: _sortBy,
            decoration: InputDecoration(
              isDense: true,
              border:
                  OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
            ),
            items: const [
              DropdownMenuItem(value: 'relevance', child: Text('Relevance')),
              DropdownMenuItem(
                  value: 'price_asc', child: Text('Price: Low to High')),
              DropdownMenuItem(
                  value: 'price_desc', child: Text('Price: High to Low')),
              DropdownMenuItem(value: 'rating', child: Text('Top Rated')),
            ],
            onChanged: (v) {
              setState(() => _sortBy = v!);
              _filterProducts();
            },
          ),
          const SizedBox(height: 16),
          const Text(
            'Price Range',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: TextField(
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    hintText: 'Min',
                    isDense: true,
                    border: OutlineInputBorder(),
                  ),
                  onChanged: (v) {
                    _minPrice = double.tryParse(v) ?? 0;
                    _filterProducts();
                  },
                ),
              ),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 8.0),
                child: Text('-'),
              ),
              Expanded(
                child: TextField(
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    hintText: 'Max',
                    isDense: true,
                    border: OutlineInputBorder(),
                  ),
                  onChanged: (v) {
                    _maxPrice = double.tryParse(v) ?? 1000;
                    _filterProducts();
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const Text(
            'Min. Quantity',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
          ),
          const SizedBox(height: 8),
          TextField(
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(
              hintText: 'Min Stock',
              isDense: true,
              border: OutlineInputBorder(),
            ),
            onChanged: (v) {
              _minQuantity = int.tryParse(v);
              _filterProducts();
            },
          ),
        ],
      ),
    );
  }

  Widget _buildAIRecommendationsBanner() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          gradient: const LinearGradient(
            colors: [Colors.blue, Colors.purple],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Row(
          children: [
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '🤖 AI Recommendations for You',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                  SizedBox(height: 4),
                  Text(
                    'Based on seasonal trends and your location, we recommend fresh corn and tomatoes!',
                    style: TextStyle(color: Colors.white, fontSize: 12),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            ElevatedButton(
              onPressed: () => Navigator.pushNamed(context, '/ai-tools'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: Colors.purple,
                padding: const EdgeInsets.symmetric(horizontal: 12),
              ),
              child: const Text('View Tools'),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProductCard extends StatelessWidget {
  final Product product;
  final VoidCallback onAdd;

  const _ProductCard({required this.product, required this.onAdd});

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: ClipRRect(
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(12),
              ),
              child: Hero(
                tag: 'product-image-${product.id}',
                child: Image.network(
                  product.image,
                  fit: BoxFit.cover,
                  width: double.infinity,
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  product.name,
                  style: const TextStyle(fontWeight: FontWeight.bold),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  'By ${product.farmer}',
                  style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      '\$${product.price}/${product.unit}',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        color: AppColors.emerald,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.add_circle,
                          color: AppColors.emerald),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                      onPressed: onAdd,
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
