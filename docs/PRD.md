# Product Requirements Document (PRD)
## OMEGA AFRO SHOP - Online Ordering & Delivery Platform

**Version**: 1.0  
**Date**: February 2026  
**Status**: MVP Specification

---

## 1. Executive Summary

### 1.1 Product Vision
Build a modern, mobile-first online ordering platform for OMEGA AFRO CARIBBEAN SUPERSTORE LTD that enables customers to browse African & Caribbean groceries, place orders for delivery or collection, and pay securely via Stripe—while empowering staff to manage phone orders and admin to control catalog, inventory, and fulfillment operations.

### 1.2 Business Context
- **Business Name**: OMEGA AFRO CARIBBEAN SUPERSTORE LTD / OMEGA AFRO SHOP
- **Location**: 76–78 Higher Market Street, Farnworth, Bolton, BL4 9BB (UK)
- **Contact**: 07535 316253
- **Brand Color**: Green
- **Product Range**: African & Caribbean groceries (fresh produce, dry goods, frozen items, meats/fish, spices, drinks)
- **Facebook**: OMEGA AFRO SHOP on Facebook

### 1.3 Success Metrics
- **Customer Acquisition**: 500+ registered users in first 3 months
- **Order Volume**: 100+ orders per week within 6 months
- **Conversion Rate**: 3%+ from browse to checkout
- **Average Order Value**: £40+
- **Customer Satisfaction**: 4.5+ star rating
- **Staff Efficiency**: 50% reduction in phone order processing time

---

## 2. Target Users

### 2.1 Primary Users

#### Customer (Mobile & Desktop)
- **Demographics**: African & Caribbean diaspora in Bolton/Greater Manchester, ages 25-55
- **Behaviors**: 
  - Shops weekly for groceries
  - Values authentic products from home countries
  - Prefers mobile shopping (70% mobile traffic expected)
  - Needs delivery due to distance/convenience
- **Pain Points**:
  - Limited time to visit physical store
  - Difficulty finding specific African/Caribbean products
  - Uncertainty about product availability
  - Need for flexible delivery options

#### Staff (Phone Order Takers)
- **Role**: Take orders over the phone from customers who prefer calling
- **Behaviors**:
  - Handles 20-30 calls per day
  - Needs quick product lookup
  - Must capture customer details accurately
  - Sends payment links or processes cash-on-delivery
- **Pain Points**:
  - Manual order entry is slow
  - Difficult to track phone order payments
  - Customer address errors
  - No system for order history lookup

#### Admin/Manager
- **Role**: Manages catalog, inventory, pricing, and fulfillment
- **Behaviors**:
  - Updates product availability daily
  - Monitors stock levels
  - Processes orders and assigns delivery
  - Handles refunds and customer issues
- **Pain Points**:
  - Manual inventory tracking
  - No visibility into order pipeline
  - Difficult to manage delivery zones
  - Time-consuming product updates

### 2.2 Secondary Users

#### Picker/Packer
- **Role**: Fulfills orders in warehouse
- **Needs**: Clear picking lists, substitution guidance

#### Delivery Driver (Future Phase)
- **Role**: Delivers orders to customers
- **Needs**: Route optimization, delivery proof (future)

---

## 3. Goals & Objectives

### 3.1 Business Goals
1. **Increase Revenue**: Expand customer base beyond walk-in traffic
2. **Operational Efficiency**: Reduce manual order processing time by 50%
3. **Customer Retention**: Build loyalty through convenient online ordering
4. **Market Expansion**: Serve customers across Greater Manchester
5. **Data Insights**: Understand customer preferences and buying patterns

### 3.2 User Goals

**Customer**:
- Find and purchase authentic African/Caribbean products easily
- Choose convenient delivery or collection times
- Pay securely online
- Track order status in real-time

**Staff**:
- Process phone orders quickly and accurately
- Send secure payment links to customers
- Access customer order history

**Admin**:
- Manage product catalog efficiently
- Monitor inventory and prevent stockouts
- Control delivery operations
- Process refunds and adjustments

---

## 4. MVP Scope (Must-Have Features)

### 4.1 Customer Features

#### 4.1.1 Product Browsing & Discovery
**Priority**: P0 (Launch Blocker)

