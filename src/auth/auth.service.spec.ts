import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { PinoLogger } from 'nestjs-pino';
import {
  DataSource,
  EntityManager,
  QueryFailedError,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { User } from '../users/user.entity';
import { AuthService } from './auth.service';
import { TokenPair } from './auth.dto';
import { RefreshToken } from './refresh-token.entity';

describe('AuthService', () => {
  const userRepository = {
    create: jest.fn((value: Partial<User>) => value as User),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  } as unknown as Repository<User>;
  const tokenRepository = {
    create: jest.fn((value: Partial<RefreshToken>) => value as RefreshToken),
    save: jest.fn(),
    update: jest.fn(),
  } as unknown as Repository<RefreshToken>;
  const jwt = { signAsync: jest.fn(), verifyAsync: jest.fn() } as unknown as JwtService;
  const config = {
    getOrThrow: jest.fn((key: string) =>
      key.includes('TTL')
        ? key.includes('ACCESS')
          ? '15m'
          : '7d'
        : `${key}-secret-with-at-least-32-characters`,
    ),
  } as unknown as ConfigService;
  const transactionMock = jest.fn<
    Promise<TokenPair>,
    [(manager: EntityManager) => Promise<TokenPair>]
  >();
  const dataSource = { transaction: transactionMock } as unknown as DataSource;
  const logger = { info: jest.fn(), warn: jest.fn() } as unknown as PinoLogger;
  const service = new AuthService(userRepository, tokenRepository, jwt, config, dataSource, logger);
  const user = {
    id: 'user-id',
    nome: 'Ana',
    email: 'ana@example.com',
    senhaHash: '',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .mocked(jwt.signAsync)
      .mockReset()
      .mockResolvedValueOnce('access')
      .mockResolvedValueOnce('refresh');
  });

  it('registers a user without returning password or tokens', async () => {
    jest.mocked(userRepository.save).mockResolvedValue(user);
    const result = await service.register({
      nome: ' Ana ',
      email: 'ANA@example.com',
      senha: 'password123',
    });
    expect(result).toEqual(
      expect.objectContaining({ id: 'user-id', nome: 'Ana', email: 'ana@example.com' }),
    );
    expect(result).not.toHaveProperty('senhaHash');
    expect(
      await compare(
        'password123',
        jest.mocked(userRepository.create).mock.calls[0][0].senhaHash ?? '',
      ),
    ).toBe(true);
  });

  it('rejects duplicate registration', async () => {
    jest
      .mocked(userRepository.save)
      .mockRejectedValue(
        new QueryFailedError(
          'INSERT',
          [],
          Object.assign(new Error('duplicate'), { code: '23505' }),
        ),
      );
    await expect(
      service.register({ nome: 'Ana', email: 'ana@example.com', senha: 'password123' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('logs in with valid credentials and returns expiry', async () => {
    const valid = { ...user, senhaHash: await hash('password123', 4) };
    const qb = {
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(valid),
    } as unknown as SelectQueryBuilder<User>;
    jest.mocked(userRepository.createQueryBuilder).mockReturnValue(qb);
    const result = await service.login({ email: user.email, senha: 'password123' });
    expect(result).toEqual({ accessToken: 'access', refreshToken: 'refresh', expiresIn: 900 });
    expect(tokenRepository.save).toHaveBeenCalled();
  });

  it('rejects invalid login', async () => {
    const qb = {
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    } as unknown as SelectQueryBuilder<User>;
    jest.mocked(userRepository.createQueryBuilder).mockReturnValue(qb);
    await expect(service.login({ email: user.email, senha: 'wrong' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rotates a valid refresh token', async () => {
    const stored = {
      jti: 'old-jti',
      userId: user.id,
      tokenHash: await hash('raw-refresh', 4),
      expiresAt: new Date(Date.now() + 60000),
      revokedAt: null,
    } as RefreshToken;
    const qb = {
      addSelect: jest.fn().mockReturnThis(),
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(stored),
    } as unknown as SelectQueryBuilder<RefreshToken>;
    const managedTokens = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
      create: jest.fn((value: Partial<RefreshToken>) => value as RefreshToken),
      save: jest.fn(),
    } as unknown as Repository<RefreshToken>;
    const managedUsers = {
      findOneBy: jest.fn().mockResolvedValue(user),
    } as unknown as Repository<User>;
    const manager = {
      getRepository: jest.fn((entity: typeof User | typeof RefreshToken) =>
        entity === User ? managedUsers : managedTokens,
      ),
    } as unknown as EntityManager;
    transactionMock.mockImplementation(async (run) => run(manager));
    jest
      .mocked(jwt.verifyAsync)
      .mockResolvedValue({ sub: user.id, email: user.email, type: 'refresh', jti: 'old-jti' });
    const result = await service.refresh('raw-refresh');
    expect(result.expiresIn).toBe(900);
    expect(stored.revokedAt).toBeInstanceOf(Date);
    expect(managedTokens.save).toHaveBeenCalledTimes(2);
  });

  it('logs out only an owned refresh token', async () => {
    jest
      .mocked(jwt.verifyAsync)
      .mockResolvedValue({ sub: user.id, email: user.email, type: 'refresh', jti: 'jti' });
    await service.logout(user.id, 'raw-refresh');
    expect(tokenRepository.update).toHaveBeenCalled();
  });
});
