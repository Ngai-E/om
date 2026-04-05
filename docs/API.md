# API Specification
## OMEGA AFRO SHOP - Online Ordering & Delivery Platform

**Version**: 1.0  
**Date**: February 2026  
**Base URL**: `https://api.omegaafroshop.com/v1` (Production)  
**Base URL**: `http://localhost:4000/v1` (Development)

---

## 1. API Overview

### 1.1 General Information
- **Protocol**: HTTPS (TLS 1.2+)
- **Format**: JSON
- **Authentication**: JWT (Bearer token in Authorization header)
- **Rate Limiting**: 100 requests/minute per IP (auth endpoints: 5/15min)
- **Pagination**: Cursor-based or offset-based
- **Versioning**: URL path (`/v1/`)

### 1.2 Standard Response Format

**Success Response**:
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-02-08T23:00:00Z",
    "requestId": "req_abc123"
  }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": [
      {
        "field": "email",
        "message": "Must be a valid email address"
      }
    ]
  },
  "meta": {
    "timestamp": "2026-02-08T23:00:00Z",
    "requestId": "req_abc123"
  }
}
```

### 1.3 HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Missing or invalid auth token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate resource |
| 422 | Unprocessable Entity | Validation error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

---

## 2. Authentication

### 2.1 Register

**Endpoint**: `POST /auth/register`  
**Auth**: None  
**Description**: Create a new customer account.

**Request Body**:
```json
{
  "email": "customer@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+447535316253"
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_abc123",
      "email": "customer@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "CUSTOMER",
      "emailVerified": false
    },
    "message": "Verification email sent to customer@example.com"
  }
}
```

**Errors**:
- `409`: Email already exists
- `422`: Validation error (weak password, invalid email)

---

### 2.2 Login

**Endpoint**: `POST /auth/login`  
**Auth**: None  
**Description**: Authenticate user and receive JWT token.

**Request Body**:
```json
{
  "email": "customer@example.com",
  "password": "SecurePass123!"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_abc123",
      "email": "customer@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "CUSTOMER"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 604800
  }
}
```

**Headers Set**:
```
Set-Cookie: accessToken=<jwt>; HttpOnly; Secure; SameSite=Strict; Max-Age=604800
```

**Errors**:
- `401`: Invalid credentials
- `429`: Too many login attempts

---

### 2.3 Logout

**Endpoint**: `POST /auth/logout`  
**Auth**: Required  
**Description**: Invalidate JWT token.

**Response** (200):
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

### 2.4 Refresh Token

**Endpoint**: `POST /auth/refresh`  
**Auth**: Required (valid JWT)  
**Description**: Refresh JWT token before expiry.

**Response** (200):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 604800
  }
}
```

---

### 2.5 Request Password Reset

**Endpoint**: `POST /auth/forgot-password`  
**Auth**: None  
**Description**: Send password reset email.

**Request Body**:
```json
{
  "email": "customer@example.com"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "message": "Password reset email sent if account exists"
  }
}
```

---

### 2.6 Reset Password

**Endpoint**: `POST /auth/reset-password`  
**Auth**: None  
**Description**: Reset password with token from email.

**Request Body**:
```json
{
  "token": "reset_token_from_email",
  "newPassword": "NewSecurePass123!"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "message": "Password reset successfully"
  }
}
```

**Errors**:
- `400`: Invalid or expired token
- `422`: Weak password

---

## 3. Products

### 3.1 List Products

**Endpoint**: `GET /products`  
**Auth**: None  
**Description**: Get paginated list of products with filters.

