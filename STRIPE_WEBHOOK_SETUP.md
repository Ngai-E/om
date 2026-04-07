# 🔔 Stripe Webhook Setup for Auto Payment Updates

## 📋 Quick Reference: Required Webhook Events

**Add these 5 events to your Stripe webhook endpoint:**

```
✅ checkout.session.completed    (CRITICAL - Stripe Checkout payments)
✅ payment_intent.succeeded       (CRITICAL - Stripe Elements payments)
✅ payment_intent.payment_failed  (Important - Failed payments)
✅ charge.succeeded               (Important - Charge confirmations)
✅ charge.refunded                (Important - Refund processing)
```

**Webhook Endpoint URL:**
- **Development:** `http://localhost:4000/v1/payments/webhook` (via Stripe CLI)
- **Production:** `https://your-domain.com/v1/payments/webhook` (via Stripe Dashboard)

---

## Why Webhooks?

Webhooks automatically update payment status when:
- Customer completes payment
- Payment fails
- Refund is processed

**Without webhooks:** You need to manually verify payment status
**With webhooks:** Everything updates automatically ✨

---

## Development Setup (Stripe CLI)

### 1. Install Stripe CLI

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Or download from: https://stripe.com/docs/stripe-cli
```

### 2. Login to Stripe

```bash
stripe login
```

This will open your browser to authenticate.

### 3. Forward Webhooks to Local Server

```bash
stripe listen --forward-to localhost:4000/v1/payments/webhook
```

**You'll see:**
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
> Listening for events matching endpoint localhost:4000/v1/payments/webhook
```

### 4. Update Backend .env

Copy the webhook signing secret and add to `.env`:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### 5. Restart Backend

```bash
cd backend
npm run start:dev
```

### 6. Test Payment

1. Create an order with card payment
2. Complete payment on Stripe Checkout
3. **Payment status automatically updates!** ✅
4. Order status changes to "PICKING"

---

## What You'll See

### In Stripe CLI Terminal:
```
2024-02-22 10:45:00   --> checkout.session.completed [evt_xxx]
2024-02-22 10:45:01   <-- [200] POST http://localhost:4000/v1/payments/webhook
✅ Checkout session completed for order: order-id-here
```

### In Backend Console:
```
[Nest] 12345  - 02/22/2024, 10:45:01 AM     LOG Webhook received: checkout.session.completed
✅ Checkout session completed for order: order-id-here
```

### In Admin Panel:
- Payment status: PENDING → SUCCEEDED (automatically!)
- Order status: RECEIVED → PICKING (automatically!)

---

## Production Setup

### 1. Deploy Your Backend

Get your production URL (e.g., `https://api.yourdomain.com`)

### 2. Add Webhook in Stripe Dashboard

#### **Step-by-Step Guide:**

**Step 1:** Go to Stripe Dashboard
- **Test Mode:** https://dashboard.stripe.com/test/webhooks
- **Live Mode:** https://dashboard.stripe.com/webhooks

**Step 2:** Click **"Add endpoint"** button (top right)

**Step 3:** Enter Endpoint URL
```
https://api.yourdomain.com/v1/payments/webhook
```
Or for ngrok testing:
```
https://your-ngrok-url.ngrok.io/v1/payments/webhook
```

**Step 4:** Click **"Select events"** button

**Step 5:** Search and select these 5 events:

1. Type `checkout.session` → Select **`checkout.session.completed`** ✅
2. Type `payment_intent.succeeded` → Select **`payment_intent.succeeded`** ✅
3. Type `payment_intent.payment_failed` → Select **`payment_intent.payment_failed`** ✅
4. Type `charge.succeeded` → Select **`charge.succeeded`** ✅
5. Type `charge.refunded` → Select **`charge.refunded`** ✅

**Step 6:** Click **"Add events"** at the bottom

**Step 7:** Click **"Add endpoint"** to save

**Step 8:** Copy the **Signing Secret**
- Click on the webhook you just created
- Click **"Reveal"** next to "Signing secret"
- Copy the secret (starts with `whsec_`)

**Visual Checklist:**
```
Endpoint URL: https://api.yourdomain.com/v1/payments/webhook
Description: OMEGA AFRO SHOP Payment Webhooks (optional)

Events to send (5 selected):
  ✅ checkout.session.completed
  ✅ payment_intent.succeeded
  ✅ payment_intent.payment_failed
  ✅ charge.succeeded
  ✅ charge.refunded
```

### 3. Copy Webhook Secret

Copy the signing secret (starts with `whsec_`)

### 4. Update Production Environment

Add to your production environment variables:
```env
STRIPE_WEBHOOK_SECRET=whsec_production_secret_here
```

### 5. Test

Make a test payment - status should update automatically!

---

## Webhook Events Handled

| Event | What Happens | Priority |
|-------|-------------|----------|
| `checkout.session.completed` | Payment succeeded via Stripe Checkout → Order status: PICKING | **CRITICAL** ⚠️ |
| `payment_intent.succeeded` | Payment succeeded via Payment Element → Order status: PICKING | **CRITICAL** ⚠️ |
| `payment_intent.payment_failed` | Payment failed → Payment status: FAILED | Important |
| `charge.succeeded` | Charge confirmation (backup/additional processing) | Important |
| `charge.refunded` | Refund processed → Payment status: REFUNDED, Order status: REFUNDED | Important |

### Event Details:

#### 🔴 **CRITICAL EVENTS (Must Configure)**

**1. `checkout.session.completed`**
- **When:** Customer completes payment on Stripe Checkout page
- **What it does:**
  - Updates payment status: PENDING → SUCCEEDED
  - Updates order status: RECEIVED → PICKING
  - Stores payment intent ID
  - Records payment timestamp
