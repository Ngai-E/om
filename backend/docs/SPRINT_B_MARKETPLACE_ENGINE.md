# Sprint B: Marketplace Engine - Complete Implementation Guide

## Overview

Sprint B transforms the platform from a multi-tenant SaaS into a **demand-driven marketplace** where buyers post requests and providers (including tenant stores) respond with offers.

## Architecture

### Core Concept
**Request → Match → Offer → Accept**

1. **Buyer** posts a marketplace request
2. **System** automatically matches eligible providers
3. **Providers** submit offers
4. **Buyer** accepts one offer
5. **Request** closes with accepted offer

---

## Database Schema

### 8 New Models

#### 1. Provider
Represents marketplace participants (stores or independent service providers).

```prisma
model Provider {
  id            String         @id @default(cuid())
  providerType  ProviderType   // TENANT_STORE, INDEPENDENT_SERVICE, HYBRID
  status        ProviderStatus @default(PENDING_REVIEW)
  tenantId      String?
  displayName   String
  slug          String?        @unique
  description   String?
  phone         String?
  email         String?
  isVerified    Boolean        @default(false)
  averageRating Decimal?       @db.Decimal(3, 2)
  totalReviews  Int            @default(0)
}
```

**Key Features:**
- Tenant-backed providers (stores become providers)
- Independent service providers
- Verification system
- Rating tracking

#### 2. ProviderCategory
Links providers to service categories.

```prisma
model ProviderCategory {
  id          String   @id @default(cuid())
  providerId  String
  categoryKey String   // e.g., "products.rice", "services.hair"
}
```

#### 3. ProviderServiceArea
Defines geographic service coverage.

```prisma
model ProviderServiceArea {
  id          String   @id @default(cuid())
  providerId  String
  countryCode String?
  city        String?
  region      String?
  radiusKm    Int?
}
```

#### 4. MarketplaceRequest
Buyer demand posts.

```prisma
model MarketplaceRequest {
  id              String                    @id @default(cuid())
  requestType     MarketplaceRequestType    // PRODUCT, SERVICE
  status          MarketplaceRequestStatus  @default(OPEN)
  buyerUserId     String?
  title           String
  description     String
  categoryKey     String
  budgetMin       Decimal?
  budgetMax       Decimal?
  currencyCode    String?
  urgency         String?
  countryCode     String?
  city            String?
  region          String?
  latitude        Decimal?
  longitude       Decimal?
  radiusKm        Int?
  matchedCount    Int                       @default(0)
  offerCount      Int                       @default(0)
  acceptedOfferId String?
}
```

**Status Flow:**
- `OPEN` → `MATCHING` → `RECEIVING_OFFERS` → `ACCEPTED` → `CLOSED`

#### 5. MarketplaceRequestImage
Request attachments (max 5 per request).

#### 6. MarketplaceMatch
System-generated provider matches with scoring.

```prisma
model MarketplaceMatch {
  id            String                 @id @default(cuid())
  requestId     String
  providerId    String
  score         Decimal?               @db.Decimal(5, 2)
  status        MarketplaceMatchStatus @default(MATCHED)
  reasonSummary String?
}
```

#### 7. MarketplaceOffer
Provider responses to requests.

```prisma
model MarketplaceOffer {
  id            String                 @id @default(cuid())
  requestId     String
  providerId    String
  status        MarketplaceOfferStatus @default(SUBMITTED)
  price         Decimal?
  currencyCode  String?
  estimatedEta  String?
  message       String
  attachmentUrl String?
}
```

#### 8. MarketplaceModerationFlag
Content moderation system.

```prisma
model MarketplaceModerationFlag {
  id         String               @id @default(cuid())
  targetType ModerationTargetType // REQUEST, OFFER, PROVIDER
  targetId   String
  reason     String
  status     String               @default("OPEN")
}
```

---

## Services

### 1. MarketplaceProviderService
**Responsibilities:**
- Provider profile CRUD
- Category management
- Service area management
- Verification and status control

**Key Methods:**
- `createProvider(dto)` - Create provider profile
- `updateProvider(id, dto)` - Update profile
- `getProviderByTenantId(tenantId)` - Get tenant's provider
- `verifyProvider(id)` - Mark as verified
- `updateProviderStatus(id, status)` - Admin control
- `listProviders(filters)` - List with filters

### 2. MarketplaceRequestService
**Responsibilities:**
- Request lifecycle management
- Image uploads
- Request statistics