**Query Parameters**:
```
?page=1
&limit=24
&categoryId=cat_abc123
&search=plantain
&minPrice=0
&maxPrice=50
&tags=vegan,gluten-free
&inStock=true
&sort=price_asc
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "prod_abc123",
        "name": "Green Plantains",
        "slug": "green-plantains",
        "description": "Fresh green plantains from Ghana",
        "price": 2.99,
        "compareAtPrice": null,
        "unitSize": "1kg",
        "images": [
          {
            "url": "https://s3.amazonaws.com/omega/products/plantains.jpg",
            "altText": "Green plantains"
          }
        ],
        "category": {
          "id": "cat_abc123",
          "name": "Fresh Produce",
          "slug": "fresh-produce"
        },
        "stock": {
          "quantity": 50,
          "status": "IN_STOCK"
        },
        "tags": ["vegan", "gluten-free"],
        "origin": "Ghana",
        "isFeatured": false
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 24,
      "total": 150,
      "totalPages": 7,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

**Stock Status Values**:
- `IN_STOCK`: Quantity > 10
- `LIMITED_STOCK`: Quantity 1-10
- `OUT_OF_STOCK`: Quantity 0

---

### 3.2 Get Product by ID

**Endpoint**: `GET /products/:id`  
**Auth**: None  
**Description**: Get detailed product information.

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "prod_abc123",
    "name": "Green Plantains",
    "slug": "green-plantains",
    "description": "Fresh green plantains from Ghana. Perfect for frying or boiling.",
    "price": 2.99,
    "compareAtPrice": null,
    "sku": "PLANT-001",
    "barcode": "5012345678900",
    "unitSize": "1kg",
    "origin": "Ghana",
    "ingredients": null,
    "allergens": null,
    "nutritionalInfo": {
      "calories": 122,
      "protein": "1.3g",
      "carbs": "31.9g",
      "fat": "0.4g"
    },
    "images": [
      {
        "url": "https://s3.amazonaws.com/omega/products/plantains-1.jpg",
        "altText": "Green plantains"
      }
    ],
    "category": {
      "id": "cat_abc123",
      "name": "Fresh Produce",
      "slug": "fresh-produce"
    },
    "stock": {
      "quantity": 50,
      "status": "IN_STOCK",
      "lowStockThreshold": 10
    },
    "tags": ["vegan", "gluten-free"],
    "isFeatured": false,
    "relatedProducts": [
      {
        "id": "prod_def456",
        "name": "Ripe Plantains",
        "slug": "ripe-plantains",
        "price": 3.49,
        "images": [...]
      }
    ]
  }
}
```

**Errors**:
- `404`: Product not found

---

### 3.3 Search Products

**Endpoint**: `GET /products/search`  
**Auth**: None  
**Description**: Full-text search with autocomplete.

**Query Parameters**:
```
?q=plantain
&limit=10
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "prod_abc123",
        "name": "Green Plantains",
        "slug": "green-plantains",
        "price": 2.99,
        "images": [...]
      }
    ],
    "suggestions": [
      "plantain chips",
      "plantain flour"
    ]
  }
}
```

---

### 3.4 Get Categories

**Endpoint**: `GET /categories`  
**Auth**: None  
**Description**: Get category tree.

**Response** (200):
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "cat_abc123",
        "name": "Fresh Produce",
        "slug": "fresh-produce",
        "description": "Fresh fruits and vegetables",
        "image": "https://s3.amazonaws.com/omega/categories/fresh-produce.jpg",
        "productCount": 45,
        "children": [
          {
            "id": "cat_def456",
            "name": "Vegetables",
            "slug": "vegetables",
            "productCount": 20
          }
        ]
      }
    ]
  }
}
```

---

## 4. Shopping Cart

### 4.1 Get Cart

**Endpoint**: `GET /cart`  
**Auth**: Optional (required for logged-in users)  
**Description**: Get current cart contents.

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "cart_abc123",
    "items": [
      {
        "id": "item_abc123",
        "product": {
          "id": "prod_abc123",
          "name": "Green Plantains",
          "slug": "green-plantains",
          "price": 2.99,
          "images": [...]
        },
        "quantity": 3,
        "subtotal": 8.97
      }
    ],
    "summary": {
      "itemCount": 3,
      "subtotal": 8.97,
      "deliveryFee": 3.99,
      "total": 12.96
    },
    "expiresAt": "2026-02-09T23:00:00Z"
  }
}
```

---

### 4.2 Add to Cart

**Endpoint**: `POST /cart/items`  
**Auth**: Optional  
**Description**: Add product to cart.

**Request Body**:
```json
{
  "productId": "prod_abc123",
  "quantity": 2
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "item": {
      "id": "item_abc123",
      "product": {...},
      "quantity": 2,
      "subtotal": 5.98
    },
    "cart": {
      "id": "cart_abc123",
      "itemCount": 2,
      "subtotal": 5.98
    }
  }
}
```