- **Without this:** Stripe Checkout payments won't be processed automatically!

**2. `payment_intent.succeeded`**
- **When:** Customer completes payment using Stripe Elements (embedded form)
- **What it does:**
  - Updates payment status: PENDING → SUCCEEDED
  - Updates order status: RECEIVED → PICKING
  - Records payment timestamp
- **Without this:** Stripe Elements payments won't be processed automatically!

#### 🟡 **IMPORTANT EVENTS (Recommended)**

**3. `payment_intent.payment_failed`**
- **When:** Payment attempt fails (declined card, insufficient funds, etc.)
- **What it does:**
  - Updates payment status to FAILED
  - Order remains in RECEIVED status
  - Customer can retry payment

**4. `charge.succeeded`**
- **When:** Charge is successfully captured (sent after payment_intent.succeeded)
- **What it does:**
  - Backup confirmation for payments
  - Updates payment if not already succeeded
  - Provides additional charge details
- **Note:** Usually redundant with checkout.session.completed or payment_intent.succeeded

**5. `charge.refunded`**
- **When:** Admin processes a refund
- **What it does:**
  - Updates payment status to REFUNDED
  - Updates order status to REFUNDED
  - Records refund amount and timestamp
  - Adds status history entry

---

## Troubleshooting

### Webhooks Not Working?

**Check 1: Is Stripe CLI running?**
```bash
# Should see: "Listening for events..."
stripe listen --forward-to localhost:4000/v1/payments/webhook
```

**Check 2: Is webhook secret set?**
```bash
# In backend/.env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

**Check 3: Is backend running?**
```bash
# Should see: "Server running on: http://localhost:4000"
cd backend
npm run start:dev
```

**Check 4: Check backend logs**
Look for:
```
LOG Webhook received: checkout.session.completed
✅ Checkout session completed for order: xxx
```

### Stripe Checkout Not Working?

**Symptom:** Payment completes but order status doesn't update

**Cause:** `checkout.session.completed` event not configured

**Fix:**
1. Go to Stripe Dashboard → Webhooks
2. Click on your webhook endpoint
3. Check if `checkout.session.completed` is in the events list
4. If missing, click "Add events" and add it
5. Test again

**Verify in logs:**
```bash
# You should see this after payment:
✅ Webhook signature verified: checkout.session.completed
📥 Processing webhook: checkout.session.completed
🔍 Looking for payment with session ID: cs_xxx
✅ Checkout session completed for order: xxx
```

**If you only see:**
```bash
✅ Webhook signature verified: charge.succeeded
ℹ️  Charge succeeded - will be processed by checkout.session.completed webhook
```
Then `checkout.session.completed` is NOT configured! Add it to your webhook.

### Still Not Working?

1. **Restart Stripe CLI**
2. **Restart Backend**
3. **Check webhook endpoint:** `http://localhost:4000/v1/payments/webhook`
4. **Test with Stripe CLI:**
   ```bash
   stripe trigger checkout.session.completed
   ```
5. **Check Stripe Dashboard:**
   - Go to Webhooks → Your endpoint
   - Check "Recent deliveries" tab
   - Look for failed deliveries (red X)
   - Click to see error details

---

## Benefits

### With Webhooks:
✅ Payment status updates automatically
✅ Order status updates automatically  
✅ Real-time updates
✅ No manual verification needed
✅ Production-ready

### Without Webhooks:
❌ Manual verification required
❌ Status doesn't update automatically
❌ Admin must click "Verify Payment Status"
❌ Not ideal for production

---

## Summary

**Development:**
```bash
# Terminal 1: Backend
cd backend && npm run start:dev

# Terminal 2: Stripe CLI
stripe listen --forward-to localhost:4000/v1/payments/webhook

# Terminal 3: Frontend
cd frontend && npm run dev
```

**Production:**
- Add webhook endpoint in Stripe Dashboard
- Set STRIPE_WEBHOOK_SECRET in production env
- Everything works automatically!

---

## � Final Checklist

Before going live, verify:

### Stripe Dashboard Configuration:
- [ ] Webhook endpoint added
- [ ] All 5 events selected:
  - [ ] `checkout.session.completed`
  - [ ] `payment_intent.succeeded`
  - [ ] `payment_intent.payment_failed`
  - [ ] `charge.succeeded`
  - [ ] `charge.refunded`
- [ ] Webhook signing secret copied
- [ ] Endpoint URL is correct

### Backend Configuration:
- [ ] `STRIPE_WEBHOOK_SECRET` set in environment
- [ ] `NODE_ENV=production` for production
- [ ] Backend deployed and accessible
- [ ] Webhook endpoint responds (not 404)

### Testing:
- [ ] Test Stripe Checkout payment → Order updates to PICKING
- [ ] Test Stripe Elements payment → Order updates to PICKING
- [ ] Check Stripe Dashboard → Webhooks → Recent deliveries (all green ✅)
- [ ] Check backend logs for webhook confirmations

### Common Issues:
- ❌ **Stripe Checkout doesn't work** → Add `checkout.session.completed` event
- ❌ **Stripe Elements doesn't work** → Add `payment_intent.succeeded` event
- ❌ **Signature verification fails** → Check `STRIPE_WEBHOOK_SECRET` matches
- ❌ **404 errors** → Check endpoint URL is correct
- ❌ **No webhooks received** → Check backend is accessible from internet

---

�🎉 **Now payments update automatically without manual verification!**

**Need help?** Check the troubleshooting section above or review the backend logs for detailed error messages.
