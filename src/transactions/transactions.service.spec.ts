import { NotFoundException, ValidationPipe } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Category } from '../categories/category.entity';
import { CreditCard } from '../credit-cards/credit-card.entity';
import { UpdateTransactionDto } from './transaction.dto';
import { Transaction, TransactionStatus } from './transaction.entity';
import { TransactionsService } from './transactions.service';

describe('TransactionsService', () => {
  const repository = {
    createQueryBuilder: jest.fn(),
    save: jest.fn(),
  } as unknown as Repository<Transaction>;
  const categories = { existsBy: jest.fn() } as unknown as Repository<Category>;
  const cards = { existsBy: jest.fn() } as unknown as Repository<CreditCard>;
  const logger = { info: jest.fn() } as unknown as PinoLogger;
  const service = new TransactionsService(repository, categories, cards, logger);
  const pendingCases: UpdateTransactionDto[] = [
    {
      categoriaId: '10000000-0000-4000-8000-000000000001',
      creditCardId: '10000000-0000-4000-8000-000000000002',
    },
    { descricao: 'Mercado', creditCardId: '10000000-0000-4000-8000-000000000002' },
    { categoriaId: '10000000-0000-4000-8000-000000000001', descricao: 'Mercado' },
  ];

  const transaction = (): Transaction =>
    ({
      id: 'transaction-id',
      bankConnectionId: 'connection-id',
      categoriaId: null,
      creditCardId: null,
      nomeOriginal: 'ORIGINAL',
      descricao: null,
      valor: 20,
      data: '2026-07-10',
      status: TransactionStatus.PENDENTE,
      createdAt: new Date(),
      updatedAt: new Date(),
    }) as Transaction;

  const mockOwned = (value: Transaction): void => {
    const qb = {
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(value),
    } as unknown as SelectQueryBuilder<Transaction>;
    jest.mocked(repository.createQueryBuilder).mockReturnValue(qb);
    jest.mocked(repository.save).mockResolvedValue(value);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(categories.existsBy).mockResolvedValue(true);
    jest.mocked(cards.existsBy).mockResolvedValue(true);
  });

  it.each(pendingCases)('keeps pending when one requirement is missing', async (dto) => {
    const item = transaction();
    mockOwned(item);
    await service.update('user-id', item.id, dto);
    expect(item.status).toBe(TransactionStatus.PENDENTE);
  });

  it('qualifies only when category, description and card are present', async () => {
    const item = transaction();
    mockOwned(item);
    await service.update('user-id', item.id, {
      categoriaId: '10000000-0000-4000-8000-000000000001',
      creditCardId: '10000000-0000-4000-8000-000000000002',
      descricao: ' Mercado ',
    });
    expect(item.status).toBe(TransactionStatus.QUALIFICADA);
    expect(item.descricao).toBe('Mercado');
  });

  it('rejects a category owned by another user', async () => {
    const item = transaction();
    mockOwned(item);
    jest.mocked(categories.existsBy).mockResolvedValue(false);
    await expect(
      service.update('user-id', item.id, { categoriaId: '10000000-0000-4000-8000-000000000001' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects a card owned by another user', async () => {
    const item = transaction();
    mockOwned(item);
    jest.mocked(cards.existsBy).mockResolvedValue(false);
    await expect(
      service.update('user-id', item.id, { creditCardId: '10000000-0000-4000-8000-000000000002' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects immutable fields through global validation settings', async () => {
    const pipe = new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    await expect(
      pipe.transform({ nomeOriginal: 'changed' }, { type: 'body', metatype: UpdateTransactionDto }),
    ).rejects.toMatchObject({ status: 400 });
  });
});
