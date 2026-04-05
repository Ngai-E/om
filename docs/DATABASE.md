# Database Schema
## OMEGA AFRO SHOP - Online Ordering & Delivery Platform

**Version**: 1.0  
**Date**: February 2026  
**Database**: PostgreSQL 15+  
**ORM**: Prisma

---

## 1. Schema Overview

### 1.1 Entity Relationship Diagram (Text Description)

```
User (1) ──────< (M) Order
  │
  └──< (1) CustomerProfile
  │
  └──< (M) Address
  │
  └──< (M) Cart
        │
        └──< (M) CartItem ──> (1) Product

Product (M) ──> (1) Category
  │
  └──< (1) Inventory
  │
  └──< (M) ProductImage
  │
  └──< (M) OrderItem <── (1) Order

Order (1) ──> (1) Payment
  │
  └──> (1) Address
  │
  └──> (1) DeliverySlot (optional)

DeliveryZone (1) ──< (M) Address

AuditLog ──> (1) User
```

### 1.2 Core Entities

| Entity | Description | Key Relationships |
|--------|-------------|-------------------|
| **User** | System users (customers, staff, admin) | Has CustomerProfile, Orders, Addresses |
| **CustomerProfile** | Extended customer information | Belongs to User |
| **Product** | Product catalog | Belongs to Category, has Inventory, Images |
| **Category** | Product categories | Has many Products |
| **Cart** | Shopping cart | Belongs to User, has CartItems |
| **Order** | Customer orders | Belongs to User, has OrderItems, Payment |
| **Payment** | Payment transactions | Belongs to Order |
| **DeliveryZone** | Delivery zones by postcode | Has many Addresses |
| **Address** | Delivery addresses | Belongs to User, DeliveryZone |
| **AuditLog** | Admin action logs | Belongs to User |

---

## 2. Detailed Schema (Prisma)

### 2.1 User Management

#### User
```prisma
model User {
  id            String          @id @default(uuid())
  email         String          @unique
  password      String          // bcrypt hashed
  firstName     String
  lastName      String
  phone         String?
  role          Role            @default(CUSTOMER)
  emailVerified Boolean         @default(false)
  isActive      Boolean         @default(true)
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
  deletedAt     DateTime?       // Soft delete
  
  // Relations
  customerProfile CustomerProfile?
  addresses       Address[]
  carts           Cart[]
  orders          Order[]
  auditLogs       AuditLog[]
  
  @@index([email])
  @@index([role])
  @@map("users")
}

enum Role {
  CUSTOMER
  STAFF
  ADMIN
  PICKER
  DRIVER
}
```

**Indexes**:
- `email`: Unique, for login lookup
- `role`: For role-based queries

**Constraints**:
- Email must be unique
- Password must be hashed (bcrypt)
- Soft delete via `deletedAt`

---

#### CustomerProfile
```prisma
model CustomerProfile {
  id                String   @id @default(uuid())
  userId            String   @unique
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  dateOfBirth       DateTime?
  marketingOptIn    Boolean  @default(false)
  smsOptIn          Boolean  @default(false)
  preferredLanguage String   @default("en")
  loyaltyPoints     Int      @default(0)  // Phase 2
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@map("customer_profiles")
}
```

**Purpose**: Extended customer data separate from core User table.

---

#### Address
```prisma
model Address {
  id             String        @id @default(uuid())
  userId         String
  user           User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  label          String?       // e.g., "Home", "Work"
  line1          String
  line2          String?
  city           String
  county         String?
  postcode       String
  country        String        @default("GB")
  isDefault      Boolean       @default(false)
  deliveryZoneId String?
  deliveryZone   DeliveryZone? @relation(fields: [deliveryZoneId], references: [id])
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
  
  // Relations
  orders         Order[]
  
  @@index([userId])
  @@index([postcode])
  @@map("addresses")
}
```

**Indexes**:
- `userId`: For user address lookup
- `postcode`: For delivery zone matching

---

### 2.2 Product Catalog

#### Category
```prisma
model Category {
  id          String     @id @default(uuid())
  name        String
  slug        String     @unique
  description String?
  image       String?    // S3 URL
  parentId    String?
  parent      Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children    Category[] @relation("CategoryHierarchy")
  sortOrder   Int        @default(0)
  isActive    Boolean    @default(true)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  
  // Relations
  products    Product[]
  
  @@index([slug])
  @@index([parentId])
  @@map("categories")
}
```

**Features**:
- Hierarchical (parent-child)
- Slug for SEO-friendly URLs
- Sort order for custom ordering

---