**Key Methods:**
- `createRequest(buyerId, dto)` - Create request
- `addRequestImage(requestId, dto)` - Upload image
- `listMyRequests(buyerId, filters)` - Buyer's requests
- `cancelRequest(requestId, buyerId)` - Cancel request
- `setAcceptedOffer(requestId, offerId)` - Accept offer
- `incrementOfferCount(requestId)` - Track offers

### 3. MarketplaceMatchingService
**Responsibilities:**
- Automatic provider matching
- Scoring algorithm
- Match management

**Scoring Formula (v1 - Rule-Based):**
```
Category match:        40 points (required)
City match:           25 points
Country/region match: 10 points
Verified provider:    10 points
Tenant-backed:         5 points
High rating:      up to 10 points
─────────────────────────────────
Maximum:             100 points
```

**Key Methods:**
- `matchRequest(requestId)` - Find and create matches
- `getProviderMatches(providerId, filters)` - Provider's matches
- `markMatchViewed(matchId)` - Track engagement
- `skipMatch(matchId)` - Provider skips

### 4. MarketplaceOfferService
**Responsibilities:**
- Offer submission
- Offer management
- Acceptance orchestration

**Key Methods:**
- `submitOffer(requestId, providerId, dto)` - Submit offer
- `withdrawOffer(offerId, providerId)` - Withdraw offer
- `listProviderOffers(providerId, filters)` - Provider's offers
- `listRequestOffers(requestId)` - Offers for request
- `acceptOffer(offerId)` - Accept (internal)
- `rejectOtherOffers(requestId, acceptedId)` - Reject others

### 5. MarketplaceModerationService
**Responsibilities:**
- Moderation flags
- Marketplace statistics
- Tenant activity tracking

**Key Methods:**
- `createFlag(targetType, targetId, reason)` - Flag content
- `listFlags(filters)` - List flags
- `updateFlagStatus(flagId, status)` - Resolve flag
- `getMarketplaceStats()` - Platform statistics
- `getTenantMarketplaceActivity(tenantId)` - Tenant metrics

---

## API Endpoints

### Provider Endpoints (10)

#### Public/Provider
```
POST   /marketplace/providers              Create provider
GET    /marketplace/providers/me           Get my provider
PATCH  /marketplace/providers/me           Update my provider
GET    /marketplace/providers/:id          Get provider by ID
GET    /marketplace/providers/slug/:slug   Get provider by slug
GET    /marketplace/providers/:id/stats    Provider statistics
GET    /marketplace/providers              List providers
```

#### Admin Only
```
PATCH  /marketplace/providers/:id/status   Update status
POST   /marketplace/providers/:id/verify   Verify provider
```

### Request Endpoints (8)

#### Buyer
```
POST   /marketplace/requests                     Create request
POST   /marketplace/requests/:id/images          Add image
GET    /marketplace/my/requests                  List my requests
PATCH  /marketplace/requests/:id/cancel          Cancel request
PATCH  /marketplace/requests/:id/offers/:offerId/accept  Accept offer
```

#### Public
```
GET    /marketplace/requests/:id                 Get request
GET    /marketplace/requests/:id/stats           Request stats
GET    /marketplace/requests                     List requests
```

### Offer Endpoints (5)

#### Provider
```
POST   /marketplace/requests/:id/offers          Submit offer
PATCH  /marketplace/offers/:id/withdraw          Withdraw offer
GET    /marketplace/providers/me/offers          List my offers
```

#### Public
```
GET    /marketplace/offers/:id                   Get offer
GET    /marketplace/requests/:id/offers          List request offers
```

### Admin Endpoints (8)

#### Platform Admin Only
```
GET    /platform/marketplace/stats                      Marketplace stats
GET    /platform/marketplace/tenants/:id/activity       Tenant activity
POST   /platform/marketplace/flags                      Create flag
GET    /platform/marketplace/flags                      List flags
PATCH  /platform/marketplace/flags/:id/status           Update flag
PATCH  /platform/marketplace/providers/:id/status       Update provider
POST   /platform/marketplace/providers/:id/verify       Verify provider
GET    /platform/marketplace/providers                  List providers
```

---

## Request Lifecycle

### Step 1: Buyer Posts Request
```typescript
POST /marketplace/requests
{
  "requestType": "PRODUCT",
  "title": "Need 50 bags of rice",
  "description": "Looking for wholesale supply in Douala",
  "categoryKey": "products.rice",
  "budgetMin": 50000,
  "budgetMax": 200000,
  "currencyCode": "XAF",
  "countryCode": "CM",
  "city": "Douala",
  "radiusKm": 25
}
```