**Features**:
- **Home Page**:
  - Hero banner with brand messaging
  - Featured categories (Fresh Produce, Meats/Fish, Dry Foods, Frozen, Spices, Drinks)
  - "New Arrivals" section
  - "Best Sellers" section
  - Promotional banners
  
- **Category Navigation**:
  - Main categories with subcategories
  - Category images and descriptions
  - Product count per category
  
- **Product Search**:
  - Search bar with autocomplete
  - Typo tolerance (e.g., "garri" vs "gari")
  - Synonym support (e.g., "scent leaf" = "basil")
  - Search results with filters
  
- **Product Filters**:
  - Price range slider
  - Availability (In Stock, Out of Stock)
  - Dietary tags (Vegan, Gluten-Free, Halal)
  - Brand
  - Size/Weight
  
- **Product Detail Page**:
  - Product name and images (gallery)
  - Price and unit size
  - Stock status (In Stock / Limited Stock / Out of Stock)
  - Description
  - Origin country
  - Ingredients & allergen information
  - Nutritional facts (optional)
  - Related products

**User Stories**:
```
As a customer, I can browse products by category so I can find items easily.
Acceptance Criteria:
- Categories display with images and product counts
- Clicking a category shows all products in that category
- Subcategories are accessible from category pages

As a customer, I can search for products by name so I can quickly find what I want.
Acceptance Criteria:
- Search bar is visible on all pages
- Search returns relevant results within 500ms
- Typos are handled gracefully (e.g., "plantian" → "plantain")
- No results state shows helpful message

As a customer, I can view product details so I can make informed purchase decisions.
Acceptance Criteria:
- Product page shows all key information (price, stock, description)
- Images are high quality and zoomable
- Stock status is accurate and real-time
- Allergen information is clearly displayed
```

#### 4.1.2 Shopping Cart
**Priority**: P0 (Launch Blocker)

**Features**:
- Add to cart from product page
- Update quantity (+ / - buttons)
- Remove items
- "Save for Later" option
- Cart summary (subtotal, delivery fee, total)
- Persistent cart (logged-in users)
- Cart badge showing item count

**User Stories**:
```
As a customer, I can add products to a cart and change quantities.
Acceptance Criteria:
- "Add to Cart" button is visible on product pages
- Cart updates immediately without page reload
- Quantity can be increased/decreased
- Cart shows accurate subtotal
- Cart persists across sessions for logged-in users

As a customer, I can remove items from my cart.
Acceptance Criteria:
- Remove button is clearly visible
- Confirmation prompt prevents accidental removal
- Cart updates immediately after removal
```

#### 4.1.3 Checkout & Payment
**Priority**: P0 (Launch Blocker)

**Features**:
- **Delivery vs Collection**:
  - Toggle between delivery and collection
  - Delivery: Enter postcode, select address, choose delivery slot
  - Collection: Select collection time slot
  
- **Delivery Fees**:
  - Calculated based on postcode/zone
  - Free delivery threshold (e.g., orders over £50)
  - Minimum order value per zone
  
- **Checkout Flow**:
  - Guest checkout (email + phone required)
  - Registered user checkout (saved addresses)
  - Delivery/Collection selection
  - Delivery slot selection (date + time window)
  - Payment method selection
  
- **Payment Options**:
  - Stripe card payments (Visa, Mastercard, Amex)
  - Apple Pay (via Stripe)
  - Google Pay (via Stripe)
  - Cash on Delivery (configurable, staff-only)
  
- **Order Confirmation**:
  - Confirmation page with order number
  - Email confirmation with receipt
  - SMS confirmation (optional)

**User Stories**:
```
As a customer, I can choose delivery or collection.
Acceptance Criteria:
- Delivery/Collection toggle is clear
- Delivery shows postcode entry and fee calculation
- Collection shows available pickup times
- Minimum order value is enforced for delivery zones

As a customer, I can pay securely using card via Stripe.
Acceptance Criteria:
- Stripe Elements form is embedded in checkout
- Card validation is real-time
- Payment succeeds and order is created
- Payment failures show clear error messages
- No card data is stored on our servers

As a customer, I receive an order confirmation after payment.
Acceptance Criteria:
- Confirmation page shows order number and summary
- Email is sent within 1 minute of order placement
- Email includes order details, delivery info, and receipt
```