#### Product
```prisma
model Product {
  id          String         @id @default(uuid())
  name        String
  slug        String         @unique
  description String?
  price       Decimal        @db.Decimal(10, 2)
  compareAtPrice Decimal?    @db.Decimal(10, 2)  // Original price (for sales)
  sku         String?        @unique
  barcode     String?
  unitSize    String?        // e.g., "1kg", "500g"
  origin      String?        // Country of origin
  ingredients String?
  allergens   String?
  nutritionalInfo Json?       // Flexible JSON field
  categoryId  String
  category    Category       @relation(fields: [categoryId], references: [id])
  isActive    Boolean        @default(true)
  isFeatured  Boolean        @default(false)
  tags        String[]       // e.g., ["vegan", "gluten-free", "halal"]
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
  deletedAt   DateTime?      // Soft delete
  
  // Relations
  inventory   Inventory?
  images      ProductImage[]
  cartItems   CartItem[]
  orderItems  OrderItem[]
  
  @@index([slug])
  @@index([categoryId])
  @@index([sku])
  @@index([isActive])
  @@map("products")
}
```

**Indexes**:
- `slug`: For SEO URLs
- `categoryId`: For category filtering
- `sku`: For inventory lookup
- `isActive`: For filtering active products

**Constraints**:
- `slug` must be unique
- `sku` must be unique (if provided)

---

#### ProductImage
```prisma
model ProductImage {
  id        String   @id @default(uuid())
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  url       String   // S3 URL
  altText   String?
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())
  
  @@index([productId])
  @@map("product_images")
}
```

**Purpose**: Support multiple images per product.

---

#### Inventory
```prisma
model Inventory {
  id                String   @id @default(uuid())
  productId         String   @unique
  product           Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  quantity          Int      @default(0)
  lowStockThreshold Int      @default(10)
  isTracked         Boolean  @default(true)  // If false, always "in stock"
  updatedAt         DateTime @updatedAt
  
  @@map("inventory")
}
```

**Features**:
- Track stock quantity
- Low-stock alerts
- Option to disable tracking (always in stock)

---

### 2.3 Shopping Cart

#### Cart
```prisma
model Cart {
  id        String     @id @default(uuid())
  userId    String?    // Null for guest carts
  user      User?      @relation(fields: [userId], references: [id], onDelete: Cascade)
  sessionId String?    // For guest carts
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
  expiresAt DateTime   // Auto-expire after 24 hours
  
  // Relations
  items     CartItem[]
  
  @@index([userId])
  @@index([sessionId])
  @@map("carts")
}
```

**Features**:
- Supports both logged-in users and guests
- Auto-expiry for guest carts

---

#### CartItem
```prisma
model CartItem {
  id        String   @id @default(uuid())
  cartId    String
  cart      Cart     @relation(fields: [cartId], references: [id], onDelete: Cascade)
  productId String
  product   Product  @relation(fields: [productId], references: [id])
  quantity  Int      @default(1)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([cartId, productId])  // Prevent duplicate products in same cart
  @@index([cartId])
  @@map("cart_items")
}
```

**Constraints**:
- Unique combination of `cartId` and `productId`

---

### 2.4 Orders & Payments

#### Order
```prisma
model Order {
  id                String        @id @default(uuid())
  orderNumber       String        @unique  // Human-readable (e.g., "ORD-2024-00001")
  userId            String?       // Null for guest orders
  user              User?         @relation(fields: [userId], references: [id])
  guestEmail        String?       // For guest orders
  guestPhone        String?
  status            OrderStatus   @default(RECEIVED)
  fulfillmentType   FulfillmentType
  subtotal          Decimal       @db.Decimal(10, 2)
  deliveryFee       Decimal       @db.Decimal(10, 2) @default(0)
  total             Decimal       @db.Decimal(10, 2)
  notes             String?       // Customer notes
  staffNotes        String?       // Internal notes
  addressId         String?
  address           Address?      @relation(fields: [addressId], references: [id])
  deliverySlotId    String?
  deliverySlot      DeliverySlot? @relation(fields: [deliverySlotId], references: [id])
  estimatedDelivery DateTime?
  deliveredAt       DateTime?
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
  
  // Relations
  items             OrderItem[]
  payment           Payment?
  statusHistory     OrderStatusHistory[]
  
  @@index([orderNumber])
  @@index([userId])
  @@index([status])
  @@index([createdAt])
  @@map("orders")
}

enum OrderStatus {
  RECEIVED
  PICKING
  PACKED
  OUT_FOR_DELIVERY
  DELIVERED
  READY_FOR_COLLECTION
  COLLECTED
  CANCELLED
  REFUNDED
}

enum FulfillmentType {
  DELIVERY
  COLLECTION
}
```

**Indexes**:
- `orderNumber`: For order lookup
- `userId`: For user order history
- `status`: For order queue filtering
- `createdAt`: For date-based queries

---

