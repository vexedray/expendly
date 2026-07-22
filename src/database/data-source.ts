import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { entities } from './entities';

config();

export default new DataSource({
  type: 'postgres',
  ...(process.env.DATABASE_URL
    ? { url: process.env.DATABASE_URL }
    : {
        host: process.env.POSTGRES_HOST ?? 'localhost',
        port: Number(process.env.POSTGRES_PORT ?? 5432),
        username: process.env.POSTGRES_USER ?? 'expendly',
        password: process.env.POSTGRES_PASSWORD ?? 'expendly',
        database: process.env.POSTGRES_DB ?? 'expendly',
      }),
  entities,
  migrations: [`${__dirname}/migrations/*{.ts,.js}`],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});
