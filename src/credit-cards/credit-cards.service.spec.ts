import { BadRequestException, ConflictException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PinoLogger } from 'nestjs-pino';
import { Repository } from 'typeorm';
import { Transaction } from '../transactions/transaction.entity';
import { CreateCreditCardDto } from './credit-card.dto';
import { CreditCard } from './credit-card.entity';
import { CreditCardsService } from './credit-cards.service';

describe('CreditCardsService', () => {
  const repository = {
    create: jest.fn(),
    save: jest.fn(),
    findOneBy: jest.fn(),
    delete: jest.fn(),
  } as unknown as Repository<CreditCard>;
  const transactions = { existsBy: jest.fn() } as unknown as Repository<Transaction>;
  const logger = { info: jest.fn() } as unknown as PinoLogger;
  const service = new CreditCardsService(repository, transactions, logger);

  beforeEach(() => jest.clearAllMocks());

  it.each([0, 32])('rejects invalid closing and due days: %s', async (day) => {
    const dto = plainToInstance(CreateCreditCardDto, {
      nome: 'Card',
      diaFechamento: day,
      diaVencimento: day,
    });
    expect(await validate(dto)).not.toHaveLength(0);
    await expect(
      service.create('user-id', { nome: 'Card', diaFechamento: day, diaVencimento: day }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('blocks deletion when transactions are linked', async () => {
    jest
      .mocked(repository.findOneBy)
      .mockResolvedValue({ id: 'card', userId: 'user-id' } as CreditCard);
    jest.mocked(transactions.existsBy).mockResolvedValue(true);
    await expect(service.remove('user-id', 'card')).rejects.toMatchObject({
      response: { error: 'CREDIT_CARD_HAS_LINKED_TRANSACTIONS' },
    });
    await expect(service.remove('user-id', 'card')).rejects.toBeInstanceOf(ConflictException);
  });
});
