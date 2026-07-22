import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateTransactionDto } from './transaction.dto';

describe('UpdateTransactionDto', () => {
  it('allows null to remove transaction classification', async () => {
    const dto = plainToInstance(UpdateTransactionDto, {
      categoriaId: null,
      creditCardId: null,
      descricao: null,
    });
    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects malformed category identifiers', async () => {
    const dto = plainToInstance(UpdateTransactionDto, { categoriaId: 'not-a-uuid' });
    expect(await validate(dto)).not.toHaveLength(0);
  });
});