**Errors**:
- `404`: Product not found
- `400`: Product out of stock
- `422`: Invalid quantity

---

### 4.3 Update Cart Item

**Endpoint**: `PATCH /cart/items/:itemId`  
**Auth**: Optional  
**Description**: Update item quantity.

**Request Body**:
```json
{
  "quantity": 5
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "item": {
      "id": "item_abc123",
      "quantity": 5,
      "subtotal": 14.95
    },
    "cart": {
      "itemCount": 5,
      "subtotal": 14.95
    }
  }
}
```

---

### 4.4 Remove from Cart

**Endpoint**: `DELETE /cart/items/:itemId`  
**Auth**: Optional  
**Description**: Remove item from cart.

**Response** (200):
```json
{
  "success": true,
  "data": {
    "message": "Item removed from cart",
    "cart": {
      "itemCount": 0,
      "subtotal": 0
    }
  }
}
```

---

### 4.5 Clear Cart

**Endpoint**: `DELETE /cart`  
**Auth**: Optional  
**Description**: Remove all items from cart.

**Response** (200):
```json
{
  "success": true,
  "data": {
    "message": "Cart cleared"
  }
}
```

---

## 5. Checkout & Orders

### 5.1 Calculate Delivery Fee

**Endpoint**: `POST /delivery/calculate-fee`  
**Auth**: None  
**Description**: Calculate delivery fee for postcode.

**Request Body**:
```json
{
  "postcode": "BL4 9BB",
  "subtotal": 45.00
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "zone": {
      "id": "zone_abc123",
      "name": "Bolton Central",
      "deliveryFee": 3.99,
      "minOrderValue": 20.00,
      "freeDeliveryThreshold": 50.00
    },
    "fee": 3.99,
    "isFree": false,
    "amountUntilFreeDelivery": 5.00
  }
}
```

**Errors**:
- `400`: Postcode not in delivery area
- `400`: Order below minimum value

---

### 5.2 Get Delivery Slots

**Endpoint**: `GET /delivery/slots`  
**Auth**: None  
**Description**: Get available delivery slots for next 7 days.

**Query Parameters**:
```
?date=2026-02-10
&type=DELIVERY
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "slots": [
      {
        "id": "slot_abc123",
        "date": "2026-02-10",
        "startTime": "10:00",
        "endTime": "12:00",
        "capacity": 10,
        "available": 7,
        "isAvailable": true
      },
      {
        "id": "slot_def456",
        "date": "2026-02-10",
        "startTime": "14:00",
        "endTime": "16:00",
        "capacity": 10,
        "available": 0,
        "isAvailable": false
      }
    ]
  }
}
```

---

### 5.3 Create Order

**Endpoint**: `POST /orders`  
**Auth**: Optional (guest checkout supported)  
**Description**: Create order from cart.

**Request Body**:
```json
{
  "fulfillmentType": "DELIVERY",
  "address": {
    "line1": "76-78 Higher Market Street",
    "line2": "",
    "city": "Farnworth",
    "county": "Bolton",
    "postcode": "BL4 9BB",
    "country": "GB"
  },
  "deliverySlotId": "slot_abc123",
  "guestEmail": "guest@example.com",
  "guestPhone": "+447535316253",
  "notes": "Please ring doorbell"
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "order": {
      "id": "ord_abc123",
      "orderNumber": "ORD-2026-00001",
      "status": "RECEIVED",
      "fulfillmentType": "DELIVERY",
      "items": [...],
      "subtotal": 45.00,
      "deliveryFee": 3.99,
      "total": 48.99,
      "address": {...},
      "deliverySlot": {
        "date": "2026-02-10",
        "startTime": "10:00",
        "endTime": "12:00"
      },
      "estimatedDelivery": "2026-02-10T12:00:00Z",
      "createdAt": "2026-02-08T23:00:00Z"
    },
    "paymentIntent": {
      "clientSecret": "pi_abc123_secret_xyz",
      "publishableKey": "pk_test_..."
    }
  }
}
```

**Errors**:
- `400`: Cart is empty
- `400`: Invalid delivery slot
- `422`: Validation error

---

