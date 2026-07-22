import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PinoLogger } from 'nestjs-pino';
import { Not, QueryFailedError, Repository } from 'typeorm';
import { CreateBankConnectionDto } from './bank-connection.dto';
import { BankConnection, BankConnectionStatus } from './bank-connection.entity';
import { ConnectToken, OPEN_FINANCE_PROVIDER, OpenFinanceProvider } from './open-finance.provider';

@Injectable()
export class BankConnectionsService {
  constructor(
    @InjectRepository(BankConnection) private readonly repository: Repository<BankConnection>,
    @Inject(OPEN_FINANCE_PROVIDER) private readonly provider: OpenFinanceProvider,
    private readonly logger: PinoLogger,
  ) {}

  async create(userId: string, dto: CreateBankConnectionDto): Promise<BankConnection> {
    if (
      await this.repository.existsBy({ userId, status: Not(BankConnectionStatus.DESCONECTADO) })
    ) {
      throw new ConflictException('Usuário já possui conexão Open Finance ativa');
    }
    try {
      const saved = await this.repository.save(
        this.repository.create({
          userId,
          pluggyItemId: dto.pluggyItemId.trim(),
          status: BankConnectionStatus.PENDENTE,
          lastSyncAt: null,
        }),
      );
      this.logger.info({ userId, bankConnectionId: saved.id }, 'bank connection created');
      return saved;
    } catch (error: unknown) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === '23505'
      ) {
        throw new ConflictException('Usuário já possui conexão Open Finance ativa');
      }
      throw error;
    }
  }

  list(userId: string): Promise<BankConnection[]> {
    return this.repository.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async get(userId: string, id: string): Promise<BankConnection> {
    const connection = await this.repository.findOneBy({ id, userId });
    if (!connection) throw new NotFoundException('Conexão bancária não encontrada');
    return connection;
  }

  connectToken(userId: string): Promise<ConnectToken> {
    return this.provider.createConnectToken(userId);
  }

  async disconnect(userId: string, id: string): Promise<void> {
    const connection = await this.get(userId, id);
    connection.status = BankConnectionStatus.DESCONECTADO;
    await this.repository.save(connection);
    this.logger.info({ userId, bankConnectionId: id }, 'bank connection disconnected');
  }
}
