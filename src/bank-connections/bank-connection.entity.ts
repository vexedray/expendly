import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { User } from '../users/user.entity';

export enum BankConnectionStatus {
  CONECTADO = 'CONECTADO',
  PENDENTE = 'PENDENTE',
  ERRO = 'ERRO',
  DESCONECTADO = 'DESCONECTADO',
}

@Entity('bank_connections')
@Index('IDX_bank_connections_user_id', ['userId'])
@Index('UQ_bank_connections_active_user', ['userId'], {
  unique: true,
  where: `"status" <> 'DESCONECTADO'`,
})
export class BankConnection extends BaseEntity {
  @Column({ type: 'uuid' }) userId!: string;
  @ManyToOne(() => User, (user) => user.bankConnections, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'userId' })
  user!: User;
  @Column({ type: 'varchar', length: 255 }) pluggyItemId!: string;
  @Column({
    type: 'enum',
    enum: BankConnectionStatus,
    enumName: 'bank_connection_status',
    default: BankConnectionStatus.PENDENTE,
  })
  status!: BankConnectionStatus;
  @Column({ type: 'timestamptz', nullable: true }) lastSyncAt!: Date | null;
}
