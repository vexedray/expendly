import Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().port().default(3000),
  DATABASE_URL: Joi.string().uri().optional(),
  POSTGRES_HOST: Joi.string().default('localhost'),
  POSTGRES_PORT: Joi.number().port().default(5432),
  POSTGRES_USER: Joi.string().default('expendly'),
  POSTGRES_PASSWORD: Joi.string().default('expendly'),
  POSTGRES_DB: Joi.string().default('expendly'),
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_TTL: Joi.string()
    .pattern(/^\d+[smhd]$/)
    .default('15m'),
  JWT_REFRESH_TTL: Joi.string()
    .pattern(/^\d+[smhd]$/)
    .default('7d'),
  CORS_ORIGIN: Joi.string().default('http://localhost:3001'),
  LOG_LEVEL: Joi.string().valid('fatal', 'error', 'warn', 'info', 'debug', 'trace').default('info'),
});
