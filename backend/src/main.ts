import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import * as compression from 'compression';
import { json, raw } from 'express';
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { initSentry } from './sentry.config';

async function bootstrap() {
  // Initialize Sentry for error monitoring
  initSentry();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Create uploads directory if it doesn't exist
  const uploadsDir = join(process.cwd(), 'uploads', 'products');
  if (!existsSync(uploadsDir)) {
    await mkdir(uploadsDir, { recursive: true });
    console.log('📁 Created uploads directory');
  }

  // Serve static files from uploads directory
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // Security
  app.use(helmet());
  
  // CORS - support multiple origins
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3002',
     'http://172.20.10.6:3000',
    'https://www.omegaafro.com',
    'https://omegaafro.com',
    'https://om-ebon-omega.vercel.app',
    process.env.FRONTEND_URL,
  ].filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  // Middleware
  app.use(compression());
  app.use(cookieParser());
  
  // Raw body parsing for Stripe webhooks ONLY
  // This must be before the global JSON parser
  app.use('/v1/payments/webhook', raw({ type: 'application/json' }));

  // Global prefix (exclude health check for Render)
  app.setGlobalPrefix('v1', {
    exclude: ['health', ''],
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('OMEGA AFRO SHOP API')
    .setDescription('Online Ordering & Delivery Platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('products', 'Product catalog endpoints')
    .addTag('cart', 'Shopping cart endpoints')
    .addTag('orders', 'Order management endpoints')
    .addTag('payments', 'Payment processing endpoints')
    .addTag('delivery', 'Delivery management endpoints')
    .addTag('admin', 'Admin operations endpoints')
    .addTag('staff', 'Staff operations endpoints')
    .addTag('account', 'User account endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');

  console.log('');
  console.log('🚀 OMEGA AFRO SHOP Backend API');
  console.log('================================');
  console.log(`🌍 Server running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('');
}

bootstrap();
