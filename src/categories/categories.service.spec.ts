import { ConflictException, NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { QueryFailedError, Repository } from 'typeorm';
import { Transaction } from '../transactions/transaction.entity';
import { Category } from './category.entity';
import { CategoriesService } from './categories.service';

describe('CategoriesService', () => {
  const repository = {
    create: jest.fn((value: Partial<Category>) => value as Category),
    save: jest.fn(),
    find: jest.fn(),
    findOneBy: jest.fn(),
    delete: jest.fn(),
  } as unknown as Repository<Category>;
  const transactions = { existsBy: jest.fn() } as unknown as Repository<Transaction>;
  const logger = { info: jest.fn() } as unknown as PinoLogger;
  const service = new CategoriesService(repository, transactions, logger);

  beforeEach(() => jest.clearAllMocks());

  it('creates with trimmed uppercase name and server ownership', async () => {
    const saved = { id: 'category', userId: 'user-a', nome: 'MERCADO' } as Category;
    jest.mocked(repository.save).mockResolvedValue(saved);
    await expect(service.create('user-a', { nome: ' mercado ' })).resolves.toBe(saved);
    expect(repository.create).toHaveBeenCalledWith({ userId: 'user-a', nome: 'MERCADO' });
  });

  it('returns conflict on duplicate category', async () => {
    jest
      .mocked(repository.save)
      .mockRejectedValue(
        new QueryFailedError(
          'INSERT',
          [],
          Object.assign(new Error('duplicate'), { code: '23505' }),
        ),
      );
    await expect(service.create('user-a', { nome: 'Mercado' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('does not expose another user category', async () => {
    jest.mocked(repository.findOneBy).mockResolvedValue(null);
    await expect(service.get('user-a', 'foreign')).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.findOneBy).toHaveBeenCalledWith({ id: 'foreign', userId: 'user-a' });
  });

  it('blocks deletion when transactions are linked', async () => {
    jest
      .mocked(repository.findOneBy)
      .mockResolvedValue({ id: 'category', userId: 'user-a' } as Category);
    jest.mocked(transactions.existsBy).mockResolvedValue(true);
    await expect(service.remove('user-a', 'category')).rejects.toMatchObject({
      response: { error: 'CATEGORY_HAS_LINKED_TRANSACTIONS' },
    });
  });
});
