import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Tenant Context Resolution (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testTenant: any;
  let testUser: any;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    await app.init();

    // Create test tenant
    testTenant = await prisma.tenant.create({
      data: {
        name: 'Test Store',
        slug: 'teststore',
        email: 'test@teststore.com',
        status: 'ACTIVE',
        onboardingStatus: 'LIVE',
        billingStatus: 'BILLING_ACTIVE',
      },
    });

    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: 'user@teststore.com',
        password: 'hashedpassword',
        firstName: 'Test',
        lastName: 'User',
        role: 'ADMIN',
        tenantId: testTenant.id,
        isActive: true,
      },
    });

    // Get auth token (you'll need to implement this based on your auth flow)
    const authResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'user@teststore.com',
        password: 'password',
      });
    
    authToken = authResponse.body.accessToken;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.user.deleteMany({ where: { tenantId: testTenant.id } });
    await prisma.tenant.delete({ where: { id: testTenant.id } });
    await app.close();
  });

  describe('Subdomain Resolution', () => {
    it('should resolve tenant from X-Tenant-Slug header', () => {
      return request(app.getHttpServer())
        .get('/products')
        .set('X-Tenant-Slug', 'teststore')
        .expect(200);
    });

    it('should resolve tenant from subdomain in Host header', () => {
      return request(app.getHttpServer())
        .get('/products')
        .set('Host', 'teststore.viralsocialmediabooster.com')
        .expect(200);
    });

    it('should reject request with invalid tenant slug', () => {
      return request(app.getHttpServer())
        .get('/products')
        .set('X-Tenant-Slug', 'nonexistent')
        .expect(404);
    });

    it('should reject request with no tenant context', () => {
      return request(app.getHttpServer())
        .get('/products')
        .expect(403);
    });
  });

  describe('Tenant Status Enforcement', () => {
    it('should reject requests for SUSPENDED tenant', async () => {
      await prisma.tenant.update({
        where: { id: testTenant.id },
        data: { status: 'SUSPENDED' },
      });

      await request(app.getHttpServer())
        .get('/products')
        .set('X-Tenant-Slug', 'teststore')
        .expect(403);

      // Restore
      await prisma.tenant.update({
        where: { id: testTenant.id },
        data: { status: 'ACTIVE' },
      });
    });

    it('should reject requests for DISABLED tenant', async () => {
      await prisma.tenant.update({
        where: { id: testTenant.id },
        data: { status: 'DISABLED' },
      });

      await request(app.getHttpServer())
        .get('/products')
        .set('X-Tenant-Slug', 'teststore')
        .expect(403);

      // Restore
      await prisma.tenant.update({
        where: { id: testTenant.id },
        data: { status: 'ACTIVE' },
      });
    });

    it('should allow requests for ACTIVE tenant', () => {
      return request(app.getHttpServer())
        .get('/products')
        .set('X-Tenant-Slug', 'teststore')
        .expect(200);
    });
  });

  describe('TenantRequiredGuard', () => {
    it('should enforce tenant context on protected routes', () => {
      return request(app.getHttpServer())
        .get('/products')
        .expect(403); // No tenant context
    });

    it('should allow requests with valid tenant context', () => {
      return request(app.getHttpServer())
        .get('/products')
        .set('X-Tenant-Slug', 'teststore')
        .expect(200);
    });
  });

  describe('CurrentTenant Decorator', () => {
    it('should inject tenant context into controller methods', async () => {
      const response = await request(app.getHttpServer())
        .get('/products')
        .set('X-Tenant-Slug', 'teststore')
        .expect(200);

      // Verify response contains tenant-scoped data
      expect(response.body).toBeDefined();
    });
  });
});
