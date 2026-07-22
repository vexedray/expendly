import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from '../categories/category.entity';
import { CreditCard } from '../credit-cards/credit-card.entity';
import { Transaction } from './transaction.entity';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
@Module({
  imports: [TypeOrmModule.forFeature([Transaction, Category, CreditCard])],
  controllers: [TransactionsController],
  providers: [TransactionsService],
})
export class TransactionsModule {}
