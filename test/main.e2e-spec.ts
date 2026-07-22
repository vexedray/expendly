import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Server } from 'http';
import request from 'supertest';
import { AppModule } from '../src/app.module';

interface Tokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
interface Created {
  id: string;
}

describe('Main user flow (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  const suffix = Date.now();
  const first = `first-${suffix}@example.com`;
  const second = `second-${suffix}@example.com`;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
    const httpServer: unknown = app.getHttpServer();
    server = httpServer as Server;
  });

  afterAll(async () => app.close());

  it('registers, logs in, protects resources, creates resources and isolates users', async () => {
    await request(server).get('/users/me').expect(401);
    await request(server)
      .post('/auth/register')
      .send({ nome: 'Primeiro', email: first, senha: 'StrongPassword123!' })
      .expect(201);
    const login = await request(server)
      .post('/auth/login')
      .send({ email: first, senha: 'StrongPassword123!' })
      .expect(200);
    const tokens = login.body as Tokens;
    const auth = { Authorization: `Bearer ${tokens.accessToken}` };
    await request(server).get('/users/me').set(auth).expect(200);

    const categoryResponse = await request(server)
      .post('/categories')
      .set(auth)
      .send({ nome: ' alimentação ' })
      .expect(201);
    const category = categoryResponse.body as Created;
    await request(server)
      .post('/credit-cards')
      .set(auth)
      .send({ nome: 'Principal', diaFechamento: 5, diaVencimento: 12 })
      .expect(201);
    await request(server)
      .post('/income')
      .set(auth)
      .send({
        tipo: 'SALARIO',
        nome: 'Salário',
        valor: '5000.00',
        recorrencia: 'MENSAL',
        dataRecebimento: '2026-07-05',
      })
      .expect(201);
    await request(server)
      .post('/fixed-bills')
      .set(auth)
      .send({ nome: 'Internet', valor: '120.00', diaVencimento: 10 })
      .expect(201);
    await request(server).get('/categories').set(auth).expect(200);
    await request(server).get('/credit-cards').set(auth).expect(200);
    await request(server).get('/income').set(auth).expect(200);
    await request(server).get('/fixed-bills').set(auth).expect(200);

    await request(server)
      .post('/auth/register')
      .send({ nome: 'Segundo', email: second, senha: 'StrongPassword123!' })
      .expect(201);
    const secondLogin = await request(server)
      .post('/auth/login')
      .send({ email: second, senha: 'StrongPassword123!' })
      .expect(200);
    const secondTokens = secondLogin.body as Tokens;
    const secondAuth = { Authorization: `Bearer ${secondTokens.accessToken}` };
    await request(server).get(`/categories/${category.id}`).set(secondAuth).expect(404);
    const isolatedList = await request(server).get('/categories').set(secondAuth).expect(200);
    expect((isolatedList.body as Created[]).some((item) => item.id === category.id)).toBe(false);
  });
});
