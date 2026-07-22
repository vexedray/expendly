import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BankConnection } from './bank-connection.entity';
import { BankConnectionsController } from './bank-connections.controller';
import { BankConnectionsService } from './bank-connections.service';
import { OPEN_FINANCE_PROVIDER, UnsupportedOpenFinanceProvider } from './open-finance.provider';
@Module({
  imports: [TypeOrmModule.forFeature([BankConnection])],
  controllers: [BankConnectionsController],
  providers: [
    BankConnectionsService,
    { provide: OPEN_FINANCE_PROVIDER, useClass: UnsupportedOpenFinanceProvider },
  ],
})
export class BankConnectionsModule {}
