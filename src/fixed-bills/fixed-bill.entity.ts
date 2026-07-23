import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { numericTransformer } from '../common/numeric.transformer';
import { User } from '../users/user.entity';

@Entity('fixed_bills')
@Index('IDX_fixed_bills_user_id', ['userId'])
@Check('CHK_fixed_bills_dia_vencimento', '"diaVencimento" BETWEEN 1 AND 31')
@Check('CHK_fixed_bills_valor_positive', '"valor" > 0')
export class FixedBill extends BaseEntity {
  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, (user) => user.fixedBills, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'varchar', length: 120 })
  nome!: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, transformer: numericTransformer })
  valor!: number;

  @Column({ type: 'smallint' })
  diaVencimento!: number;

  @Column({ type: 'boolean', default: true })
  ativo!: boolean;
}