### 5.4 Get Order by ID

**Endpoint**: `GET /orders/:id`  
**Auth**: Required (or order number + email for guests)  
**Description**: Get order details.

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "ord_abc123",
    "orderNumber": "ORD-2026-00001",
    "status": "OUT_FOR_DELIVERY",
    "fulfillmentType": "DELIVERY",
    "items": [
      {
        "id": "item_abc123",
        "productName": "Green Plantains",
        "productPrice": 2.99,
        "quantity": 3,
        "subtotal": 8.97
      }
    ],
    "subtotal": 45.00,
    "deliveryFee": 3.99,
    "total": 48.99,
    "address": {...},
    "deliverySlot": {...},
    "estimatedDelivery": "2026-02-10T12:00:00Z",
    "statusHistory": [
      {
        "status": "RECEIVED",
        "createdAt": "2026-02-08T23:00:00Z"
      },
      {
        "status": "PICKING",
        "createdAt": "2026-02-09T09:00:00Z"
      },
      {
        "status": "PACKED",
        "createdAt": "2026-02-09T10:00:00Z"
      },
      {
        "status": "OUT_FOR_DELIVERY",
        "createdAt": "2026-02-10T09:00:00Z"
      }
    ],
    "payment": {
      "status": "SUCCEEDED",
      "method": "CARD",
      "paidAt": "2026-02-08T23:05:00Z"
    },
    "createdAt": "2026-02-08T23:00:00Z"
  }
}
```

---

### 5.5 Get Order History

**Endpoint**: `GET /orders`  
**Auth**: Required  
**Description**: Get user's order history.

**Query Parameters**:
```
?page=1
&limit=10
&status=DELIVERED
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "ord_abc123",
        "orderNumber": "ORD-2026-00001",
        "status": "DELIVERED",
        "total": 48.99,
        "itemCount": 5,
        "deliveredAt": "2026-02-10T11:30:00Z",
        "createdAt": "2026-02-08T23:00:00Z"
      }
    ],
    "pagination": {...}
  }
}
```

---

## 6. Payments (Stripe)

### 6.1 Create Payment Intent

**Endpoint**: `POST /payments/create-intent`  
**Auth**: Required  
**Description**: Create Stripe Payment Intent for order.

**Request Body**:
```json
{
  "orderId": "ord_abc123"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "clientSecret": "pi_abc123_secret_xyz",
    "publishableKey": "pk_test_...",
    "amount": 4899,
    "currency": "gbp"
  }
}
```

---

### 6.2 Confirm Payment

**Endpoint**: `POST /payments/confirm`  
**Auth**: Required  
**Description**: Confirm payment success (called after Stripe confirmation).

**Request Body**:
```json
{
  "paymentIntentId": "pi_abc123"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "order": {
      "id": "ord_abc123",
      "orderNumber": "ORD-2026-00001",
      "status": "RECEIVED",
      "payment": {
        "status": "SUCCEEDED"
      }
    }
  }
}
```

---

### 6.3 Stripe Webhook

**Endpoint**: `POST /payments/webhook`  
**Auth**: Stripe signature verification  
**Description**: Handle Stripe webhook events.

**Events Handled**:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.refunded`

**Response** (200):
```json
{
  "received": true
}
```

---

## 7. Staff (Phone Orders)

### 7.1 Create Phone Order

**Endpoint**: `POST /staff/phone-orders`  
**Auth**: Required (STAFF or ADMIN role)  
**Description**: Create order on behalf of customer.

**Request Body**:
```json
{
  "customerId": "usr_abc123",
  "items": [
    {
      "productId": "prod_abc123",
      "quantity": 2,
      "notes": "Customer prefers ripe plantains"
    }
  ],
  "fulfillmentType": "DELIVERY",
  "addressId": "addr_abc123",
  "deliverySlotId": "slot_abc123",
  "paymentMethod": "PAYMENT_LINK",
  "staffNotes": "Customer called at 2pm"
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "order": {
      "id": "ord_abc123",
      "orderNumber": "ORD-2026-00001",
      "status": "RECEIVED",
      "payment": {
        "status": "PENDING",
        "paymentLink": "https://checkout.stripe.com/pay/cs_test_..."
      }
    },
    "paymentLinkSent": true
  }
}
```

