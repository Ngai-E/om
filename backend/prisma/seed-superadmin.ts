/**
 * Creates a SUPER_ADMIN user for the platform console.
 * 
 * Run:
 *   npx ts-node prisma/seed-superadmin.ts
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SUPER_ADMIN = {
  email: 'superadmin@omegaafroshop.com',
  password: 'SuperAdmin123!',
  firstName: 'Platform',
  lastName: 'Admin',
};

async function main() {
  console.log('🔐 Creating SUPER_ADMIN user...\n');

  const existing = await prisma.user.findUnique({
    where: { email: SUPER_ADMIN.email },
  });

  if (existing) {
    // Update role to SUPER_ADMIN if user exists but isn't one
    if (existing.role !== 'SUPER_ADMIN') {
      await prisma.user.update({
        where: { id: existing.id },
        data: { role: 'SUPER_ADMIN' },
      });
      console.log(`✅ Updated existing user to SUPER_ADMIN: ${existing.email}`);
    } else {
      console.log(`ℹ️  SUPER_ADMIN already exists: ${existing.email}`);
    }
    return;
  }

  const hashedPassword = await bcrypt.hash(SUPER_ADMIN.password, 12);

  // Find tenant_omega to associate the super admin with
  const tenant = await prisma.tenant.findFirst({
    where: { slug: 'omegaafro' },
  });

  const user = await prisma.user.create({
    data: {
      email: SUPER_ADMIN.email,
      password: hashedPassword,
      firstName: SUPER_ADMIN.firstName,
      lastName: SUPER_ADMIN.lastName,
      role: 'SUPER_ADMIN',
      emailVerified: true,
      isActive: true,
      ...(tenant && { tenantId: tenant.id }),
    },
  });

  console.log('✅ SUPER_ADMIN created successfully!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Email:    ${SUPER_ADMIN.email}`);
  console.log(`  Password: ${SUPER_ADMIN.password}`);
  console.log(`  Role:     SUPER_ADMIN`);
  console.log(`  User ID:  ${user.id}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n🔗 Login at /login then visit /platform for the Super Admin Console');
}

main()
  .catch((e) => {
    console.error('❌ Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
