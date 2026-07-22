import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { compare, hash } from 'bcryptjs';
import { randomUUID } from 'crypto';
import { PinoLogger } from 'nestjs-pino';
import { DataSource, IsNull, QueryFailedError, Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { JwtPayload } from './auth-user.interface';
import { LoginDto, PublicUser, RegisterDto, TokenPair } from './auth.dto';
import { RefreshToken } from './refresh-token.entity';

const ttlSeconds = (value: string): number => {
  const match = /^(\d+)([smhd])$/.exec(value);
  if (!match) throw new Error(`Invalid JWT TTL: ${value}`);
  const units: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  return Number(match[1]) * units[match[2]];
};

const publicUser = (user: User): PublicUser => ({
  id: user.id,
  nome: user.nome,
  email: user.email,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(RefreshToken) private readonly tokens: Repository<RefreshToken>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly dataSource: DataSource,
    private readonly logger: PinoLogger,
  ) {}

  async register(dto: RegisterDto): Promise<PublicUser> {
    const user = this.users.create({
      email: dto.email.trim().toLowerCase(),
      nome: dto.nome.trim(),
      senhaHash: await hash(dto.senha, 12),
    });
    try {
      const saved = await this.users.save(user);
      this.logger.info({ userId: saved.id }, 'auth register success');
      return publicUser(saved);
    } catch (error: unknown) {
      if (this.isDuplicate(error)) {
        this.logger.warn('auth register duplicate rejected');
        throw new ConflictException('E-mail já cadastrado');
      }
      throw error;
    }
  }

  async login(dto: LoginDto): Promise<TokenPair> {
    const user = await this.users
      .createQueryBuilder('user')
      .addSelect('user.senhaHash')
      .where('LOWER(user.email) = LOWER(:email)', { email: dto.email.trim() })
      .getOne();
    if (!user || !(await compare(dto.senha, user.senhaHash))) {
      this.logger.warn('auth login failed');
      throw new UnauthorizedException('Credenciais inválidas');
    }
    const pair = await this.issuePair(user);
    this.logger.info({ userId: user.id }, 'auth login success');
    return pair;
  }

  async refresh(rawToken: string): Promise<TokenPair> {
    const payload = await this.verifyRefresh(rawToken);
    const tokens = await this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(RefreshToken);
      const stored = await repository
        .createQueryBuilder('token')
        .addSelect('token.tokenHash')
        .setLock('pessimistic_write')
        .where('token.jti = :jti', { jti: payload.jti })
        .getOne();
      if (
        !stored ||
        stored.revokedAt ||
        stored.expiresAt <= new Date() ||
        !(await compare(rawToken, stored.tokenHash))
      ) {
        throw new UnauthorizedException('Refresh token inválido ou já utilizado');
      }
      const user = await manager.getRepository(User).findOneBy({ id: payload.sub });
      if (!user) throw new UnauthorizedException('Usuário não encontrado');
      const pair = await this.createPair(user);
      stored.revokedAt = new Date();
      stored.replacedByJti = pair.jti;
      await repository.save(stored);
      await repository.save(repository.create(pair.entity));
      return pair.tokens;
    });
    this.logger.info({ userId: payload.sub }, 'auth refresh success');
    return tokens;
  }

  async logout(userId: string, rawToken: string): Promise<void> {
    const payload = await this.verifyRefresh(rawToken);
    if (payload.sub !== userId)
      throw new UnauthorizedException('Refresh token pertence a outro usuário');
    await this.tokens.update(
      { jti: payload.jti, userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
    this.logger.info({ userId }, 'auth logout success');
  }

  private async issuePair(user: User): Promise<TokenPair> {
    const pair = await this.createPair(user);
    await this.tokens.save(this.tokens.create(pair.entity));
    return pair.tokens;
  }

  private async createPair(
    user: User,
  ): Promise<{ tokens: TokenPair; jti: string; entity: Partial<RefreshToken> }> {
    const jti = randomUUID();
    const expiresIn = ttlSeconds(this.config.getOrThrow<string>('JWT_ACCESS_TTL'));
    const refreshTtl = ttlSeconds(this.config.getOrThrow<string>('JWT_REFRESH_TTL'));
    const base = { sub: user.id, email: user.email };
    const accessToken = await this.jwt.signAsync({ ...base, type: 'access' } satisfies JwtPayload, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn,
    });
    const refreshToken = await this.jwt.signAsync(
      { ...base, type: 'refresh', jti } satisfies JwtPayload,
      {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: refreshTtl,
      },
    );
    return {
      tokens: { accessToken, refreshToken, expiresIn },
      jti,
      entity: {
        userId: user.id,
        jti,
        tokenHash: await hash(refreshToken, 10),
        expiresAt: new Date(Date.now() + refreshTtl * 1000),
        revokedAt: null,
        replacedByJti: null,
      },
    };
  }

  private async verifyRefresh(token: string): Promise<JwtPayload & { jti: string }> {
    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
      if (payload.type !== 'refresh' || !payload.jti) throw new Error('invalid token type');
      return { ...payload, jti: payload.jti };
    } catch {
      this.logger.warn('auth refresh token rejected');
      throw new UnauthorizedException('Refresh token inválido');
    }
  }

  private isDuplicate(error: unknown): boolean {
    return (
      error instanceof QueryFailedError && (error.driverError as { code?: string }).code === '23505'
    );
  }
}