#### 4.1.4 Order Tracking
**Priority**: P1 (Post-Launch)

**Features**:
- Order status timeline:
  - Received
  - Picking
  - Packed
  - Out for Delivery / Ready for Collection
  - Delivered / Collected
- Email notifications on status changes
- SMS notifications (optional, configurable)
- Estimated delivery time

**User Stories**:
```
As a customer, I can track my order status online.
Acceptance Criteria:
- Order tracking page shows current status
- Status timeline is visual and easy to understand
- Email notification sent on each status change
- Estimated delivery time is displayed
```

#### 4.1.5 Account Management
**Priority**: P1 (Post-Launch)

**Features**:
- User registration (email + password)
- Login / Logout
- Password reset
- Profile management (name, phone, email)
- Saved delivery addresses (add/edit/delete)
- Order history
- Reorder from past orders

**User Stories**:
```
As a customer, I can create an account to see my order history.
Acceptance Criteria:
- Registration form is simple (email, password, name, phone)
- Email verification is sent
- Login redirects to account dashboard
- Order history shows all past orders with details

As a customer, I can save delivery addresses.
Acceptance Criteria:
- Address book allows multiple addresses
- Default address can be set
- Addresses can be edited or deleted
- Checkout pre-fills saved addresses
```

---

### 4.2 Staff Features (Phone Orders)

#### 4.2.1 Phone Order Creation
**Priority**: P0 (Launch Blocker)

**Features**:
- **Staff Dashboard**:
  - Quick product search
  - Build cart for customer
  - Apply special notes (e.g., "customer prefers green plantains")
  - Set delivery window
  
- **Customer Identification**:
  - Search existing customer by phone or email
  - Create new customer profile quickly
  - View customer order history
  
- **Payment Options**:
  - Send Stripe Payment Link via SMS/email
  - Mark as "Cash on Delivery" (if enabled)
  - Mark as "Pay in Store" for collection
  
- **Order Confirmation**:
  - Generate order immediately
  - Send confirmation to customer
  - Print order receipt

**User Stories**:
```
As staff, I can create an order on behalf of a customer who calls the shop.
Acceptance Criteria:
- Staff UI allows quick product search
- Cart can be built with quantities and notes
- Customer details can be entered or selected
- Order is created and assigned to customer

As staff, I can send a payment link to the customer via Stripe.
Acceptance Criteria:
- Payment link is generated via Stripe
- Link is sent via SMS and/or email
- Link expires after 24 hours
- Payment status is tracked in admin panel

As staff, I can mark phone orders as cash-on-delivery if enabled.
Acceptance Criteria:
- COD option is visible only if enabled in settings
- COD orders are flagged for manual review
- COD limit per customer is enforced
```

---

### 4.3 Admin Features

#### 4.3.1 Product & Catalog Management
**Priority**: P0 (Launch Blocker)

**Features**:
- **Product CRUD**:
  - Create, Read, Update, Delete products
  - Product fields: name, description, price, SKU, barcode, category, images, stock, unit size, origin, allergens
  - Product variants (e.g., size, weight)
  - Bulk actions (enable/disable, delete)
  
- **Category Management**:
  - Create/edit/delete categories
  - Subcategory support
  - Category images and descriptions
  - Reorder categories
  
- **Image Management**:
  - Drag-and-drop upload
  - Multiple images per product
  - Image cropping/resizing
  - S3 storage
  
- **Bulk Import/Export**:
  - CSV import for products
  - CSV export for inventory
  - Template download

**User Stories**:
```
As an admin, I can create, update, and disable products.
Acceptance Criteria:
- Product form includes all required fields
- Images can be uploaded via drag-and-drop
- Product is immediately visible on storefront
- Disabled products are hidden from customers

As an admin, I can manage product stock levels.
Acceptance Criteria:
- Stock quantity can be updated manually
- Stock is decremented on order placement
- Low-stock alerts are triggered at threshold
- Out-of-stock products show "Out of Stock" badge
```

#### 4.3.2 Order Management
**Priority**: P0 (Launch Blocker)