---

### 7.2 Send Payment Link

**Endpoint**: `POST /staff/phone-orders/:orderId/send-payment-link`  
**Auth**: Required (STAFF or ADMIN role)  
**Description**: Resend payment link to customer.

**Request Body**:
```json
{
  "method": "SMS"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "message": "Payment link sent via SMS",
    "paymentLink": "https://checkout.stripe.com/pay/cs_test_..."
  }
}
```

---

### 7.3 Search Customers

**Endpoint**: `GET /staff/customers/search`  
**Auth**: Required (STAFF or ADMIN role)  
**Description**: Search customers by phone or email.

**Query Parameters**:
```
?q=07535316253
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "customers": [
      {
        "id": "usr_abc123",
        "email": "customer@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "phone": "+447535316253",
        "orderCount": 5,
        "lastOrderDate": "2026-02-01T10:00:00Z"
      }
    ]
  }
}
```

---

## 8. Admin

### 8.1 Create Product

**Endpoint**: `POST /admin/products`  
**Auth**: Required (ADMIN role)  
**Description**: Create new product.

**Request Body**:
```json
{
  "name": "Green Plantains",
  "slug": "green-plantains",
  "description": "Fresh green plantains from Ghana",
  "price": 2.99,
  "sku": "PLANT-001",
  "barcode": "5012345678900",
  "unitSize": "1kg",
  "categoryId": "cat_abc123",
  "origin": "Ghana",
  "tags": ["vegan", "gluten-free"],
  "stock": 50,
  "lowStockThreshold": 10
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "product": {
      "id": "prod_abc123",
      "name": "Green Plantains",
      "slug": "green-plantains",
      ...
    }
  }
}
```

---

### 8.2 Update Product

**Endpoint**: `PATCH /admin/products/:id`  
**Auth**: Required (ADMIN role)  
**Description**: Update product details.

**Request Body**:
```json
{
  "price": 3.49,
  "stock": 75
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "product": {...}
  }
}
```

---

### 8.3 Upload Product Image

**Endpoint**: `POST /admin/products/:id/images`  
**Auth**: Required (ADMIN role)  
**Description**: Upload product image to S3.

**Request**: Multipart form data
```
file: <image file>
altText: "Green plantains"
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "image": {
      "id": "img_abc123",
      "url": "https://s3.amazonaws.com/omega/products/plantains.jpg",
      "altText": "Green plantains"
    }
  }
}
```

---

### 8.4 Update Order Status

**Endpoint**: `PATCH /admin/orders/:id/status`  
**Auth**: Required (ADMIN or STAFF role)  
**Description**: Update order status.

**Request Body**:
```json
{
  "status": "OUT_FOR_DELIVERY",
  "notes": "Assigned to driver John"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "order": {
      "id": "ord_abc123",
      "status": "OUT_FOR_DELIVERY",
      "statusHistory": [...]
    }
  }
}
```

---

### 8.5 Generate Picking List

**Endpoint**: `GET /admin/orders/picking-list`  
**Auth**: Required (ADMIN or PICKER role)  
**Description**: Generate picking list for orders.

**Query Parameters**:
```
?status=RECEIVED
&date=2026-02-10
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "orderNumber": "ORD-2026-00001",
        "items": [
          {
            "productName": "Green Plantains",
            "sku": "PLANT-001",
            "quantity": 3,
            "location": "Aisle 2, Shelf A"
          }
        ]
      }
    ],
    "groupedByCategory": {
      "Fresh Produce": [
        {
          "productName": "Green Plantains",
          "totalQuantity": 15,
          "orders": ["ORD-2026-00001", "ORD-2026-00002"]
        }
      ]
    }
  }
}
```

---

### 8.6 Process Refund

**Endpoint**: `POST /admin/orders/:id/refund`  
**Auth**: Required (ADMIN role)  
**Description**: Process full or partial refund via Stripe.

**Request Body**:
```json
{
  "amount": 48.99,
  "reason": "CUSTOMER_REQUEST",
  "notes": "Customer not satisfied with quality"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "refund": {
      "id": "ref_abc123",
      "amount": 48.99,
      "status": "SUCCEEDED",
      "createdAt": "2026-02-10T15:00:00Z"
    },
    "order": {
      "id": "ord_abc123",
      "status": "REFUNDED",
      "payment": {
        "status": "REFUNDED"
      }
    }
  }
}
```

