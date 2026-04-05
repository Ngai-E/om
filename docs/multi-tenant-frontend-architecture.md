# Multi-Tenant Frontend Architecture

## Why NOT Branch-Per-Tenant

Creating a git branch (e.g. `omega-store`, `printer-store`) per tenant is an **anti-pattern** for multi-tenant SaaS:

| Problem | Impact |
|---------|--------|
| Every bug fix must be merged into N branches | Exponential maintenance cost |
| Feature updates require N deployments | Slow rollouts |
| Branch drift — tenants diverge from main | Unmergeable after a few months |
| CI/CD complexity scales linearly with tenants | Infrastructure cost |
| Doesn't scale past ~5 tenants | Business blocker |

**This approach is only valid for white-label forks** where each tenant gets a fully custom codebase (rare, expensive, consulting model).

---

## Recommended: Single Codebase, Dynamic Tenant Resolution

Your architecture already follows the correct pattern. Here's how it works end-to-end:

### How Tenant Identity is Resolved

```
Request → Domain/Subdomain → Tenant Slug → Backend Lookup → Tenant Config
```

| Layer | Mechanism | Example |
|-------|-----------|---------|
| **Production** | Subdomain from hostname | `omega.stores.xxx` → slug = `omega` |
| **Custom domain** | DNS + domain lookup table | `www.myafrostore.com` → tenant_domains → slug |
| **Local dev** | `NEXT_PUBLIC_TENANT_SLUG` env var | `.env.local` → `omega-afro-shop` |
| **Logged-in admin** | Auth store `user.tenantSlug` | Overrides default for admin dashboard |

### What is Dynamic Per Tenant (DB-driven)

Everything that differs between tenants is stored in the **database**, not in code:

| Asset | Storage | How It's Served |
|-------|---------|-----------------|
| **Logo** | CDN URL in `tenant_branding.logoUrl` | `<img src={branding.logoUrl}>` |
| **Favicon** | CDN URL in `tenant_branding.faviconUrl` | Injected at runtime by TenantProvider |
| **Hero image** | CDN URL in `tenant_branding.heroConfig.imageUrl` | `style={{ backgroundImage }}` |
| **Hero text** | JSON in `tenant_branding.heroConfig` | `{heading, subheading, trustBadges}` |
| **Colors** | `tenant_branding.primaryColor/secondaryColor` | CSS custom properties on `:root` |
| **Fonts** | `tenant_branding.fontHeading/fontBody` | CSS custom properties |
| **Store name** | `tenant.name` | Header, footer, title |
| **Phone/email** | `settings` store (tenant-scoped) | Contact sections |
| **Products, categories, orders** | All scoped by `tenantId` | API returns only tenant's data |

### Where Tenant Assets Live

```
                    ┌──────────────────────┐
                    │   Object Storage /   │
                    │   CDN (S3, R2, etc.) │
                    │                      │
                    │  /tenants/           │
                    │    omega/            │
                    │      logo.png        │
                    │      hero-bg.jpg     │
                    │      favicon.ico     │
                    │    printer-store/    │
                    │      logo.png        │
                    │      hero-bg.jpg     │
                    │      favicon.ico     │
                    └──────────────────────┘
                              │
                    URLs stored in DB:
                    tenant_branding.logoUrl = "https://cdn.stores.xxx/tenants/omega/logo.png"
```

**Tenants upload their assets** through the admin dashboard (Settings → Store Branding). The upload endpoint stores files in the CDN and saves the URL in `tenant_branding`.

### How Colors/Theme Work (Already Implemented)

```
TenantProvider.tsx
  → GET /storefront/store/{slug}
  → response includes branding { primaryColor, secondaryColor, ... }
  → applyBrandingCssVars() sets CSS custom properties on :root
  → All Tailwind classes like bg-omega-green-dark use var(--primary)
```

This means **every tenant gets unique colors without any code changes**.

---

## What Needs to Be Built to Complete This

### 1. Asset Upload in Admin Settings (High Priority)

Add a "Store Branding" section to `/admin/settings` where tenant admins can:
- Upload logo → stored in CDN → saved as `tenant_branding.logoUrl`
- Upload favicon → stored in CDN → saved as `tenant_branding.faviconUrl`  
- Upload hero image → stored in CDN → saved as `tenant_branding.heroConfig.imageUrl`
- Edit hero heading/subheading → saved as `tenant_branding.heroConfig`
- Pick primary/secondary colors via color picker → saved as `tenant_branding.primaryColor/secondaryColor`

### 2. CDN/Object Storage for Tenant Assets

Options (cheapest first):
- **Cloudflare R2** — free egress, S3-compatible, $0.015/GB storage
- **AWS S3 + CloudFront** — industry standard
- **imgbb/Cloudinary** — already partially integrated for product images

Upload flow:
```
Admin uploads logo → POST /api/upload → stores in CDN → returns URL → saved to tenant_branding.logoUrl
```

### 3. Default Assets for New Tenants

During onboarding, set sensible defaults:
- `heroConfig.heading` = store name from signup form
- `heroConfig.subheading` = "Quality products. Great prices. Fast delivery."
- `primaryColor` / `secondaryColor` = defaults (already done: #036637 / #FF7730)
- `logoUrl` = null (shows text fallback)
- `heroConfig.imageUrl` = null (shows generic gradient)

---

## Summary: Single Deployment, Infinite Tenants

```
┌─────────────────────────────────────────────┐
│           SINGLE NEXT.JS APP                │
│                                             │
│  omega.stores.xxx ──→ slug = omega          │
│  printer.stores.xxx ──→ slug = printer      │
│  custom.domain.com ──→ lookup → slug = xyz  │
│                                             │
│  Same code. Same deployment. Same CI/CD.    │
│  Tenant identity comes from the DOMAIN.     │
│  All visual differences come from the DB.   │
│  All assets come from the CDN.              │
└─────────────────────────────────────────────┘
```

**No branches. No folders per tenant. No env files per tenant. No redeployment when a new tenant signs up.**
