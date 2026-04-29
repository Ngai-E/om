# OMEGA AFRO SHOP - Online Ordering & Delivery Platform

**Business**: OMEGA AFRO CARIBBEAN SUPERSTORE LTD  
**Address**: 76–78 Higher Market Street, Farnworth, Bolton, BL4 9BB (UK)  
**Contact**: 07535 316253  
**Brand Color**: Green

## Overview

Modern, mobile-first online ordering platform for African & Caribbean groceries with:
- Customer browsing, cart, and Stripe checkout
- Delivery and collection options with zone-based fees
- Staff-assisted phone orders with pay-by-link
- Admin catalog, inventory, and order management
- Real-time order tracking and notifications

## Tech Stack

### Frontend
- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS** (Mobile-first responsive design)
- **React Hook Form + Zod** (Form validation)
- **Stripe Elements** (Secure payments)

### Backend
- **NestJS** (TypeScript, REST API)
- **Prisma ORM** (PostgreSQL)
- **Redis** (Caching, rate limiting)
- **Stripe** (Payment Intents, Webhooks)
- **JWT** (Authentication with HTTP-only cookies)

### Infrastructure
- **PostgreSQL** (Primary database)
- **Redis** (Cache layer)
- **AWS S3** (Image storage)
- **Docker** (Containerization)
- **GitHub Actions** (CI/CD)

## Project Structure

```
omega-afro-shop/
├── backend/                 # NestJS API
│   ├── src/
│   │   ├── auth/           # Authentication & authorization
│   │   ├── users/          # User management
│   │   ├── products/       # Product catalog
│   │   ├── orders/         # Order processing
│   │   ├── payments/       # Stripe integration
│   │   ├── delivery/       # Delivery zones & slots
│   │   ├── admin/          # Admin operations
│   │   └── common/         # Shared utilities
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   ├── Dockerfile
│   └── package.json
├── frontend/                # Next.js app
│   ├── src/
│   │   ├── app/            # App Router pages
│   │   ├── components/     # React components
│   │   ├── lib/            # Utilities & API client
│   │   └── styles/         # Global styles
│   ├── public/             # Static assets
│   ├── Dockerfile
│   └── package.json
├── docs/                    # Documentation
│   ├── PRD.md              # Product Requirements
│   ├── SRS.md              # Software Requirements
│   ├── API.md              # API Specification
│   ├── ARCHITECTURE.md     # System Architecture
│   └── DATABASE.md         # Database Schema
├── docker-compose.yml       # Local development
└── .github/
    └── workflows/           # CI/CD pipelines
```

## Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+
- Stripe account

### Environment Setup

1. **Clone and install dependencies**:
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

2. **Configure environment variables**:

**Backend** (`backend/.env`):
```env
DATABASE_URL="postgresql://user:password@localhost:5432/omega_afro_shop"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-secret-key-change-in-production"
JWT_EXPIRES_IN="7d"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
AWS_S3_BUCKET="omega-afro-shop-images"
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="eu-west-2"
FRONTEND_URL="http://localhost:3000"
PORT=4000
```

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL="http://localhost:4000"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

3. **Start with Docker Compose** (Recommended):
```bash
docker-compose up -d
```

Or manually:

```bash
# Start PostgreSQL & Redis
docker-compose up -d postgres redis

# Backend
cd backend
npx prisma migrate dev
npx prisma db seed
npm run start:dev

# Frontend (new terminal)
cd frontend
npm run dev
```

4. **Access the application**:
- **Customer App**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3000/admin
- **API**: http://localhost:4000
- **API Docs**: http://localhost:4000/api/docs

### Default Accounts

**Admin**:
- Email: `admin@omegaafroshop.com`
- Password: `Admin123!`

**Staff**:
- Email: `staff@omegaafroshop.com`
- Password: `Staff123!`

**Customer**:
- Email: `customer@example.com`
- Password: `Customer123!`

## Development

### Database Migrations
```bash
cd backend
npx prisma migrate dev --name migration_name
npx prisma generate
```

### Seed Data
```bash
cd backend
npx prisma db seed
```

### Run Tests
```bash
# Backend unit tests
cd backend
npm run test

# Backend e2e tests
npm run test:e2e

# Frontend tests
cd frontend
npm run test

# E2E tests (Playwright)
npm run test:e2e
```