**System Actions:**
- Create request with status `OPEN`
- Trigger matching job
- Update status to `MATCHING`

### Step 2: System Matches Providers
**Matching Logic:**
1. Find all `ACTIVE` providers
2. Filter by category match (required)
3. Score by location, verification, rating
4. Create top 20 matches
5. Update request status to `RECEIVING_OFFERS`

**Match Record:**
```json
{
  "requestId": "req_123",
  "providerId": "prov_456",
  "score": 75,
  "reasonSummary": "Category match + City match + Verified provider",
  "status": "MATCHED"
}
```

### Step 3: Providers Submit Offers
```typescript
POST /marketplace/requests/:id/offers
{
  "price": 75000,
  "currencyCode": "XAF",
  "estimatedEta": "2 days",
  "message": "We can deliver 50 bags by Tuesday."
}
```

**Validations:**
- Request must be `RECEIVING_OFFERS`
- No duplicate active offers
- Provider must be matched (optional enforcement)

### Step 4: Buyer Accepts Offer
```typescript
PATCH /marketplace/requests/:id/offers/:offerId/accept
```

**Orchestration:**
1. Verify request ownership
2. Verify offer belongs to request
3. Accept selected offer → status `ACCEPTED`
4. Reject all other offers → status `REJECTED`
5. Update request → status `ACCEPTED`, set `acceptedOfferId`

### Step 5: Request Closes
Request status: `ACCEPTED`
Accepted offer: `ACCEPTED`
Other offers: `REJECTED`

---

## Matching Algorithm v1

### Candidate Selection
A provider qualifies if:
- ✅ Provider status is `ACTIVE`
- ✅ Category matches request category
- ✅ Service area overlaps request location (if specified)
- ✅ Tenant is `ACTIVE` (for tenant-backed providers)

### Scoring
```typescript
let score = 0;

// Category match (REQUIRED - 40 points)
if (categoryMatch) score += 40;
else return 0; // Not eligible

// Location scoring
if (cityMatch) score += 25;
else if (countryMatch) score += 10;
else if (regionMatch) score += 10;

// Trust signals
if (isVerified) score += 10;
if (tenantBacked && tenantActive) score += 5;

// Rating bonus
if (averageRating) {
  score += (averageRating / 5) * 10; // Up to 10 points
}

return score;
```

### Future: AI Matching
The current rule-based system is designed to be replaced with:
- Semantic category matching
- Location intelligence
- Historical success patterns
- Provider specialization learning
- Buyer preference modeling

---

## Tenant Integration

### Tenant as Provider
When a tenant wants to participate in the marketplace:

1. **Create Provider Profile**
```typescript
POST /marketplace/providers
{
  "providerType": "TENANT_STORE",
  "tenantId": "tenant_omega",
  "displayName": "OMEGA Afro Caribbean Superstore",
  "description": "Premium African & Caribbean groceries",
  "categoryKeys": ["products.rice", "products.groceries"],
  "serviceAreas": [
    {
      "countryCode": "CM",
      "city": "Douala",
      "radiusKm": 50
    }
  ]
}
```

2. **Automatic Matching**
- System matches tenant's provider to relevant requests
- Tenant receives match notifications
- Tenant can submit offers

3. **Unfair Advantage**
- Existing customer base
- Established inventory
- Delivery infrastructure
- Brand recognition

---

## Moderation & Safety

### Content Flags
```typescript
POST /platform/marketplace/flags
{
  "targetType": "REQUEST",
  "targetId": "req_123",
  "reason": "Suspicious pricing / potential scam"
}
```

**Flag Workflow:**
1. Flag created with status `OPEN`
2. Admin reviews
3. Admin updates status: `RESOLVED`, `DISMISSED`, `ESCALATED`
4. Action taken on target (suspend, remove, etc.)

### Provider Suspension
```typescript
PATCH /platform/marketplace/providers/:id/status
{
  "status": "SUSPENDED"
}
```

**Effects:**
- Provider excluded from new matches
- Existing offers remain visible
- Can be reactivated by admin

---

## Statistics & Monitoring

### Platform Dashboard
```typescript
GET /platform/marketplace/stats

Response:
{
  "requests": {
    "total": 1250,
    "open": 45,
    "byStatus": {
      "OPEN": 45,
      "RECEIVING_OFFERS": 120,
      "ACCEPTED": 890,
      "CLOSED": 150,
      "CANCELED": 45
    }
  },
  "providers": {
    "total": 340,
    "active": 285,
    "byType": {
      "TENANT_STORE": 180,
      "INDEPENDENT_SERVICE": 140,
      "HYBRID": 20
    }
  },
  "offers": {
    "total": 5600,
    "accepted": 890
  },
  "matches": {
    "total": 8900
  },
  "moderation": {
    "openFlags": 12
  }
}
```

