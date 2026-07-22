import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { BankConnectionsModule } from './bank-connections/bank-connections.module';
import { CategoriesModule } from './categories/categories.module';
import { GlobalExceptionFilter } from './common/http-exception.filter';
import { envValidationSchema } from './config/env.validation';
import { databaseOptions } from './config/database.config';
import { CreditCardsModule } from './credit-cards/credit-cards.module';
import { entities } from './database/entities';
import { FixedBillsModule } from './fixed-bills/fixed-bills.module';
import { HealthModule } from './health/health.module';
import { IncomesModule } from './incomes/incomes.module';
import { TransactionsModule } from './transactions/transactions.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true, validationSchema: envValidationSchema }),
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
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ...databaseOptions(config),
        entities,
        migrationsRun: false,
      }),
    }),
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
  ],
})
export class AppModule {}
