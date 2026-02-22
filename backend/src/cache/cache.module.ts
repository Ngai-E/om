import { Module, Global } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';

@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        const redisUrl = process.env.REDIS_URL;
        const defaultTtl = 60 * 5 * 1000; // 5 minutes in milliseconds
        
        // If no Redis URL is provided, use in-memory cache
        if (!redisUrl) {
          console.log('ℹ️  No REDIS_URL configured, using in-memory cache');
          return {
            ttl: defaultTtl,
            max: 100, // Maximum number of items in cache
          };
        }

        try {
          // Try to connect to Redis with timeout
          const connectPromise = redisStore({
            url: redisUrl,
            ttl: defaultTtl,
            socket: {
              connectTimeout: 5000, // 5 second timeout
              reconnectStrategy: (retries) => {
                if (retries > 3) {
                  console.error('❌ Redis connection failed after 3 retries, falling back to in-memory cache');
                  return false; // Stop retrying
                }
                return Math.min(retries * 100, 3000);
              },
            },
          });

          // Add timeout to connection attempt
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Redis connection timeout')), 10000);
          });

          const store = await Promise.race([connectPromise, timeoutPromise]);

          console.log('✅ Redis cache connected:', redisUrl);

          return {
            store: store as any,
            ttl: defaultTtl,
          };
        } catch (error) {
          console.warn('⚠️  Redis connection failed:', error.message);
          console.log('📦 Falling back to in-memory cache');
          
          // Fallback to in-memory cache if Redis is not available
          return {
            ttl: defaultTtl,
            max: 100, // Maximum number of items in cache
          };
        }
      },
    }),
  ],
})
export class CacheModule {}