**Features**:
- **Order Dashboard**:
  - List all orders with filters (status, date, customer)
  - Search by order number, customer name, phone
  - Order details view
  
- **Order Status Workflow**:
  - Update status (Received → Picking → Packed → Out for Delivery → Delivered)
  - Status change triggers customer notification
  
- **Picking List**:
  - Generate picking list for orders
  - Group by aisle/category
  - Print-friendly format
  
- **Refunds & Adjustments**:
  - Partial or full refund via Stripe
  - Reason codes (damaged, out of stock, customer request)
  - Refund history

**User Stories**:
```
As an admin, I can view incoming orders in real time.
Acceptance Criteria:
- Order dashboard shows all orders sorted by date
- New orders appear immediately
- Order details show customer info, items, payment status

As an admin, I can update order status.
Acceptance Criteria:
- Status dropdown allows status change
- Customer receives email notification on status change
- Status timeline is updated

As staff, I can generate a picking list for orders.
Acceptance Criteria:
- Picking list groups items by category
- List shows product name, quantity, location
- List is printable
```

#### 4.3.3 Delivery Management
**Priority**: P1 (Post-Launch)

**Features**:
- **Delivery Zones**:
  - Define zones by postcode prefix (e.g., BL1, BL2, M1)
  - Set delivery fee per zone
  - Set minimum order value per zone
  - Enable/disable zones
  
- **Delivery Slots**:
  - Define time windows (e.g., 10am-12pm, 2pm-4pm)
  - Set capacity per slot
  - Disable slots on specific dates
  
- **Driver Assignment** (Manual in MVP):
  - Assign orders to drivers
  - View driver workload

**User Stories**:
```
As admin, I can define delivery zones and fees.
Acceptance Criteria:
- Delivery zones can be created with postcode prefixes
- Fees and minimum order values are configurable
- Zones can be enabled/disabled
- Customer sees correct fee based on postcode

As admin, I receive low-stock alerts.
Acceptance Criteria:
- Alert threshold is configurable per product
- Email notification sent when stock falls below threshold
- Dashboard shows low-stock products
```

---

## 5. Out of Scope (Phase 2)

The following features are **NOT** included in MVP:

- ❌ Loyalty points program
- ❌ Subscription boxes
- ❌ WhatsApp ordering integration
- ❌ Driver mobile app
- ❌ Barcode scanning for picking
- ❌ Product recommendations (AI-powered)
- ❌ Advanced analytics dashboard
- ❌ Multi-language support
- ❌ Customer reviews & ratings
- ❌ Live chat support
- ❌ Gift cards
- ❌ Promotional discount codes (basic version in Phase 2)

---

## 6. User Experience Requirements

### 6.1 Design Principles
1. **Mobile-First**: 70% of users will access via mobile
2. **Speed**: Core pages load in <2s on 4G
3. **Simplicity**: Minimize clicks to checkout (3-click rule)
4. **Accessibility**: WCAG 2.1 AA compliance
5. **Brand Consistency**: Green primary color, clean grocery aesthetic

### 6.2 Key Screens

#### Customer Screens
1. **Home Page**: Hero, categories, featured products, promotions
2. **Category Listing**: Grid view, filters, sort options
3. **Product Detail**: Images, price, description, add to cart
4. **Cart**: Item list, quantities, subtotal, checkout button
5. **Checkout**: Delivery/collection, address, payment
6. **Order Confirmation**: Order summary, tracking link
7. **Order Tracking**: Status timeline, delivery info
8. **Account Dashboard**: Profile, addresses, order history

#### Staff Screens
1. **Phone Order Dashboard**: Product search, cart builder
2. **Customer Lookup**: Search, create, view history
3. **Payment Link Generator**: Send link, track payment

#### Admin Screens
1. **Admin Dashboard**: Overview stats, recent orders
2. **Product Management**: List, create, edit, bulk actions
3. **Order Management**: Order queue, status updates, picking lists
4. **Delivery Zones**: Zone config, fee rules
5. **User Management**: Staff accounts, roles

### 6.3 Responsive Breakpoints
- **Mobile**: 320px - 767px
- **Tablet**: 768px - 1023px
- **Desktop**: 1024px+

