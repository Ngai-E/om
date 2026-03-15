// Quick script to activate all draft promotions
// Run with: node activate-all-promotions.js

const fetch = require('node-fetch');

const API_URL = 'http://localhost:4000/v1';
const ADMIN_EMAIL = 'admin@omegaafroshop.com';
const ADMIN_PASSWORD = 'Admin123!';

async function activateAllPromotions() {
  try {
    // 1. Login as admin
    console.log('🔐 Logging in as admin...');
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      }),
    });

    if (!loginResponse.ok) {
      throw new Error('Login failed');
    }

    const { access_token } = await loginResponse.json();
    console.log('✅ Logged in successfully\n');

    // 2. Get all promotions
    console.log('📋 Fetching all promotions...');
    const promotionsResponse = await fetch(`${API_URL}/promotions`, {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    });

    if (!promotionsResponse.ok) {
      throw new Error('Failed to fetch promotions');
    }

    const { data: promotions } = await promotionsResponse.json();
    console.log(`Found ${promotions.length} promotions\n`);

    // 3. Activate all DRAFT promotions
    const draftPromotions = promotions.filter(p => p.status === 'DRAFT');
    console.log(`🎯 Activating ${draftPromotions.length} draft promotions...\n`);

    for (const promo of draftPromotions) {
      try {
        const activateResponse = await fetch(`${API_URL}/promotions/${promo.id}/activate`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${access_token}`,
          },
        });

        if (activateResponse.ok) {
          console.log(`✅ Activated: ${promo.name} (${promo.code || 'auto'})`);
        } else {
          console.log(`❌ Failed: ${promo.name}`);
        }
      } catch (err) {
        console.log(`❌ Error activating ${promo.name}: ${err.message}`);
      }
    }

    console.log('\n🎉 Done! All promotions activated.');
    console.log('\n💡 Now refresh your checkout page to see available promo codes!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

activateAllPromotions();
