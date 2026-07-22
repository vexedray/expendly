import { RefreshToken } from '../auth/refresh-token.entity';
import { BankConnection } from '../bank-connections/bank-connection.entity';
import { Category } from '../categories/category.entity';
import { CreditCard } from '../credit-cards/credit-card.entity';
import { FixedBill } from '../fixed-bills/fixed-bill.entity';
import { Income } from '../incomes/income.entity';
import { Transaction } from '../transactions/transaction.entity';
import { User } from '../users/user.entity';

export const entities = [
  User,
  RefreshToken,
  Category,
  Income,
  CreditCard,
  FixedBill,
  BankConnection,
  Transaction,
];
