import { CacheModule } from '@nestjs/cache-manager';
import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createKeyv } from '@keyv/redis';
import { LoggerModule } from 'nestjs-pino';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { BankConnectionsModule } from './bank-connections/bank-connections.module';
import { CategoriesModule } from './categories/categories.module';
import { GlobalExceptionFilter } from './common/http-exception.filter';
import { CacheInvalidationInterceptor } from './common/interceptors/cache-invalidation.interceptor';
import { RequestLoggingInterceptor } from './common/interceptors/request-logging.interceptor';
import { UserCacheInterceptor } from './common/interceptors/user-cache.interceptor';
import { PostgresConfigService } from './config/database.config';
import { envValidationSchema } from './config/env.validation';
import { CreditCardsModule } from './credit-cards/credit-cards.module';
import { FixedBillsModule } from './fixed-bills/fixed-bills.module';
import { HealthModule } from './health/health.module';
import { IncomesModule } from './incomes/incomes.module';
import { TransactionsModule } from './transactions/transactions.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true, validationSchema: envValidationSchema }),
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        stores: createKeyv(config.getOrThrow<string>('REDIS_URL'), {
          namespace: 'expendly',
          throwOnConnectError: true,
          throwOnErrors: true,
        }),
        ttl: config.getOrThrow<number>('CACHE_TTL_MS'),
      }),
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        pinoHttp: {
          level: config.getOrThrow<string>('LOG_LEVEL'),
          transport:
            config.get<string>('NODE_ENV') === 'development'
              ? { target: 'pino-pretty', options: { singleLine: true } }
              : undefined,
          redact: [
            'req.headers.authorization',
            'req.body.senha',
            'req.body.refreshToken',
            'senhaHash',
            'tokenHash',
            '*.senhaHash',
            '*.tokenHash',
            '*.parameters',
          ],
        },
      }),
    }),
    TypeOrmModule.forRootAsync({ useClass: PostgresConfigService }),
    AuthModule,
    UsersModule,
    CategoriesModule,
    IncomesModule,
    CreditCardsModule,
    FixedBillsModule,
    BankConnectionsModule,
    TransactionsModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: ClassSerializerInterceptor },
    { provide: APP_INTERCEPTOR, useClass: RequestLoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: CacheInvalidationInterceptor },
    { provide: APP_INTERCEPTOR, useClass: UserCacheInterceptor },
  ],
})
export class AppModule {}
