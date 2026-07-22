import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PinoLogger } from 'nestjs-pino';
import { FindOptionsWhere, QueryFailedError, Repository } from 'typeorm';
import { Page, pageResult } from '../common/dto/page-query.dto';
import { Transaction } from '../transactions/transaction.entity';
import { CreateCreditCardDto, CreditCardQueryDto, UpdateCreditCardDto } from './credit-card.dto';
import { CreditCard, CreditCardType } from './credit-card.entity';

@Injectable()
export class CreditCardsService {
  constructor(
    @InjectRepository(CreditCard) private readonly repository: Repository<CreditCard>,
    @InjectRepository(Transaction) private readonly transactions: Repository<Transaction>,
    private readonly logger: PinoLogger,
  ) {}

  async create(userId: string, dto: CreateCreditCardDto): Promise<CreditCard> {
    this.validateDays(dto.diaFechamento, dto.diaVencimento);
    const saved = await this.repository.save(
      this.repository.create({
        ...dto,
        userId,
        nome: dto.nome.trim(),
        tipo: dto.tipo ?? CreditCardType.CREDITO,
        ativo: dto.ativo ?? true,
      }),
    );
    this.logger.info({ userId, creditCardId: saved.id }, 'credit card created');
    return saved;
  }

  async list(userId: string, query: CreditCardQueryDto): Promise<Page<CreditCard>> {
    const where: FindOptionsWhere<CreditCard> = {
      userId,
      ...(query.ativo === undefined ? {} : { ativo: query.ativo }),
      ...(query.tipo ? { tipo: query.tipo } : {}),
    };
    const [data, total] = await this.repository.findAndCount({
      where,
      order: { nome: 'ASC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
    return pageResult(data, total, query);
  }

  async get(userId: string, id: string): Promise<CreditCard> {
    const card = await this.repository.findOneBy({ id, userId });
    if (!card) throw new NotFoundException('Cartão não encontrado');
    return card;
  }

  async update(userId: string, id: string, dto: UpdateCreditCardDto): Promise<CreditCard> {
    const card = await this.get(userId, id);
    this.validateDays(
      dto.diaFechamento ?? card.diaFechamento,
      dto.diaVencimento ?? card.diaVencimento,
    );
    this.repository.merge(card, {
      ...dto,
      nome: dto.nome === undefined ? card.nome : dto.nome.trim(),
    });
    const saved = await this.repository.save(card);
    this.logger.info({ userId, creditCardId: id }, 'credit card updated');
    return saved;
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.get(userId, id);
    if (await this.transactions.existsBy({ creditCardId: id })) {
      throw new ConflictException({
        error: 'CREDIT_CARD_HAS_LINKED_TRANSACTIONS',
        message: 'Cartão possui transações vinculadas',
      });
    }
    try {
      await this.repository.delete({ id, userId });
    } catch (error: unknown) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === '23503'
      ) {
        throw new ConflictException({
          error: 'CREDIT_CARD_HAS_LINKED_TRANSACTIONS',
          message: 'Cartão possui transações vinculadas',
        });
      }
      throw error;
    }
    this.logger.info({ userId, creditCardId: id }, 'credit card deleted');
  }

  private validateDays(diaFechamento: number, diaVencimento: number): void {
    if (diaFechamento < 1 || diaFechamento > 31 || diaVencimento < 1 || diaVencimento > 31) {
      throw new BadRequestException('Dias de fechamento e vencimento devem estar entre 1 e 31');
    }
  }
}