### 6.4 Accessibility Requirements
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode
- Focus indicators
- Alt text for all images
- ARIA labels for interactive elements

---

## 7. Non-Functional Requirements

### 7.1 Performance
- **Page Load**: <2s on 4G for core pages
- **API Response**: <500ms for product listing
- **Checkout Flow**: <5s from cart to confirmation
- **Image Optimization**: WebP format, lazy loading
- **Caching**: Redis for hot catalog data

### 7.2 Security
- **PCI Compliance**: Stripe handles all card data
- **Authentication**: JWT with HTTP-only cookies
- **Authorization**: Role-based access control (RBAC)
- **OWASP Top 10**: Protection against XSS, CSRF, SQLi
- **Rate Limiting**: 100 req/min per IP on auth endpoints
- **Audit Logs**: All admin actions logged

### 7.3 Privacy & Compliance
- **GDPR/UK DPA**: 
  - Data export request flow
  - Data deletion request flow
  - Cookie consent banner
  - Privacy policy page
- **Email Opt-In**: Marketing emails require consent
- **Data Retention**: Orders retained for 7 years (tax compliance)

### 7.4 Reliability
- **Uptime**: 99.5% target
- **Error Monitoring**: Sentry integration
- **Logging**: Structured logs (Winston)
- **Backups**: Daily PostgreSQL backups, 30-day retention
- **Disaster Recovery**: RTO 4 hours, RPO 1 hour

### 7.5 Scalability
- **Concurrent Users**: Support 500 concurrent users
- **Order Volume**: Handle 1000 orders/day
- **Database**: Optimized indexes, query performance monitoring
- **CDN**: Static assets served via CDN

---

## 8. Success Criteria

### 8.1 Launch Readiness
- [ ] All P0 features implemented and tested
- [ ] Stripe payment flow tested (test mode)
- [ ] Mobile responsive on iOS and Android
- [ ] Admin can create products and manage orders
- [ ] Staff can create phone orders
- [ ] Customers can complete checkout
- [ ] Email confirmations working
- [ ] Production environment configured
- [ ] Security audit passed
- [ ] Performance benchmarks met

### 8.2 Post-Launch Metrics (3 Months)
- **User Acquisition**: 500+ registered users
- **Order Volume**: 100+ orders/week
- **Conversion Rate**: 3%+
- **Average Order Value**: £40+
- **Cart Abandonment**: <70%
- **Customer Satisfaction**: 4.5+ stars
- **Page Load Time**: <2s (95th percentile)
- **Checkout Success Rate**: >95%

---

## 9. Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Stripe integration issues | High | Medium | Thorough testing in test mode, webhook monitoring |
| Low customer adoption | High | Medium | Marketing campaign, in-store promotion, staff training |
| Delivery zone complexity | Medium | High | Start with simple zones, iterate based on demand |
| Inventory sync issues | High | Low | Real-time stock updates, low-stock alerts |
| Payment fraud (COD) | Medium | Medium | Limit COD, blocklist, manual review |
| Performance issues at scale | Medium | Low | Load testing, caching strategy, CDN |
| Data privacy breach | High | Low | Security audit, encryption, access controls |

---

## 10. Timeline & Milestones

### Phase 1: MVP (8-10 weeks)
- **Week 1-2**: Foundation (project setup, database schema, API spec)
- **Week 3-4**: Backend core (auth, products, orders, Stripe)
- **Week 5-6**: Frontend core (browse, cart, checkout)
- **Week 7**: Staff phone orders + Admin dashboard
- **Week 8**: Testing, bug fixes, polish
- **Week 9**: Staging deployment, UAT
- **Week 10**: Production launch

### Phase 2: Enhancements (Post-Launch)
- Loyalty points
- Discount codes
- WhatsApp notifications
- Driver app
- Advanced analytics

---

## 11. Stakeholder Sign-Off

| Stakeholder | Role | Approval | Date |
|-------------|------|----------|------|
| Business Owner | Final approval | Pending | - |
| Store Manager | Operations approval | Pending | - |
| Technical Lead | Feasibility approval | Pending | - |

---

**Document Owner**: Product Team  
**Last Updated**: February 2026  
**Next Review**: Post-MVP Launch
