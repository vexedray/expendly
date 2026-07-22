import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FixedBill } from './fixed-bill.entity';
import { FixedBillsController } from './fixed-bills.controller';
import { FixedBillsService } from './fixed-bills.service';
@Module({
  imports: [TypeOrmModule.forFeature([FixedBill])],
  controllers: [FixedBillsController],
  providers: [FixedBillsService],
})
export class FixedBillsModule {}
