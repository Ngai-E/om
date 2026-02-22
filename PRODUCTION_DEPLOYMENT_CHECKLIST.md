# 🚀 Production Deployment Checklist

## ✅ Pre-Deployment Checklist

### **1. Environment Variables**

#### Backend (.env)
```env
# Database
DATABASE_URL=your_production_database_url

# Stripe (LIVE MODE)
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Environment
NODE_ENV=production

# Frontend URL
FRONTEND_URL=https://yourdomain.com

# JWT
JWT_SECRET=your_secure_random_string_min_32_chars

# Email (if configured)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

#### Frontend (.env.production)
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
```

---

### **2. Stripe Configuration**

#### **Switch to Live Mode**
1. Go to Stripe Dashboard
2. Toggle from "Test mode" to "Live mode" (top right)

#### **Get Live API Keys**
1. Go to: https://dashboard.stripe.com/apikeys
2. Copy "Publishable key" → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
3. Reveal "Secret key" → `STRIPE_SECRET_KEY`

#### **Configure Production Webhook**
1. Go to: https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://api.yourdomain.com/v1/payments/webhook`
4. Select events:
   - ✅ `checkout.session.completed`
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
   - ✅ `charge.succeeded`
   - ✅ `charge.refunded`
5. Click "Add endpoint"
6. Copy "Signing secret" → `STRIPE_WEBHOOK_SECRET`

---

### **3. Database**

#### **Production Database Setup**
- [ ] Create production PostgreSQL database
- [ ] Run migrations: `npx prisma migrate deploy`
- [ ] Seed initial data if needed
- [ ] Set up automated backups
- [ ] Configure connection pooling

#### **Verify Database**
```bash
# Test connection
npx prisma db pull

# Check schema
npx prisma studio
```

---

### **4. Code Review**

#### **Security**
- [ ] No hardcoded secrets or API keys
- [ ] All sensitive data in environment variables
- [ ] CORS configured for production domains only
- [ ] Helmet security headers enabled
- [ ] Rate limiting configured (if applicable)
- [ ] SQL injection protection (Prisma handles this)
- [ ] XSS protection enabled

#### **Remove Development Code**
- [ ] No console.logs with sensitive data
- [ ] Test credentials hidden (already done ✅)
- [ ] Debug endpoints removed or protected
- [ ] Development-only features disabled

#### **Performance**
- [ ] Database indexes on frequently queried fields
- [ ] Image optimization enabled
- [ ] Compression middleware enabled (already done ✅)
- [ ] Caching strategy implemented (if needed)

---

### **5. Testing**

#### **Backend Tests**
```bash
cd backend
npm test
```

#### **Frontend Tests**
```bash
cd frontend
npm run build
npm start
```

#### **End-to-End Testing**
- [ ] User registration
- [ ] User login
- [ ] Browse products
- [ ] Add to cart
- [ ] Checkout with Stripe Checkout
- [ ] Payment success flow
- [ ] Payment failure flow
- [ ] Order confirmation
- [ ] Admin login
- [ ] Admin order management
- [ ] Staff phone orders
- [ ] Webhook delivery

---

## 🌐 Deployment Steps

### **Option 1: Deploy to Render**

#### **Backend Deployment**

1. **Create New Web Service**
   - Go to: https://render.com
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select backend folder

2. **Configure Service**
   ```
   Name: omega-afro-shop-api
   Environment: Node
   Build Command: npm install && npx prisma generate && npm run build
   Start Command: npm run start:prod
   ```

3. **Add Environment Variables**
   - Add all variables from backend `.env`
   - Set `NODE_ENV=production`

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment
   - Note your API URL: `https://omega-afro-shop-api.onrender.com`

#### **Frontend Deployment**

1. **Deploy to Vercel**
   ```bash
   cd frontend
   npm install -g vercel
   vercel --prod
   ```

2. **Configure Environment Variables**
   - Add `NEXT_PUBLIC_API_URL`
   - Add `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

3. **Custom Domain** (Optional)
   - Add your domain in Vercel settings
   - Update DNS records

---

### **Option 2: Deploy to Railway**

#### **Backend**
```bash
cd backend
railway login
railway init
railway up
```

#### **Frontend**
```bash
cd frontend
vercel --prod
```

---

### **Option 3: Deploy to AWS/DigitalOcean**

1. Set up server (Ubuntu 22.04)
2. Install Node.js, PostgreSQL, Nginx
3. Clone repository
4. Set up PM2 for process management
5. Configure Nginx as reverse proxy
6. Set up SSL with Let's Encrypt
7. Configure firewall

---

## 🔧 Post-Deployment

### **1. Verify Deployment**

#### **Backend Health Check**
```bash
curl https://api.yourdomain.com/health
```

Should return: `{"status":"ok"}`

#### **API Documentation**
Visit: `https://api.yourdomain.com/api/docs`

