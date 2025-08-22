-- First, create some seller profiles for the sample products
INSERT INTO public.profiles (id, name, email, user_type, business_name, description) VALUES
(gen_random_uuid(), 'John Smith', 'john@example.com', 'seller', 'Smith Family Farm', 'Organic vegetables and fruits'),
(gen_random_uuid(), 'Maria Garcia', 'maria@example.com', 'seller', 'Green Valley Organic', 'Fresh organic produce'),
(gen_random_uuid(), 'David Johnson', 'david@example.com', 'seller', 'Johnson''s Fresh Market', 'Local farm fresh products'),
(gen_random_uuid(), 'Sarah Wilson', 'sarah@example.com', 'seller', 'Wilson Organic Farm', 'Certified organic farming'),
(gen_random_uuid(), 'Mike Brown', 'mike@example.com', 'seller', 'Brown''s Harvest', 'Seasonal fresh produce');

-- Insert sample products using the seller profiles
WITH sellers AS (
  SELECT id, business_name FROM profiles WHERE user_type = 'seller'
)
INSERT INTO public.products (id, seller_id, name, description, price, unit, category, organic, rating, stock_quantity, image, location) VALUES
('1', (SELECT id FROM sellers WHERE business_name = 'Smith Family Farm'), 'Fresh Organic Tomatoes', 'Juicy red tomatoes grown without pesticides', 4.99, 'lb', 'vegetables', true, 4.5, 100, 'https://images.unsplash.com/photo-1546470427-227e09b17322?w=400&h=300&fit=crop', 'Smith Family Farm, California'),
('2', (SELECT id FROM sellers WHERE business_name = 'Green Valley Organic'), 'Free-Range Eggs', 'Farm-fresh eggs from happy hens', 6.50, 'dozen', 'dairy', true, 4.8, 50, 'https://images.unsplash.com/photo-1569288063643-5d29ad64df09?w=400&h=300&fit=crop', 'Green Valley, Oregon'),
('3', (SELECT id FROM sellers WHERE business_name = 'Johnson''s Fresh Market'), 'Sweet Corn', 'Fresh picked sweet corn, perfect for grilling', 3.00, 'ear', 'vegetables', false, 4.2, 75, 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&h=300&fit=crop', 'Johnson Farm, Iowa'),
('4', (SELECT id FROM sellers WHERE business_name = 'Wilson Organic Farm'), 'Organic Spinach', 'Fresh baby spinach leaves, perfect for salads', 3.99, 'bunch', 'vegetables', true, 4.6, 30, 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&h=300&fit=crop', 'Wilson Farm, Vermont'),
('5', (SELECT id FROM sellers WHERE business_name = 'Brown''s Harvest'), 'Local Honey', 'Raw unfiltered honey from local wildflowers', 12.99, 'jar', 'pantry', true, 4.9, 25, 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=400&h=300&fit=crop', 'Brown Apiary, Montana'),
('6', (SELECT id FROM sellers WHERE business_name = 'Smith Family Farm'), 'Organic Carrots', 'Sweet crunchy carrots, great for snacking', 2.99, 'lb', 'vegetables', true, 4.3, 80, 'https://images.unsplash.com/photo-1445282768818-728615cc910a?w=400&h=300&fit=crop', 'Smith Family Farm, California'),
('7', (SELECT id FROM sellers WHERE business_name = 'Green Valley Organic'), 'Fresh Basil', 'Aromatic basil perfect for cooking', 2.50, 'bunch', 'herbs', true, 4.7, 40, 'https://images.unsplash.com/photo-1525973132219-139b28b709ca?w=400&h=300&fit=crop', 'Green Valley, Oregon'),
('8', (SELECT id FROM sellers WHERE business_name = 'Johnson''s Fresh Market'), 'Red Bell Peppers', 'Crisp and sweet red peppers', 5.99, 'lb', 'vegetables', false, 4.1, 60, 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400&h=300&fit=crop', 'Johnson Farm, Iowa'),
('9', (SELECT id FROM sellers WHERE business_name = 'Wilson Organic Farm'), 'Organic Apples', 'Crisp organic apples, variety mix', 4.50, 'lb', 'fruits', true, 4.4, 90, 'https://images.unsplash.com/photo-1574226516831-e1dff420e562?w=400&h=300&fit=crop', 'Wilson Farm, Vermont'),
('10', (SELECT id FROM sellers WHERE business_name = 'Brown''s Harvest'), 'Farm Fresh Milk', 'Whole milk from grass-fed cows', 3.99, 'gallon', 'dairy', false, 4.6, 35, 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=300&fit=crop', 'Brown Dairy, Montana');