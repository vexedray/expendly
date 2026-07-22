import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PinoLogger } from 'nestjs-pino';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Category } from '../categories/category.entity';
import { Page, pageResult } from '../common/dto/page-query.dto';
import { CreditCard } from '../credit-cards/credit-card.entity';
import { TransactionQueryDto, UpdateTransactionDto } from './transaction.dto';
import { Transaction, TransactionStatus } from './transaction.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction) private readonly repository: Repository<Transaction>,
    @InjectRepository(Category) private readonly categories: Repository<Category>,
    @InjectRepository(CreditCard) private readonly cards: Repository<CreditCard>,
    private readonly logger: PinoLogger,
  ) {}

  async list(userId: string, query: TransactionQueryDto): Promise<Page<Transaction>> {
    const qb = this.ownedQuery(userId);
    if (query.categoriaId)
      qb.andWhere('transaction.categoriaId = :categoriaId', { categoriaId: query.categoriaId });
    if (query.creditCardId)
      qb.andWhere('transaction.creditCardId = :creditCardId', { creditCardId: query.creditCardId });
    if (query.status) qb.andWhere('transaction.status = :status', { status: query.status });
    if (query.dataInicio)
      qb.andWhere('transaction.data >= :dataInicio', { dataInicio: query.dataInicio });
    if (query.dataFim) qb.andWhere('transaction.data <= :dataFim', { dataFim: query.dataFim });
    const [data, total] = await qb
      .orderBy('transaction.data', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();
    return pageResult(data, total, query);
  }

  async get(userId: string, id: string): Promise<Transaction> {
    const transaction = await this.ownedQuery(userId)
      .andWhere('transaction.id = :id', { id })
      .getOne();
    if (!transaction) throw new NotFoundException('Transação não encontrada');
    return transaction;
  }

  async update(userId: string, id: string, dto: UpdateTransactionDto): Promise<Transaction> {
    const transaction = await this.get(userId, id);
    if (dto.categoriaId !== undefined) transaction.categoriaId = dto.categoriaId;
    if (dto.creditCardId !== undefined) transaction.creditCardId = dto.creditCardId;
    if (
      transaction.categoriaId &&
      !(await this.categories.existsBy({ id: transaction.categoriaId, userId }))
    ) {
      throw new NotFoundException('Categoria não encontrada');
    }
    if (
      transaction.creditCardId &&
      !(await this.cards.existsBy({ id: transaction.creditCardId, userId }))
    ) {
      throw new NotFoundException('Cartão não encontrado');
    }
    if (dto.descricao !== undefined) transaction.descricao = dto.descricao?.trim() || null;
    transaction.status =
      transaction.categoriaId && transaction.creditCardId && transaction.descricao
        ? TransactionStatus.QUALIFICADA
        : TransactionStatus.PENDENTE;
    const saved = await this.repository.save(transaction);
    this.logger.info({ userId, transactionId: id, status: saved.status }, 'transaction qualified');
    return saved;
  }

  private ownedQuery(userId: string): SelectQueryBuilder<Transaction> {
    return this.repository
      .createQueryBuilder('transaction')
      .innerJoin('transaction.bankConnection', 'bankConnection')
      .where('bankConnection.userId = :userId', { userId });
  }
}