### Code Quality
```bash
# Lint
npm run lint

# Format
npm run format

# Type check
npm run type-check
```

## Deployment

### Production Build

**Backend**:
```bash
cd backend
npm run build
npm run start:prod
```

**Frontend**:
```bash
cd frontend
npm run build
npm run start
```

### Docker Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Checklist
- [ ] Set strong `JWT_SECRET`
- [ ] Configure production Stripe keys
- [ ] Set up AWS S3 bucket with proper CORS
- [ ] Configure PostgreSQL backups
- [ ] Set up Redis persistence
- [ ] Configure domain and SSL certificates
- [ ] Set up monitoring (Sentry, LogRocket)
- [ ] Configure email/SMS providers
- [ ] Set up CDN for static assets
- [ ] Enable rate limiting
- [ ] Configure CORS for production domains

## Features

### Customer Features (MVP)
- ✅ Browse products by category
- ✅ Search with typo tolerance
- ✅ Product filters (price, availability, dietary)
- ✅ Shopping cart with quantity management
- ✅ Delivery vs Collection selection
- ✅ Postcode-based delivery zones & fees
- ✅ Secure Stripe checkout (Card, Apple Pay, Google Pay)
- ✅ Guest and registered checkout
- ✅ Order confirmation (email + SMS)
- ✅ Order tracking with status updates
- ✅ Order history (registered users)
- ✅ Saved delivery addresses

### Staff Features (MVP)
- ✅ Phone order creation
- ✅ Customer search/creation
- ✅ Send Stripe payment links
- ✅ Cash-on-delivery option
- ✅ Order management dashboard
- ✅ Picking list generation
- ✅ Order status updates

### Admin Features (MVP)
- ✅ Product CRUD operations
- ✅ Category management
- ✅ Inventory tracking
- ✅ Low-stock alerts
- ✅ Bulk CSV import/export
- ✅ Image upload (drag & drop)
- ✅ Order management
- ✅ Delivery zone configuration
- ✅ Fee rules by postcode
- ✅ User & role management
- ✅ Refund processing
- ✅ Audit logs

### Phase 2 (Future)
- Loyalty points program
- Subscription boxes
- WhatsApp ordering
- Driver mobile app
- Barcode scanning
- Product recommendations
- Advanced analytics
- Multi-language support

## API Documentation

See [docs/API.md](./docs/API.md) for complete API specification.

**Base URL**: `http://localhost:4000/api/v1`

Key endpoints:
- `POST /auth/login` - User authentication
- `GET /products` - List products
- `POST /cart` - Manage cart
- `POST /orders` - Create order
- `POST /payments/create-intent` - Stripe payment
- `POST /admin/products` - Create product (admin)

## Database Schema

See [docs/DATABASE.md](./docs/DATABASE.md) for complete schema documentation.

Core entities:
- User, Role, CustomerProfile
- Product, Category, Inventory
- Cart, CartItem
- Order, OrderItem, Payment
- DeliveryZone, Address

## Security

- ✅ Stripe handles all card data (PCI compliant)
- ✅ JWT with HTTP-only cookies
- ✅ Role-based access control (RBAC)
- ✅ OWASP Top 10 protections
- ✅ Rate limiting on auth/checkout
- ✅ CSRF protection
- ✅ SQL injection prevention (Prisma)
- ✅ XSS protection
- ✅ Audit logs for admin actions
- ✅ GDPR compliance (data export/delete)

## Performance

- Server-side rendering for SEO
- Image optimization (Next.js Image)
- Redis caching for hot catalog data
- Database query optimization
- CDN for static assets
- Lazy loading for images
- Mobile-first responsive design

## Monitoring & Observability

- Structured logging (Winston)
- Error tracking (Sentry)
- Performance monitoring
- Stripe webhook monitoring
- Database query performance
- API response times

## Support

**Business Contact**: 07535 316253  
**Technical Issues**: Create an issue in the repository  
**Facebook**: OMEGA AFRO SHOP on Facebook

## License

Proprietary - OMEGA AFRO CARIBBEAN SUPERSTORE LTD

---

**Built with ❤️ for the African & Caribbean community in Bolton, UK**

# Tenant
NEXT_BUILD_DIR=.next-tenant PORT=3001 npm run dev

# Platform
NEXT_PUBLIC_IS_PLATFORM=true NEXT_BUILD_DIR=.next-platform PORT=3000 npm run dev