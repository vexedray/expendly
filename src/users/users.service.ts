import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PinoLogger } from 'nestjs-pino';
import { QueryFailedError, Repository } from 'typeorm';
import { PublicUser } from '../auth/auth.dto';
import { UpdateMeDto } from './user.dto';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly logger: PinoLogger,
  ) {}

  async me(userId: string): Promise<PublicUser> {
    const user = await this.find(userId);
    return this.public(user);
  }

  async update(userId: string, dto: UpdateMeDto): Promise<PublicUser> {
    const user = await this.find(userId);
    if (dto.nome !== undefined) user.nome = dto.nome.trim();
    if (dto.email !== undefined) user.email = dto.email.trim().toLowerCase();
    try {
      const saved = await this.users.save(user);
      this.logger.info({ userId }, 'user updated');
      return this.public(saved);
    } catch (error: unknown) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === '23505'
      ) {
        throw new ConflictException('E-mail já cadastrado');
      }
      throw error;
    }
  }

  private async find(userId: string): Promise<User> {
    const user = await this.users.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  private public(user: User): PublicUser {
    return {
      id: user.id,
      nome: user.nome,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
