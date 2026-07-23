import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { numericTransformer } from '../common/numeric.transformer';
import { User } from '../users/user.entity';

export enum IncomeType {
  SALARIO = 'SALARIO',
  EXTRA = 'EXTRA',
}
export enum IncomeRecurrence {
  UNICA = 'UNICA',
  MENSAL = 'MENSAL',
}

@Entity('incomes')
@Index('IDX_incomes_user_data_recebimento', ['userId', 'dataRecebimento'])
@Check('CHK_incomes_valor_positive', '"valor" > 0')
export class Income extends BaseEntity {
  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, (user) => user.incomes, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'enum', enum: IncomeType, enumName: 'income_type' })
  tipo!: IncomeType;

  @Column({ type: 'varchar', length: 120 })
  nome!: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, transformer: numericTransformer })
  valor!: number;

  @Column({ type: 'enum', enum: IncomeRecurrence, enumName: 'income_recurrence' })
  recorrencia!: IncomeRecurrence;

  @Column({ type: 'date' })
  dataRecebimento!: string;
}
