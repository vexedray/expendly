import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { entities } from '../database/entities';

@Injectable()
export class PostgresConfigService implements TypeOrmOptionsFactory {
  constructor(private readonly config: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const url = this.config.get<string>('DATABASE_URL');
    const base: TypeOrmModuleOptions = {
      type: 'postgres',
      entities,
      synchronize: false,
      migrationsRun: false,
      logging: this.config.get<string>('NODE_ENV') === 'development',
    };

    return url
      ? { ...base, url }
      : {
          ...base,
          host: this.config.getOrThrow<string>('POSTGRES_HOST'),
          port: this.config.getOrThrow<number>('POSTGRES_PORT'),
          username: this.config.getOrThrow<string>('POSTGRES_USER'),
          password: this.config.getOrThrow<string>('POSTGRES_PASSWORD'),
          database: this.config.getOrThrow<string>('POSTGRES_DB'),
        };
  }
}
