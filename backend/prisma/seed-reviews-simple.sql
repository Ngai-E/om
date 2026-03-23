-- Sample Reviews SQL Insert Script
-- Run this after you have products and at least one customer user in your database

-- First, get your user ID and product IDs by running:
-- SELECT id, email, role FROM users WHERE role = 'CUSTOMER' LIMIT 1;
-- SELECT id, name FROM products WHERE "isActive" = true LIMIT 5;

-- Replace 'YOUR_USER_ID' and 'YOUR_PRODUCT_ID' with actual IDs from your database

-- Example: Approved reviews
INSERT INTO reviews (id, "productId", "userId", rating, title, comment, status, "isVerifiedPurchase", "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid(), 'YOUR_PRODUCT_ID_1', 'YOUR_USER_ID', 5, 'Excellent Quality!', 'This product exceeded my expectations. Fresh, authentic, and delivered quickly. Will definitely order again!', 'APPROVED', true, NOW(), NOW()),
  (gen_random_uuid(), 'YOUR_PRODUCT_ID_2', 'YOUR_USER_ID', 4, 'Very Good', 'Great product overall. Good quality and taste. Only minor issue was the packaging could be better.', 'APPROVED', true, NOW(), NOW()),
  (gen_random_uuid(), 'YOUR_PRODUCT_ID_3', 'YOUR_USER_ID', 5, 'Authentic and Fresh', 'Exactly what I was looking for! Reminds me of home. The quality is top-notch and the price is reasonable.', 'APPROVED', false, NOW(), NOW());

-- Example: Pending reviews
INSERT INTO reviews (id, "productId", "userId", rating, title, comment, status, "isVerifiedPurchase", "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid(), 'YOUR_PRODUCT_ID_4', 'YOUR_USER_ID', 3, 'Decent but could be better', 'Product is okay but I expected more for the price. Delivery was fast though.', 'PENDING', false, NOW(), NOW()),
  (gen_random_uuid(), 'YOUR_PRODUCT_ID_5', 'YOUR_USER_ID', 4, 'Good value for money', 'Quality is good and the portion size is generous. Will buy again.', 'PENDING', true, NOW(), NOW());
