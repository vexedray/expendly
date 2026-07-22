import { ConfigService } from '@nestjs/config';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

export const databaseOptions = (config: ConfigService): PostgresConnectionOptions => {
  const url = config.get<string>('DATABASE_URL');
  const base: PostgresConnectionOptions = {
    type: 'postgres',
    synchronize: false,
    logging: config.get<string>('NODE_ENV') === 'development',
  };
  return url
    ? { ...base, url }
    : {
        ...base,
        host: config.getOrThrow<string>('POSTGRES_HOST'),
        port: config.getOrThrow<number>('POSTGRES_PORT'),
        username: config.getOrThrow<string>('POSTGRES_USER'),
        password: config.getOrThrow<string>('POSTGRES_PASSWORD'),
        database: config.getOrThrow<string>('POSTGRES_DB'),
      };
};
