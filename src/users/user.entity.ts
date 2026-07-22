import { Column, Entity, Index, OneToMany } from 'typeorm';
import { Exclude } from 'class-transformer';
import { BaseEntity } from '../common/base.entity';
import { RefreshToken } from '../auth/refresh-token.entity';
import { BankConnection } from '../bank-connections/bank-connection.entity';
import { Category } from '../categories/category.entity';
import { CreditCard } from '../credit-cards/credit-card.entity';
import { FixedBill } from '../fixed-bills/fixed-bill.entity';
import { Income } from '../incomes/income.entity';

@Entity('users')
export class User extends BaseEntity {
  @Index('UQ_users_email', { unique: true })
  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 100 })
  nome!: string;

  @Exclude()
  @Column({ type: 'varchar', length: 255, select: false })
  senhaHash!: string;

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens!: RefreshToken[];

  @OneToMany(() => BankConnection, (connection) => connection.user)
  bankConnections!: BankConnection[];

  @OneToMany(() => Category, (category) => category.user)
  categories!: Category[];

  @OneToMany(() => Income, (income) => income.user)
  incomes!: Income[];

  @OneToMany(() => CreditCard, (card) => card.user)
  creditCards!: CreditCard[];

  @OneToMany(() => FixedBill, (bill) => bill.user)
  fixedBills!: FixedBill[];
}
