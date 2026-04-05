#!/bin/bash

# Test Phone Order Creation
# Make sure backend is running on http://localhost:4000

# Replace with your actual JWT token (get from login)
TOKEN="YOUR_JWT_TOKEN_HERE"

echo "Testing Phone Order Creation..."
echo "================================"

curl -X POST http://localhost:4000/staff/phone-orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "customerId": "56008df0-a320-4448-92a7-0f307574c88e",
    "items": [
      {
        "productId": "b3dfa16d-3a80-412f-a13f-f74543d5d63b",
        "quantity": 1
      }
    ],
    "fulfillmentType": "DELIVERY",
    "addressId": "a3134eee-ee29-4a85-8feb-a835a2447ed5",
    "deliverySlotId": "",
    "paymentMethod": "CARD"
  }' \
  | jq '.'

echo ""
echo "================================"
echo "Test complete!"
