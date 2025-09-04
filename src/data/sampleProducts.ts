
export interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
  farmer: string;
  location: string | null;
  rating: number | null;
  image: string | null;
  category: string;
  organic: boolean;
  description: string | null;
  distance?: number;
}

export const products: Product[] = [
  {
    id: "1",
    name: "White Maize",
    price: 2.50,
    unit: "kg",
    farmer: "Tendai Mukamuri",
    location: "Mashonaland East",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&h=300&fit=crop",
    category: "grains",
    organic: true,
    description: "Premium white maize grown using traditional methods"
  },
  {
    id: "2", 
    name: "Sweet Potatoes",
    price: 1.80,
    unit: "kg",
    farmer: "Grace Chigamba",
    location: "Manicaland",
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&h=300&fit=crop",
    category: "vegetables",
    organic: false,
    description: "Fresh orange-fleshed sweet potatoes rich in vitamins"
  },
  {
    id: "3",
    name: "Groundnuts",
    price: 4.20,
    unit: "kg", 
    farmer: "Joseph Sibanda",
    location: "Matabeleland South",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1582082932251-5b56b6b8b1a2?w=400&h=300&fit=crop",
    category: "legumes",
    organic: true,
    description: "High-quality Valencia groundnuts perfect for cooking"
  },
  {
    id: "4",
    name: "Fresh Tomatoes",
    price: 3.50,
    unit: "kg",
    farmer: "Maria Santos",
    location: "Midlands",
    rating: 4.4,
    image: "https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=400&h=300&fit=crop",
    category: "vegetables",
    organic: false,
    description: "Ripe red tomatoes perfect for cooking and salads"
  },
  {
    id: "5",
    name: "Sugar Beans",
    price: 5.80,
    unit: "kg",
    farmer: "Patrick Moyo",
    location: "Mashonaland Central", 
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1583757807696-bc8d3c7d81de?w=400&h=300&fit=crop",
    category: "legumes",
    organic: true,
    description: "Premium white sugar beans, high in protein"
  },
  {
    id: "6",
    name: "Butternut Squash",
    price: 2.20,
    unit: "each",
    farmer: "Alice Mhonde",
    location: "Mashonaland West",
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=400&h=300&fit=crop",
    category: "vegetables",
    organic: false,
    description: "Large butternut squash perfect for soups and stews"
  },
  {
    id: "7",
    name: "Sorghum",
    price: 3.20,
    unit: "kg",
    farmer: "David Nhamo",
    location: "Matabeleland North",
    rating: 4.3,
    image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=300&fit=crop", 
    category: "grains",
    organic: true,
    description: "Drought-resistant sorghum grain, great for porridge"
  },
  {
    id: "8",
    name: "Fresh Spinach",
    price: 1.50,
    unit: "bunch",
    farmer: "Ruth Gumbo",
    location: "Harare",
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&h=300&fit=crop",
    category: "vegetables", 
    organic: true,
    description: "Fresh green spinach leaves, rich in iron and vitamins"
  },
  {
    id: "9",
    name: "Yellow Maize",
    price: 2.30,
    unit: "kg",
    farmer: "Simon Chitongo",
    location: "Mashonaland East",
    rating: 4.4,
    image: "https://images.unsplash.com/photo-1574490599867-84a0df8c3b23?w=400&h=300&fit=crop",
    category: "grains",
    organic: false,
    description: "High-quality yellow maize suitable for animal feed and human consumption"
  },
  {
    id: "10",
    name: "Cassava Roots",
    price: 1.80,
    unit: "kg",
    farmer: "Memory Mazani",
    location: "Manicaland",
    rating: 4.2,
    image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=300&fit=crop",
    category: "roots",
    organic: true,
    description: "Fresh cassava roots, perfect for traditional meals"
  },
  {
    id: "11",
    name: "Red Onions",
    price: 2.80,
    unit: "kg",
    farmer: "James Mandaza",
    location: "Midlands",
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&h=300&fit=crop",
    category: "vegetables",
    organic: false,
    description: "Fresh red onions with strong flavor"
  },
  {
    id: "12",
    name: "Green Mealies",
    price: 0.50,
    unit: "each",
    farmer: "Elizabeth Nyoni",
    location: "Mashonaland Central",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&h=300&fit=crop",
    category: "vegetables",
    organic: true,
    description: "Fresh sweet corn on the cob, perfect for roasting"
  }
];
