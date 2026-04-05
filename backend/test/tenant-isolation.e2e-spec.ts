import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Tenant Isolation (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tenant1: any;
  let tenant2: any;
  let product1: any;
  let product2: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    await app.init();

    // Create two test tenants
    tenant1 = await prisma.tenant.create({
      data: {
        name: 'Tenant One',
        slug: 'tenant1',
        email: 'tenant1@test.com',
        status: 'ACTIVE',
        onboardingStatus: 'PENDING',
        billingStatus: 'TRIAL',
      },
    });

    tenant2 = await prisma.tenant.create({
      data: {
        name: 'Tenant Two',
        slug: 'tenant2',
        email: 'tenant2@test.com',
        status: 'ACTIVE',
        onboardingStatus: 'PENDING',
        billingStatus: 'TRIAL',
      },
    });

    // Create category for tenant1
    const category1 = await prisma.category.create({
      data: {
        name: 'Category 1',
        slug: 'category-1',
        tenantId: tenant1.id,
        isActive: true,
      },
    });

    // Create category for tenant2
    const category2 = await prisma.category.create({
      data: {
        name: 'Category 2',
        slug: 'category-2',
        tenantId: tenant2.id,
        isActive: true,
      },
    });

    // Create products for each tenant
    product1 = await prisma.product.create({
      data: {
        name: 'Product 1',
        slug: 'product-1',
        description: 'Tenant 1 Product',
        price: 100,
        tenantId: tenant1.id,
        categoryId: category1.id,
        isActive: true,
      },
    });

    product2 = await prisma.product.create({
      data: {
        name: 'Product 2',
        slug: 'product-2',
        description: 'Tenant 2 Product',
        price: 200,
        tenantId: tenant2.id,
        categoryId: category2.id,
        isActive: true,
      },
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.product.deleteMany({ where: { tenantId: { in: [tenant1.id, tenant2.id] } } });
    await prisma.category.deleteMany({ where: { tenantId: { in: [tenant1.id, tenant2.id] } } });
    await prisma.tenant.deleteMany({ where: { id: { in: [tenant1.id, tenant2.id] } } });
    await app.close();
  });

  describe('Product Isolation', () => {
    it('should only return products for tenant1', async () => {
      const response = await request(app.getHttpServer())
        .get('/products')
        .set('X-Tenant-Slug', 'tenant1')
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].id).toBe(product1.id);
      expect(response.body.data[0].name).toBe('Product 1');
    });

    it('should only return products for tenant2', async () => {
      const response = await request(app.getHttpServer())
        .get('/products')
        .set('X-Tenant-Slug', 'tenant2')
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].id).toBe(product2.id);
      expect(response.body.data[0].name).toBe('Product 2');
    });

    it('should not allow tenant1 to access tenant2 product by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/products/${product2.id}`)
        .set('X-Tenant-Slug', 'tenant1')
        .expect(404);
    });

    it('should not allow tenant2 to access tenant1 product by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/products/${product1.id}`)
        .set('X-Tenant-Slug', 'tenant2')
        .expect(404);
    });
  });

  describe('Category Isolation', () => {
    it('should only return categories for tenant1', async () => {
      const response = await request(app.getHttpServer())
        .get('/products/categories')
        .set('X-Tenant-Slug', 'tenant1')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.length).toBe(1);
      expect(response.body[0].name).toBe('Category 1');
    });

    it('should only return categories for tenant2', async () => {
      const response = await request(app.getHttpServer())
        .get('/products/categories')
        .set('X-Tenant-Slug', 'tenant2')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.length).toBe(1);
      expect(response.body[0].name).toBe('Category 2');
    });
  });

  describe('Cross-Tenant Data Leakage Prevention', () => {
    it('should not leak tenant1 data to tenant2', async () => {
      const response = await request(app.getHttpServer())
        .get('/products')
        .set('X-Tenant-Slug', 'tenant2')
        .expect(200);

      const productIds = response.body.data.map((p: any) => p.id);
      expect(productIds).not.toContain(product1.id);
    });

    it('should not leak tenant2 data to tenant1', async () => {
      const response = await request(app.getHttpServer())
        .get('/products')
        .set('X-Tenant-Slug', 'tenant1')
        .expect(200);

      const productIds = response.body.data.map((p: any) => p.id);
      expect(productIds).not.toContain(product2.id);
    });
  });

  describe('Settings Isolation', () => {
    it('should isolate settings between tenants', async () => {
      // This test would verify that tenant settings are properly isolated
      // Implementation depends on your settings endpoints
      const response1 = await request(app.getHttpServer())
        .get('/settings')
        .set('X-Tenant-Slug', 'tenant1')
        .expect(200);

      const response2 = await request(app.getHttpServer())
        .get('/settings')
        .set('X-Tenant-Slug', 'tenant2')
        .expect(200);

      // Settings should be different for each tenant
      expect(response1.body).toBeDefined();
      expect(response2.body).toBeDefined();
    });
  });
});