### Tenant Activity
```typescript
GET /platform/marketplace/tenants/:tenantId/activity

Response:
{
  "hasProvider": true,
  "providerId": "prov_456",
  "providerStatus": "ACTIVE",
  "offers": 45,
  "acceptedOffers": 12,
  "matches": 120
}
```

---

## Testing Guide

### 1. Create Provider
```bash
curl -X POST http://localhost:4000/v1/marketplace/providers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "providerType": "TENANT_STORE",
    "tenantId": "tenant_omega",
    "displayName": "OMEGA Store",
    "categoryKeys": ["products.rice"],
    "serviceAreas": [{"city": "Douala", "countryCode": "CM"}]
  }'
```

### 2. Post Request
```bash
curl -X POST http://localhost:4000/v1/marketplace/requests \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "requestType": "PRODUCT",
    "title": "Need rice",
    "description": "50 bags needed",
    "categoryKey": "products.rice",
    "city": "Douala",
    "countryCode": "CM"
  }'
```

### 3. Check Matches
```bash
curl http://localhost:4000/v1/marketplace/providers/me/matches \
  -H "Authorization: Bearer $PROVIDER_TOKEN"
```

### 4. Submit Offer
```bash
curl -X POST http://localhost:4000/v1/marketplace/requests/REQ_ID/offers \
  -H "Authorization: Bearer $PROVIDER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "price": 75000,
    "currencyCode": "XAF",
    "message": "Can deliver in 2 days"
  }'
```

### 5. Accept Offer
```bash
curl -X PATCH http://localhost:4000/v1/marketplace/requests/REQ_ID/offers/OFFER_ID/accept \
  -H "Authorization: Bearer $BUYER_TOKEN"
```

---

## Production Deployment

### Environment Variables
```env
# Already configured from Sprint A
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
```

### Migration
```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

### Verification
```bash
# Check tables exist
psql $DATABASE_URL -c "\dt marketplace*"

# Expected tables:
# - providers
# - provider_categories
# - provider_service_areas
# - marketplace_requests
# - marketplace_request_images
# - marketplace_matches
# - marketplace_offers
# - marketplace_moderation_flags
```

---

## Next Steps (Sprint C)

Sprint B provides the foundation. Future enhancements:

### Sprint C: AI & Intelligence
- Semantic category matching
- ML-based scoring
- Provider recommendation
- Demand forecasting

### Sprint D: Payments & Escrow
- Offer payment capture
- Escrow system
- Payout automation
- Dispute resolution

### Sprint E: Communication
- Request comments
- Provider-buyer chat
- Notification system
- Email/SMS alerts

### Sprint F: Advanced Features
- Subscription plans for providers
- Featured listings
- Promoted requests
- Analytics dashboard

---

## API Summary

**Total Endpoints: 31**
- Provider: 10
- Request: 8
- Offer: 5
- Admin: 8

**Total Services: 5**
- MarketplaceProviderService
- MarketplaceRequestService
- MarketplaceMatchingService
- MarketplaceOfferService
- MarketplaceModerationService

**Total Models: 8**
- Provider (+ Category, ServiceArea)
- MarketplaceRequest (+ Image)
- MarketplaceMatch
- MarketplaceOffer
- MarketplaceModerationFlag

---

## Success Criteria ✅

Sprint B is complete when:

✅ Buyer can post request with category, description, budget, location  
✅ System generates matches for eligible providers  
✅ Provider can view relevant matches  
✅ Provider can submit offer  
✅ Buyer can list offers on their request  
✅ Buyer can accept one offer  
✅ Request and offer statuses update correctly  
✅ Tenant-backed providers work  
✅ Platform admin can inspect marketplace activity and flags  

**Status: ALL CRITERIA MET** 🎉

---

## Conclusion

Sprint B successfully transforms the platform into a **demand-driven marketplace**. The foundation is production-ready with:

- ✅ Complete request → match → offer → accept flow
- ✅ Rule-based matching (AI-ready architecture)
- ✅ Tenant stores as first-class providers
- ✅ Platform moderation and oversight
- ✅ Comprehensive statistics and monitoring

The marketplace engine is now ready for real-world usage and future AI enhancements.