#### OrderItem
```prisma
model OrderItem {
  id              String  @id @default(uuid())
  orderId         String
  order           Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId       String
  product         Product @relation(fields: [productId], references: [id])
  productName     String  // Snapshot at order time
  productPrice    Decimal @db.Decimal(10, 2)
  quantity        Int
  subtotal        Decimal @db.Decimal(10, 2)
  substitutedWith String? // Product ID if substituted
  notes           String? // e.g., "customer prefers ripe plantains"
  
  @@index([orderId])
  @@map("order_items")
}
```

**Features**:
- Snapshot product name and price (in case product changes later)
- Support for substitutions

---

#### OrderStatusHistory
```prisma
model OrderStatusHistory {
  id        String      @id @default(uuid())
  orderId   String
  order     Order       @relation(fields: [orderId], references: [id], onDelete: Cascade)
  status    OrderStatus
  notes     String?
  createdBy String?     // User ID who made the change
  createdAt DateTime    @default(now())
  
  @@index([orderId])
  @@map("order_status_history")
}
```

**Purpose**: Track order status changes for audit trail.

---

#### Payment
```prisma
model Payment {
  id                 String        @id @default(uuid())
  orderId            String        @unique
  order              Order         @relation(fields: [orderId], references: [id], onDelete: Cascade)
  stripePaymentIntentId String?    @unique
  stripePaymentLinkId   String?    // For phone orders
  amount             Decimal       @db.Decimal(10, 2)
  currency           String        @default("GBP")
  status             PaymentStatus @default(PENDING)
  paymentMethod      PaymentMethod
  paidAt             DateTime?
  refundedAt         DateTime?
  refundAmount       Decimal?      @db.Decimal(10, 2)
  refundReason       String?
  metadata           Json?         // Additional Stripe metadata
  createdAt          DateTime      @default(now())
  updatedAt          DateTime      @updatedAt
  
  @@index([stripePaymentIntentId])
  @@map("payments")
}

enum PaymentStatus {
  PENDING
  PROCESSING
  SUCCEEDED
  FAILED
  REFUNDED
  PARTIALLY_REFUNDED
}

enum PaymentMethod {
  CARD
  APPLE_PAY
  GOOGLE_PAY
  CASH_ON_DELIVERY
  PAY_IN_STORE
}
```

**Features**:
- Link to Stripe Payment Intent
- Support for refunds
- Track payment method

---

### 2.5 Delivery Management

#### DeliveryZone
```prisma
model DeliveryZone {
  id              String    @id @default(uuid())
  name            String    // e.g., "Bolton Central"
  postcodePrefix  String[]  // e.g., ["BL1", "BL2"]
  deliveryFee     Decimal   @db.Decimal(10, 2)
  minOrderValue   Decimal   @db.Decimal(10, 2) @default(0)
  freeDeliveryThreshold Decimal? @db.Decimal(10, 2)
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  // Relations
  addresses       Address[]
  
  @@map("delivery_zones")
}
```

**Features**:
- Multiple postcode prefixes per zone
- Configurable fees and minimums
- Free delivery threshold

---

#### DeliverySlot
```prisma
model DeliverySlot {
  id          String   @id @default(uuid())
  date        DateTime @db.Date
  startTime   String   // e.g., "10:00"
  endTime     String   // e.g., "12:00"
  capacity    Int      @default(10)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  orders      Order[]
  
  @@unique([date, startTime, endTime])
  @@index([date])
  @@map("delivery_slots")
}
```

**Features**:
- Time windows for delivery
- Capacity limits
- Can be disabled for specific dates

---

### 2.6 Audit & Logging

#### AuditLog
```prisma
model AuditLog {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  action    String   // e.g., "CREATE_PRODUCT", "UPDATE_ORDER"
  entity    String   // e.g., "Product", "Order"
  entityId  String   // ID of affected entity
  changes   Json?    // Before/after snapshot
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
  
  @@index([userId])
  @@index([entity, entityId])
  @@index([createdAt])
  @@map("audit_logs")
}
```

**Purpose**: Track all admin actions for security and compliance.

---

## 3. Indexes Summary

### 3.1 Performance-Critical Indexes

| Table | Column(s) | Purpose |
|-------|-----------|---------|
| `users` | `email` | Login lookup |
| `users` | `role` | Role-based queries |
| `products` | `slug` | SEO URL lookup |
| `products` | `categoryId` | Category filtering |
| `products` | `isActive` | Active product filtering |
| `orders` | `orderNumber` | Order lookup |
| `orders` | `userId` | User order history |
| `orders` | `status` | Order queue filtering |
| `orders` | `createdAt` | Date-based queries |
| `addresses` | `postcode` | Delivery zone matching |
| `cart_items` | `cartId` | Cart item lookup |

---

## 4. Data Constraints

### 4.1 Unique Constraints
- `users.email`: Prevent duplicate accounts
- `products.slug`: SEO-friendly unique URLs
- `products.sku`: Unique product identifier
- `orders.orderNumber`: Human-readable order ID
- `cart_items.[cartId, productId]`: Prevent duplicate cart items

