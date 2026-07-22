import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Income } from './income.entity';
import { IncomesController } from './incomes.controller';
import { IncomesService } from './incomes.service';
@Module({
  imports: [TypeOrmModule.forFeature([Income])],
  controllers: [IncomesController],
  providers: [IncomesService],
})
export class IncomesModule {}
