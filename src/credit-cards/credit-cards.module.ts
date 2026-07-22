import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreditCard } from './credit-card.entity';
import { CreditCardsController } from './credit-cards.controller';
import { CreditCardsService } from './credit-cards.service';
import { Transaction } from '../transactions/transaction.entity';
@Module({
  imports: [TypeOrmModule.forFeature([CreditCard, Transaction])],
  controllers: [CreditCardsController],
  providers: [CreditCardsService],
})
export class CreditCardsModule {}