#### **Test Webhook**
1. Go to Stripe Dashboard → Webhooks
2. Click on your endpoint
3. Click "Send test webhook"
4. Select `checkout.session.completed`
5. Check backend logs for: `✅ Webhook signature verified`

---

### **2. Configure DNS**

#### **Backend (API)**
```
Type: A or CNAME
Name: api
Value: Your server IP or hosting URL
TTL: 3600
```

#### **Frontend**
```
Type: A or CNAME
Name: @ (root) or www
Value: Vercel IP or CNAME
TTL: 3600
```

---

### **3. SSL Certificates**

- [ ] SSL enabled for backend
- [ ] SSL enabled for frontend
- [ ] HTTPS redirect configured
- [ ] Mixed content warnings resolved

---

### **4. Monitoring**

#### **Set Up Monitoring**
- [ ] Sentry for error tracking
- [ ] LogRocket for session replay
- [ ] Stripe Dashboard for payment monitoring
- [ ] Server monitoring (CPU, memory, disk)
- [ ] Database monitoring

#### **Alerts**
- [ ] Failed payment alerts
- [ ] Server downtime alerts
- [ ] Database connection alerts
- [ ] Webhook failure alerts

---

### **5. Backup Strategy**

- [ ] Automated daily database backups
- [ ] Backup retention policy (30 days)
- [ ] Test backup restoration
- [ ] Document recovery procedures

---

## 🧪 Production Testing

### **1. Payment Flow**

#### **Test Successful Payment**
1. Place order with test card in live mode: `4242 4242 4242 4242`
2. Verify webhook received: `✅ Webhook signature verified`
3. Check payment status: SUCCEEDED
4. Check order status: PICKING
5. Verify email confirmation (if configured)

#### **Test Failed Payment**
1. Use declined card: `4000 0000 0000 0002`
2. Verify payment status: FAILED
3. Verify order status remains RECEIVED

---

### **2. Webhook Verification**

```bash
# Check webhook endpoint
curl -X POST https://api.yourdomain.com/v1/payments/webhook \
  -H "Content-Type: application/json" \
  -H "stripe-signature: test" \
  -d '{"type":"test"}'
```

Should return 200 or signature error (which is expected)

---

### **3. Load Testing** (Optional)

```bash
# Install k6
brew install k6

# Run load test
k6 run load-test.js
```

---

## 📊 Go-Live Checklist

### **Final Checks**

- [ ] All environment variables set correctly
- [ ] Database migrations applied
- [ ] Stripe webhook configured and tested
- [ ] SSL certificates active
- [ ] DNS records propagated
- [ ] Monitoring and alerts configured
- [ ] Backup strategy in place
- [ ] Error tracking enabled
- [ ] Payment flow tested end-to-end
- [ ] Admin panel accessible
- [ ] Staff features working
- [ ] Email notifications working (if configured)
- [ ] Mobile responsive design verified
- [ ] Browser compatibility tested
- [ ] Performance optimized
- [ ] SEO meta tags configured

---

## 🎉 You're Live!

### **Post-Launch**

1. **Monitor First 24 Hours**
   - Watch for errors in Sentry
   - Check webhook delivery in Stripe
   - Monitor server resources
   - Review user feedback

2. **Marketing**
   - Announce launch
   - Share on social media
   - Email existing customers

3. **Support**
   - Monitor customer support channels
   - Respond to issues quickly
   - Document common problems

---

## 🆘 Rollback Plan

If something goes wrong:

1. **Revert to Previous Version**
   ```bash
   git revert HEAD
   git push
   ```

2. **Restore Database Backup** (if needed)
   ```bash
   pg_restore -d production_db backup.dump
   ```

3. **Update DNS** (if needed)
   - Point back to old server
   - Wait for propagation (5-30 min)

---

## 📞 Support Contacts

- **Stripe Support**: https://support.stripe.com
- **Hosting Support**: Check your provider's docs
- **Database Support**: Check your provider's docs

---

## 🔐 Security Best Practices

1. **Never commit `.env` files**
2. **Rotate secrets regularly**
3. **Use strong passwords**
4. **Enable 2FA on all services**
5. **Keep dependencies updated**
6. **Monitor security advisories**
7. **Regular security audits**

---

## ✅ Current Implementation Status

### **Production-Ready Features**

✅ **Webhook Signature Verification**
- Raw body parsing configured
- Signature verification enabled
- Fallback for development

✅ **Payment Processing**
- Stripe Checkout integration
- Payment Element integration
- Multiple payment methods (Card, COD, Pay in Store)

✅ **Security**
- Helmet security headers
- CORS configuration
- Environment-based configuration
- No exposed credentials

✅ **Error Handling**
- Comprehensive error logging
- Webhook error handling
- Payment failure handling

✅ **Admin Features**
- Order management
- Payment verification
- User management
- Settings configuration

---

**You're ready to go live! 🚀**

Good luck with your launch! 🎉
