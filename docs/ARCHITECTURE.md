# System Architecture
## OMEGA AFRO SHOP - Online Ordering & Delivery Platform

**Version**: 1.0  
**Date**: February 2026

---

## 1. Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐ │
│  │  Customer Web    │  │  Admin Portal    │  │  Mobile Web   │ │
│  │  (Next.js SSR)   │  │  (Next.js SSR)   │  │  (Responsive) │ │
│  └────────┬─────────┘  └────────┬─────────┘  └───────┬───────┘ │
│           │                     │                     │          │
└───────────┼─────────────────────┼─────────────────────┼──────────┘
            │                     │                     │
            └─────────────────────┴─────────────────────┘
                                  │
                                  │ HTTPS/REST
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              NestJS Backend API (Node.js)                  │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │  Auth │ Products │ Orders │ Payments │ Admin │ Delivery   │ │
│  │  Module  Module    Module   Module    Module   Module      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
└───────────┬───────────────────────┬───────────────────┬──────────┘
            │                       │                   │
            ▼                       ▼                   ▼
┌─────────────────────┐  ┌──────────────────┐  ┌─────────────────┐
│   DATA LAYER        │  │  CACHE LAYER     │  │  EXTERNAL APIs  │
├─────────────────────┤  ├──────────────────┤  ├─────────────────┤
│                     │  │                  │  │                 │
│  ┌───────────────┐  │  │  ┌────────────┐ │  │  ┌───────────┐ │
│  │  PostgreSQL   │  │  │  │   Redis    │ │  │  │  Stripe   │ │
│  │  (Primary DB) │  │  │  │  (Cache)   │ │  │  │  Payments │ │
│  └───────────────┘  │  │  └────────────┘ │  │  └───────────┘ │
│                     │  │                  │  │                 │
│  ┌───────────────┐  │  │  ┌────────────┐ │  │  ┌───────────┐ │
│  │   AWS S3      │  │  │  │  Sessions  │ │  │  │  SendGrid │ │
│  │   (Images)    │  │  │  │  Rate Limit│ │  │  │  (Email)  │ │
│  └───────────────┘  │  │  └────────────┘ │  │  └───────────┘ │
│                     │  │                  │  │                 │
└─────────────────────┘  └──────────────────┘  │  ┌───────────┐ │
                                               │  │  Twilio   │ │
                                               │  │  (SMS)    │ │
                                               │  └───────────┘ │
                                               └─────────────────┘
