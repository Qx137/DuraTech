class Product {
  final String id;
  final String name;
  final double price;
  final String unit;
  final String farmer;
  final String location;
  final double rating;
  final String image;
  final String category;
  final bool organic;
  final String description;
  final int stockQuantity;
  final String kycStatus;

  Product({
    required this.id,
    required this.name,
    required this.price,
    required this.unit,
    required this.farmer,
    required this.location,
    required this.rating,
    required this.image,
    required this.category,
    required this.organic,
    required this.description,
    required this.stockQuantity,
    required this.kycStatus,
  });

  factory Product.fromMap(Map<String, dynamic> map) {
    return Product(
      id: map['id'],
      name: map['name'],
      price: (map['price'] as num).toDouble(),
      unit: map['unit'],
      farmer: map['profiles']?['business_name'] ??
          map['profiles']?['name'] ??
          'Unknown Farmer',
      location: map['location'] ?? 'Unknown Location',
      rating: (map['rating'] as num?)?.toDouble() ?? 0.0,
      image: map['image'] ??
          'https://images.unsplash.com/photo-1546470427-227e09b17322?w=400&h=300&fit=crop',
      category: map['category'],
      organic: map['organic'] ?? false,
      description: map['description'] ?? '',
      stockQuantity: map['stock_quantity'] ?? 0,
      kycStatus: map['profiles']?['kyc_status'] ?? 'none',
    );
  }
}
