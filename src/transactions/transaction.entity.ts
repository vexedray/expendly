import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BankConnection } from '../bank-connections/bank-connection.entity';
import { Category } from '../categories/category.entity';
import { BaseEntity } from '../common/base.entity';
import { numericTransformer } from '../common/numeric.transformer';
import { CreditCard } from '../credit-cards/credit-card.entity';

export enum TransactionStatus {
  PENDENTE = 'PENDENTE',
  QUALIFICADA = 'QUALIFICADA',
}

@Entity('transactions')
@Index('IDX_transactions_bank_data', ['bankConnectionId', 'data'])
@Index('IDX_transactions_categoria', ['categoriaId'])
export class Transaction extends BaseEntity {
  @Column({ type: 'uuid' })
  bankConnectionId!: string;

  @ManyToOne(() => BankConnection, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'bankConnectionId' })
  bankConnection!: BankConnection;

  @Column({ type: 'uuid', nullable: true })
  categoriaId!: string | null;

  @ManyToOne(() => Category, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'categoriaId' })
  categoria!: Category | null;

  @Column({ type: 'uuid', nullable: true })
  creditCardId!: string | null;

  @ManyToOne(() => CreditCard, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'creditCardId' })
  creditCard!: CreditCard | null;

  @Column({ type: 'varchar', length: 160 })
  nomeOriginal!: string;

  @Column({ type: 'varchar', length: 160, nullable: true })
  descricao!: string | null;

  @Column({ type: 'numeric', precision: 14, scale: 2, transformer: numericTransformer })
  valor!: number;

  @Column({ type: 'date' })
  data!: string;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    enumName: 'transaction_status',
    default: TransactionStatus.PENDENTE,
  })
  status!: TransactionStatus;
}