```

### 1.2 Technology Stack

#### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form + Zod
- **State Management**: React Context + SWR
- **Payments**: Stripe Elements
- **HTTP Client**: Axios

#### Backend
- **Framework**: NestJS
- **Language**: TypeScript
- **API Style**: REST
- **ORM**: Prisma
- **Validation**: class-validator, class-transformer
- **Authentication**: JWT (jsonwebtoken)
- **Documentation**: Swagger/OpenAPI

#### Database & Storage
- **Primary Database**: PostgreSQL 15+
- **Cache**: Redis 7+
- **File Storage**: AWS S3 (or compatible)
- **Search**: PostgreSQL Full-Text Search

#### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Docker Compose (dev), Kubernetes (optional prod)
- **CI/CD**: GitHub Actions
- **Hosting**: Vercel (frontend), AWS/Railway/Fly.io (backend)
- **Monitoring**: Sentry (errors), Winston (logs)

---

## 2. Frontend Architecture (Next.js)

### 2.1 Directory Structure

```
frontend/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (customer)/           # Customer-facing routes
│   │   │   ├── page.tsx          # Home page
│   │   │   ├── products/
│   │   │   │   ├── page.tsx      # Product listing
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx  # Product detail
│   │   │   ├── cart/
│   │   │   │   └── page.tsx      # Shopping cart
│   │   │   ├── checkout/
│   │   │   │   └── page.tsx      # Checkout flow
│   │   │   ├── orders/
│   │   │   │   ├── page.tsx      # Order history
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx  # Order tracking
│   │   │   └── account/
│   │   │       └── page.tsx      # User account
│   │   ├── (auth)/               # Auth routes
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── reset-password/
│   │   ├── (admin)/              # Admin routes
│   │   │   ├── layout.tsx        # Admin layout
│   │   │   ├── dashboard/
│   │   │   ├── products/
│   │   │   ├── orders/
│   │   │   ├── customers/
│   │   │   └── settings/
│   │   ├── (staff)/              # Staff routes
│   │   │   ├── phone-orders/
│   │   │   └── order-management/
│   │   ├── api/                  # API routes (if needed)
│   │   ├── layout.tsx            # Root layout
│   │   └── globals.css           # Global styles
│   ├── components/               # React components
│   │   ├── ui/                   # Base UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── ...
│   │   ├── layout/               # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── product/              # Product components
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductGrid.tsx
│   │   │   └── ProductFilters.tsx
│   │   ├── cart/                 # Cart components
│   │   │   ├── CartItem.tsx
│   │   │   └── CartSummary.tsx
│   │   └── checkout/             # Checkout components
│   │       ├── DeliveryForm.tsx
│   │       └── PaymentForm.tsx
│   ├── lib/                      # Utilities & helpers
│   │   ├── api.ts                # API client
│   │   ├── auth.ts               # Auth helpers
│   │   ├── stripe.ts             # Stripe client
│   │   └── utils.ts              # General utilities
│   ├── hooks/                    # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useCart.ts
│   │   └── useProducts.ts
│   ├── types/                    # TypeScript types
│   │   ├── product.ts
│   │   ├── order.ts
│   │   └── user.ts
│   └── styles/                   # Additional styles
├── public/                       # Static assets
│   ├── images/
│   └── icons/
├── .env.local                    # Environment variables
├── next.config.js                # Next.js config
├── tailwind.config.js            # Tailwind config
├── tsconfig.json                 # TypeScript config
└── package.json
```

### 2.2 Key Design Patterns

#### Server-Side Rendering (SSR)
- Product pages rendered server-side for SEO
- Category pages pre-rendered with ISR (Incremental Static Regeneration)
- Dynamic routes use `generateStaticParams` for static generation

#### Client-Side State Management
- **Cart**: React Context + localStorage persistence
- **Auth**: Context + HTTP-only cookies
- **Server State**: SWR for data fetching and caching

#### Component Architecture
- **Atomic Design**: Atoms → Molecules → Organisms → Templates → Pages
- **Composition**: Prefer composition over inheritance
- **Separation of Concerns**: Presentational vs Container components

---

## 3. Backend Architecture (NestJS)

### 3.1 Directory Structure

```
backend/
├── src/
│   ├── main.ts                   # Application entry point
│   ├── app.module.ts             # Root module
│   ├── auth/                     # Authentication module
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   │   ├── auth.controller.ts
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   └── dto/
│   │       ├── login.dto.ts
│   │       └── register.dto.ts
│   ├── users/                    # User management module
│   │   ├── users.module.ts
│   │   ├── users.service.ts
│   │   ├── users.controller.ts
│   │   └── dto/
│   ├── products/                 # Product catalog module
│   │   ├── products.module.ts
│   │   ├── products.service.ts
│   │   ├── products.controller.ts
│   │   ├── categories.service.ts
│   │   └── dto/
│   ├── cart/                     # Shopping cart module
│   │   ├── cart.module.ts
│   │   ├── cart.service.ts
│   │   └── cart.controller.ts
│   ├── orders/                   # Order management module
│   │   ├── orders.module.ts
│   │   ├── orders.service.ts
│   │   ├── orders.controller.ts
│   │   └── dto/
│   ├── payments/                 # Stripe integration module
│   │   ├── payments.module.ts
│   │   ├── payments.service.ts
│   │   ├── payments.controller.ts
│   │   ├── stripe.service.ts
│   │   └── webhooks.controller.ts
│   ├── delivery/                 # Delivery management module
│   │   ├── delivery.module.ts
│   │   ├── delivery.service.ts
│   │   ├── delivery.controller.ts
│   │   └── dto/
│   ├── admin/                    # Admin operations module
│   │   ├── admin.module.ts
│   │   ├── admin.service.ts
│   │   └── admin.controller.ts
│   ├── notifications/            # Email/SMS module
│   │   ├── notifications.module.ts
│   │   ├── email.service.ts
│   │   └── sms.service.ts
│   ├── common/                   # Shared utilities
│   │   ├── decorators/
│   │   │   ├── roles.decorator.ts
│   │   │   └── current-user.decorator.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── interceptors/
│   │   │   └── logging.interceptor.ts
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts
│   │   └── utils/
│   └── prisma/                   # Prisma service
│       ├── prisma.module.ts
│       └── prisma.service.ts
├── prisma/
│   ├── schema.prisma             # Database schema
│   ├── migrations/               # Database migrations
│   └── seed.ts                   # Seed data
├── test/                         # E2E tests
├── .env                          # Environment variables
├── nest-cli.json                 # NestJS CLI config
├── tsconfig.json                 # TypeScript config
└── package.json
```

### 3.2 Module Architecture

#### Core Modules

**Auth Module**
- Handles user authentication (login, register, password reset)
- JWT token generation and validation
- Role-based access control (RBAC)
- Guards: `JwtAuthGuard`, `RolesGuard`

**Products Module**
- Product CRUD operations
- Category management
- Inventory tracking
- Product search (full-text)
- Image upload to S3

**Orders Module**
- Order creation and management
- Order status workflow
- Picking list generation
- Order history

**Payments Module**
- Stripe Payment Intents
- Webhook handling (payment success/failure)
- Refund processing
- Payment link generation (phone orders)

**Delivery Module**
- Delivery zone configuration
- Delivery slot management
- Fee calculation
- Driver assignment (manual in MVP)

**Notifications Module**
- Email service (SendGrid/SES)
- SMS service (Twilio)
- Template rendering
- Notification queue (async)

### 3.3 Middleware & Interceptors

#### Global Middleware
1. **CORS**: Allow frontend origin
2. **Helmet**: Security headers
3. **Rate Limiting**: Throttle requests (100 req/min)
4. **Compression**: Gzip responses
5. **Logging**: Request/response logging

#### Interceptors
1. **Logging Interceptor**: Log all requests
2. **Transform Interceptor**: Standardize response format
3. **Timeout Interceptor**: Prevent long-running requests

#### Guards
1. **JWT Auth Guard**: Verify JWT token
2. **Roles Guard**: Check user role permissions

#### Pipes
1. **Validation Pipe**: Validate DTOs with class-validator

---

## 4. Database Architecture

### 4.1 PostgreSQL Schema

See [DATABASE.md](./DATABASE.md) for complete schema.

**Key Design Decisions**:
- **Normalization**: 3NF for data integrity
- **Indexes**: On foreign keys, search fields, and frequently queried columns
- **Constraints**: Foreign keys, unique constraints, check constraints
- **Soft Deletes**: `deletedAt` timestamp for products, users
- **Audit Trail**: `createdAt`, `updatedAt` on all tables

### 4.2 Prisma ORM

**Benefits**:
- Type-safe database queries
- Auto-generated TypeScript types
- Migration management
- Introspection and seeding

**Example Schema**:
```prisma
model Product {
  id          String   @id @default(uuid())
  name        String
  slug        String   @unique
  description String?
  price       Decimal  @db.Decimal(10, 2)
  stock       Int      @default(0)
  categoryId  String
  category    Category @relation(fields: [categoryId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([categoryId])
  @@index([slug])
}
```

---

## 5. Caching Strategy (Redis)

### 5.1 Cache Use Cases

#### Session Storage
- Store JWT tokens (optional, if not using HTTP-only cookies)
- Session expiry: 7 days

#### Rate Limiting
- Track request counts per IP/user
- Sliding window algorithm

#### Hot Data Caching
- **Product Catalog**: Cache popular products (TTL: 5 minutes)
- **Categories**: Cache category tree (TTL: 1 hour)
- **Delivery Zones**: Cache zone config (TTL: 1 hour)

### 5.2 Cache Invalidation

- **Write-Through**: Update cache on database write
- **TTL-Based**: Expire cache after time limit
- **Event-Based**: Invalidate on product update, category change

---

## 6. Payment Integration (Stripe)

### 6.1 Payment Flow

```
Customer Checkout
       │
       ▼
Frontend: Create Payment Intent
       │
       ▼
Backend: POST /payments/create-intent
       │
       ├─► Validate cart
       ├─► Calculate total
       ├─► Create Stripe Payment Intent
       └─► Return client_secret
       │
       ▼
Frontend: Stripe Elements (card form)
       │
       ▼
Customer: Submit payment
       │
       ▼
Stripe: Process payment
       │
       ├─► Success ──► Webhook: payment_intent.succeeded
       │                  │
       │                  ▼
       │              Backend: Create order, send confirmation
       │
       └─► Failure ──► Webhook: payment_intent.payment_failed
                          │
                          ▼
                      Backend: Log failure, notify customer
```

### 6.2 Webhook Handling

**Stripe Webhooks**:
- `payment_intent.succeeded`: Create order, send confirmation
- `payment_intent.payment_failed`: Log failure, notify customer
- `charge.refunded`: Update order status, notify customer

**Security**:
- Verify webhook signature with `stripe.webhooks.constructEvent`
- Idempotency: Check if event already processed

---

## 7. File Storage (AWS S3)

### 7.1 S3 Bucket Structure

```
omega-afro-shop-images/
├── products/
│   ├── {product-id}/
│   │   ├── main.jpg
│   │   ├── gallery-1.jpg
│   │   └── gallery-2.jpg
├── categories/
│   └── {category-id}.jpg
└── temp/
    └── {upload-id}.jpg  (deleted after 24h)
```

### 7.2 Upload Flow

1. Frontend requests signed URL from backend
2. Backend generates pre-signed S3 URL (PUT)
3. Frontend uploads directly to S3
4. Frontend confirms upload to backend
5. Backend saves image URL to database

**Benefits**:
- Offload upload bandwidth from backend
- Faster uploads (direct to S3)
- Secure (pre-signed URLs expire after 15 minutes)

---

## 8. Security Architecture

### 8.1 Authentication Flow

```
User Login
    │
    ▼
POST /auth/login (email, password)
    │
    ├─► Validate credentials
    ├─► Hash password (bcrypt)
    ├─► Compare with stored hash
    └─► Generate JWT token
    │
    ▼
Return JWT in HTTP-only cookie
    │
    ▼
Subsequent Requests
    │
    ├─► Extract JWT from cookie
    ├─► Verify signature
    ├─► Check expiry
    └─► Attach user to request
```

### 8.2 Authorization (RBAC)

**Roles**:
- `CUSTOMER`: Browse, cart, checkout, view own orders
- `STAFF`: Create phone orders, view all orders
- `ADMIN`: Full access (products, orders, users, settings)
- `PICKER`: View picking lists, update order status

**Implementation**:
```typescript
@Roles('ADMIN')
@UseGuards(JwtAuthGuard, RolesGuard)
@Post('products')
createProduct(@Body() dto: CreateProductDto) {
  // Only admins can create products
}
```

### 8.3 Security Layers

1. **Transport Security**: HTTPS only (TLS 1.2+)
2. **Input Validation**: DTO validation with class-validator
3. **Output Encoding**: Prevent XSS
4. **SQL Injection**: Prisma ORM (parameterized queries)
5. **CSRF Protection**: SameSite cookies
6. **Rate Limiting**: Throttle auth endpoints
7. **Audit Logging**: Log all admin actions

---

## 9. Deployment Architecture

### 9.1 Development Environment

```
Docker Compose (Local)
├── PostgreSQL (port 5432)
├── Redis (port 6379)
├── Backend (port 4000)
└── Frontend (port 3000)
```

**Commands**:
```bash
docker-compose up -d
```

### 9.2 Production Environment

#### Option 1: Vercel + AWS
- **Frontend**: Vercel (Next.js optimized)
- **Backend**: AWS ECS (Fargate) or EC2
- **Database**: AWS RDS (PostgreSQL)
- **Cache**: AWS ElastiCache (Redis)
- **Storage**: AWS S3
- **CDN**: CloudFront

#### Option 2: Railway/Fly.io (Simpler)
- **Frontend**: Vercel
- **Backend**: Railway or Fly.io
- **Database**: Railway Postgres or Fly.io Postgres
- **Cache**: Railway Redis or Upstash Redis
- **Storage**: AWS S3 or Cloudflare R2

### 9.3 CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Install dependencies
      - Run linter
      - Run unit tests
      - Run E2E tests

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - Build Docker images
      - Push to registry

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - Deploy to staging
      - Run smoke tests
      - Deploy to production (manual approval)
```

---

## 10. Monitoring & Observability

### 10.1 Error Tracking
- **Tool**: Sentry
- **Scope**: Frontend and backend errors
- **Alerts**: Slack/email on critical errors

### 10.2 Logging
- **Tool**: Winston (structured JSON logs)
- **Levels**: error, warn, info, debug
- **Storage**: CloudWatch Logs or Logtail

### 10.3 Metrics
- **API Response Times**: Track p50, p95, p99
- **Order Volume**: Orders per hour/day
- **Payment Success Rate**: Track Stripe success/failure
- **Cache Hit Rate**: Redis cache effectiveness

### 10.4 Uptime Monitoring
- **Tool**: UptimeRobot or Pingdom
- **Endpoints**: Health check (`/health`)
- **Alerts**: Email/SMS on downtime

---

## 11. Scalability Considerations

### 11.1 Horizontal Scaling
- **Backend**: Multiple NestJS instances behind load balancer
- **Database**: Read replicas for read-heavy queries
- **Cache**: Redis cluster for high availability

### 11.2 Performance Optimization
- **Database**: Indexed queries, connection pooling
- **Caching**: Redis for hot data
- **CDN**: Static assets served via CDN
- **Image Optimization**: WebP format, lazy loading

### 11.3 Future Enhancements
- **Microservices**: Split monolith into services (products, orders, payments)
- **Message Queue**: RabbitMQ or SQS for async tasks
- **Elasticsearch**: Advanced product search
- **GraphQL**: Alternative to REST API

---

## 12. Disaster Recovery

### 12.1 Backup Strategy
- **Database**: Daily automated backups (30-day retention)
- **Images**: S3 versioning enabled
- **Code**: Git repository (GitHub)

### 12.2 Recovery Procedures
- **RTO** (Recovery Time Objective): 4 hours
- **RPO** (Recovery Point Objective): 1 hour
- **Restore Process**: Automated scripts for database restore

---

## 13. Architecture Decision Records (ADRs)

### ADR-001: Why Next.js over React SPA?
**Decision**: Use Next.js with SSR  
**Rationale**: SEO is critical for product pages. SSR improves initial load time and search engine indexing.

### ADR-002: Why NestJS over Express?
**Decision**: Use NestJS  
**Rationale**: Built-in structure, TypeScript support, dependency injection, and scalability.

### ADR-003: Why PostgreSQL over MongoDB?
**Decision**: Use PostgreSQL  
**Rationale**: Relational data (orders, products, users) benefits from ACID compliance and strong consistency.

### ADR-004: Why Stripe over PayPal?
**Decision**: Use Stripe  
**Rationale**: Better developer experience, modern API, supports Apple Pay/Google Pay, PCI compliance handled.

### ADR-005: Why Prisma over TypeORM?
**Decision**: Use Prisma  
**Rationale**: Better TypeScript support, auto-generated types, simpler migrations, modern DX.

---

**Document Owner**: Engineering Team  
**Last Updated**: February 2026  
**Next Review**: Post-MVP Launch
