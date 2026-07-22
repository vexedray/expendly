import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { Category } from './category.entity';
import { Transaction } from '../transactions/transaction.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Category, Transaction])],
  controllers: [CategoriesController],
  providers: [CategoriesService],
})
export class CategoriesModule {}
