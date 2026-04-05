#!/bin/bash

# Test Phone Order Creation
# Backend running on http://localhost:4000

TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZjg0MGViZC1mNGQ3LTQ4NTktYTgxYS01NGM5YTViZjJhZGMiLCJlbWFpbCI6ImFkbWluQG9tZWdhYWZyb3Nob3AuY29tIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzcxNzQ5MzQ3LCJleHAiOjE3NzIzNTQxNDd9.8nX1eiflUwFkCDt_8P75zV0kxcoabggEaUZZMiR9DBQ"

echo "🧪 Testing Phone Order Creation..."
echo "=================================="
echo ""

curl -X POST http://localhost:4000/v1/staff/orders/phone \
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
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || cat

echo ""
echo "=================================="
echo "✅ Test complete!"
echo ""
echo "Expected: 201 Created with order details and payment link"
echo "If you see 500 error, check backend logs for details"
