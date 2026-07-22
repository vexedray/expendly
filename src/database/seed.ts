import { hash } from 'bcryptjs';
import { BankConnection, BankConnectionStatus } from '../bank-connections/bank-connection.entity';
import { Category } from '../categories/category.entity';
import { CreditCard, CreditCardType } from '../credit-cards/credit-card.entity';
import { FixedBill } from '../fixed-bills/fixed-bill.entity';
import { Income, IncomeRecurrence, IncomeType } from '../incomes/income.entity';
import { Transaction, TransactionStatus } from '../transactions/transaction.entity';
import { User } from '../users/user.entity';
import dataSource from './data-source';

async function seed(): Promise<void> {
  if (process.env.NODE_ENV === 'production')
    throw new Error('O seed de demonstração não pode ser executado em produção');
  await dataSource.initialize();
  const email = (process.env.SEED_USER_EMAIL ?? 'demo@expendly.local').trim().toLowerCase();
  const users = dataSource.getRepository(User);
  let user = await users.findOneBy({ email });
  if (!user) {
    user = await users.save(
      users.create({
        email,
        nome: 'Usuário Demo',
        senhaHash: await hash(process.env.SEED_USER_PASSWORD ?? 'ChangeMe123!', 12),
      }),
    );
  }

  const categories = dataSource.getRepository(Category);
  let category = await categories.findOneBy({ userId: user.id, nome: 'ALIMENTAÇÃO' });
  if (!category)
    category = await categories.save(categories.create({ userId: user.id, nome: 'ALIMENTAÇÃO' }));

  const cards = dataSource.getRepository(CreditCard);
  let card = await cards.findOneBy({ userId: user.id, nome: 'Cartão Demo' });
  if (!card)
    card = await cards.save(
      cards.create({
        userId: user.id,
        nome: 'Cartão Demo',
        diaFechamento: 5,
        diaVencimento: 12,
        tipo: CreditCardType.CREDITO,
        ativo: true,
      }),
    );

  const connections = dataSource.getRepository(BankConnection);
  let connection = await connections.findOneBy({ userId: user.id, pluggyItemId: 'seed-item' });
  if (!connection)
    connection = await connections.save(
      connections.create({
        userId: user.id,
        pluggyItemId: 'seed-item',
        status: BankConnectionStatus.CONECTADO,
        lastSyncAt: new Date(),
      }),
    );

  const incomes = dataSource.getRepository(Income);
  if (!(await incomes.existsBy({ userId: user.id, nome: 'Salário' })))
    await incomes.save(
      incomes.create({
        userId: user.id,
        tipo: IncomeType.SALARIO,
        nome: 'Salário',
        valor: 5000,
        recorrencia: IncomeRecurrence.MENSAL,
        dataRecebimento: '2026-07-05',
      }),
    );

  const bills = dataSource.getRepository(FixedBill);
  if (!(await bills.existsBy({ userId: user.id, nome: 'Internet' })))
    await bills.save(
      bills.create({
        userId: user.id,
        nome: 'Internet',
        valor: 120,
        diaVencimento: 10,
        ativo: true,
      }),
    );

  const transactions = dataSource.getRepository(Transaction);
  if (
    !(await transactions.existsBy({
      bankConnectionId: connection.id,
      nomeOriginal: 'SUPERMERCADO DEMO',
    }))
  )
    await transactions.save(
      transactions.create({
        bankConnectionId: connection.id,
        categoriaId: category.id,
        creditCardId: card.id,
        nomeOriginal: 'SUPERMERCADO DEMO',
        descricao: 'Compras do mês',
        valor: 250.9,
        data: '2026-07-10',
        status: TransactionStatus.QUALIFICADA,
      }),
    );
}

seed()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (dataSource.isInitialized) await dataSource.destroy();
  });
