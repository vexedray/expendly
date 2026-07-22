import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { Public } from '../common/decorators/public.decorator';

export interface HealthResponse {
  status: 'ok';
  database: 'ok';
  uptime: number;
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly database: DataSource) {}

  @Public()
  @Get()
  async check(): Promise<HealthResponse> {
    try {
      await this.database.query('SELECT 1');
      return { status: 'ok', database: 'ok', uptime: process.uptime() };
    } catch {
      throw new ServiceUnavailableException('Banco de dados indisponível');
    }
  }
}