### 4.2 Foreign Key Constraints
- All foreign keys have `onDelete: Cascade` or `onDelete: SetNull`
- Ensures referential integrity

### 4.3 Check Constraints
- `price >= 0`: Prevent negative prices
- `quantity >= 0`: Prevent negative stock
- `deliveryFee >= 0`: Prevent negative fees

---

## 5. Seed Data

### 5.1 Default Users

```typescript
// Admin user
{
  email: "admin@omegaafroshop.com",
  password: bcrypt.hash("Admin123!"),
  firstName: "Admin",
  lastName: "User",
  role: "ADMIN"
}

// Staff user
{
  email: "staff@omegaafroshop.com",
  password: bcrypt.hash("Staff123!"),
  firstName: "Staff",
  lastName: "User",
  role: "STAFF"
}

// Customer user
{
  email: "customer@example.com",
  password: bcrypt.hash("Customer123!"),
  firstName: "John",
  lastName: "Doe",
  role: "CUSTOMER"
}
```

### 5.2 Sample Categories

```typescript
[
  { name: "Fresh Produce", slug: "fresh-produce" },
  { name: "Meats & Fish", slug: "meats-fish" },
  { name: "Dry Foods", slug: "dry-foods" },
  { name: "Frozen Foods", slug: "frozen-foods" },
  { name: "Spices & Seasonings", slug: "spices-seasonings" },
  { name: "Drinks & Beverages", slug: "drinks-beverages" }
]
```

### 5.3 Sample Products

```typescript
[
  {
    name: "Green Plantains",
    slug: "green-plantains",
    price: 2.99,
    unitSize: "1kg",
    categoryId: "fresh-produce",
    stock: 50,
    tags: ["vegan", "gluten-free"]
  },
  {
    name: "Gari (Cassava Flakes)",
    slug: "gari-cassava-flakes",
    price: 3.49,
    unitSize: "500g",
    categoryId: "dry-foods",
    stock: 100,
    tags: ["vegan", "gluten-free"]
  }
]
```

### 5.4 Delivery Zones

```typescript
[
  {
    name: "Bolton Central",
    postcodePrefix: ["BL1", "BL2", "BL3", "BL4"],
    deliveryFee: 3.99,
    minOrderValue: 20.00,
    freeDeliveryThreshold: 50.00
  },
  {
    name: "Manchester",
    postcodePrefix: ["M1", "M2", "M3", "M4"],
    deliveryFee: 5.99,
    minOrderValue: 30.00,
    freeDeliveryThreshold: 60.00
  }
]
```

---

## 6. Migration Strategy

### 6.1 Initial Migration
```bash
npx prisma migrate dev --name init
```

### 6.2 Schema Changes
```bash
# Create migration
npx prisma migrate dev --name add_loyalty_points

# Apply to production
npx prisma migrate deploy
```

### 6.3 Rollback Strategy
- Keep migration history in Git
- Test migrations in staging first
- Backup database before production migration

---

## 7. Database Optimization

### 7.1 Query Optimization
- Use `select` to fetch only needed fields
- Use `include` sparingly (avoid N+1 queries)
- Paginate large result sets

### 7.2 Connection Pooling
```typescript
// Prisma connection pool
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  pool_timeout = 10
  connection_limit = 20
}
```

### 7.3 Caching Strategy
- Cache hot data in Redis (categories, popular products)
- Invalidate cache on updates
- TTL-based expiry

---

## 8. Backup & Recovery

### 8.1 Backup Schedule
- **Frequency**: Daily (automated)
- **Retention**: 30 days
- **Storage**: AWS S3 or equivalent

### 8.2 Restore Procedure
```bash
# Restore from backup
pg_restore -d omega_afro_shop backup.dump
```

### 8.3 Point-in-Time Recovery
- Enable WAL archiving
- Restore to specific timestamp if needed

---

## 9. Security Considerations

### 9.1 Data Encryption
- **At Rest**: PostgreSQL encryption enabled
- **In Transit**: SSL/TLS connections only

### 9.2 Access Control
- **Database Users**: Separate users for app, admin, backup
- **Least Privilege**: App user has limited permissions

### 9.3 Sensitive Data
- **Passwords**: Hashed with bcrypt (cost factor 12)
- **Payment Data**: Never stored (Stripe handles)
- **PII**: Encrypted where necessary

---

## 10. Compliance

### 10.1 GDPR Requirements
- **Data Export**: Users can request data export
- **Data Deletion**: Users can request account deletion
- **Retention**: Orders retained for 7 years (tax compliance)

### 10.2 Audit Trail
- All admin actions logged in `audit_logs`
- Retention: 2 years

---

**Document Owner**: Engineering Team  
**Last Updated**: February 2026  
**Next Review**: Post-MVP Launch
