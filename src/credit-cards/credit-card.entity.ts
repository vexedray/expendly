import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { User } from '../users/user.entity';

export enum CreditCardType {
  CREDITO = 'CREDITO',
}

@Entity('credit_cards')
@Index('IDX_credit_cards_user_id', ['userId'])
@Check('CHK_credit_cards_dia_fechamento', '"diaFechamento" BETWEEN 1 AND 31')
@Check('CHK_credit_cards_dia_vencimento', '"diaVencimento" BETWEEN 1 AND 31')
export class CreditCard extends BaseEntity {
  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, (user) => user.creditCards, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'varchar', length: 80 })
  nome!: string;

  @Column({ type: 'smallint' })
  diaFechamento!: number;

  @Column({ type: 'smallint' })
  diaVencimento!: number;

  @Column({
    type: 'enum',
    enum: CreditCardType,
    enumName: 'credit_card_type',
    default: CreditCardType.CREDITO,
  })
  tipo!: CreditCardType;

  @Column({ type: 'boolean', default: true })
  ativo!: boolean;
}