---

### 8.7 Create Delivery Zone

**Endpoint**: `POST /admin/delivery-zones`  
**Auth**: Required (ADMIN role)  
**Description**: Create delivery zone.

**Request Body**:
```json
{
  "name": "Bolton Central",
  "postcodePrefix": ["BL1", "BL2", "BL3", "BL4"],
  "deliveryFee": 3.99,
  "minOrderValue": 20.00,
  "freeDeliveryThreshold": 50.00
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "zone": {
      "id": "zone_abc123",
      "name": "Bolton Central",
      ...
    }
  }
}
```

---

### 8.8 Get Dashboard Stats

**Endpoint**: `GET /admin/dashboard/stats`  
**Auth**: Required (ADMIN role)  
**Description**: Get overview statistics.

**Response** (200):
```json
{
  "success": true,
  "data": {
    "today": {
      "orders": 15,
      "revenue": 675.50,
      "averageOrderValue": 45.03
    },
    "thisWeek": {
      "orders": 87,
      "revenue": 3920.00
    },
    "lowStockProducts": 5,
    "pendingOrders": 8,
    "outForDelivery": 12
  }
}
```

---

## 9. User Account

### 9.1 Get Profile

**Endpoint**: `GET /account/profile`  
**Auth**: Required  
**Description**: Get user profile.

**Response** (200):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_abc123",
      "email": "customer@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+447535316253",
      "role": "CUSTOMER",
      "emailVerified": true,
      "customerProfile": {
        "marketingOptIn": true,
        "smsOptIn": false,
        "loyaltyPoints": 0
      }
    }
  }
}
```

---

### 9.2 Update Profile

**Endpoint**: `PATCH /account/profile`  
**Auth**: Required  
**Description**: Update user profile.

**Request Body**:
```json
{
  "firstName": "Jane",
  "phone": "+447535316254",
  "marketingOptIn": false
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "user": {...}
  }
}
```

---

### 9.3 Get Addresses

**Endpoint**: `GET /account/addresses`  
**Auth**: Required  
**Description**: Get saved addresses.

**Response** (200):
```json
{
  "success": true,
  "data": {
    "addresses": [
      {
        "id": "addr_abc123",
        "label": "Home",
        "line1": "76-78 Higher Market Street",
        "city": "Farnworth",
        "postcode": "BL4 9BB",
        "isDefault": true
      }
    ]
  }
}
```

---

### 9.4 Add Address

**Endpoint**: `POST /account/addresses`  
**Auth**: Required  
**Description**: Add new address.

**Request Body**:
```json
{
  "label": "Work",
  "line1": "123 Main Street",
  "city": "Bolton",
  "postcode": "BL1 1AA",
  "isDefault": false
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "address": {...}
  }
}
```

---

## 10. Rate Limiting

### 10.1 Rate Limit Headers

All responses include rate limit headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1644364800
```

### 10.2 Rate Limit Exceeded Response

**Response** (429):
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again in 60 seconds.",
    "retryAfter": 60
  }
}
```

---

## 11. Webhooks

### 11.1 Stripe Webhooks

**Endpoint**: `POST /payments/webhook`  
**Signature**: `stripe-signature` header

**Events**:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.refunded`

---

## 12. Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `UNAUTHORIZED` | Missing or invalid auth token |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `CONFLICT` | Duplicate resource |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `PAYMENT_FAILED` | Payment processing failed |
| `OUT_OF_STOCK` | Product unavailable |
| `INVALID_POSTCODE` | Postcode not in delivery area |
| `ORDER_BELOW_MINIMUM` | Order below minimum value |
| `INTERNAL_ERROR` | Server error |

---

## 13. Idempotency

### 13.1 Idempotent Requests

For critical operations (order creation, payments), include `Idempotency-Key` header:

```
Idempotency-Key: unique-key-12345
```

Duplicate requests with same key return cached response.

---

**Document Owner**: Engineering Team  
**Last Updated**: February 2026  
**Next Review**: Post-MVP Launch
