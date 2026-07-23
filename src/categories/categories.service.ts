import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PinoLogger } from 'nestjs-pino';
import { QueryFailedError, Repository } from 'typeorm';
import { Transaction } from '../transactions/transaction.entity';
import { Category } from './category.entity';
import { CreateCategoryDto, UpdateCategoryDto } from './category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category) private readonly repository: Repository<Category>,
    @InjectRepository(Transaction) private readonly transactions: Repository<Transaction>,
    private readonly logger: PinoLogger,
  ) {}

  async create(userId: string, dto: CreateCategoryDto): Promise<Category> {
    const category = this.repository.create({ userId, nome: this.normalize(dto.nome) });
    try {
      const saved = await this.repository.save(category);
      this.logger.info({ userId, categoryId: saved.id }, 'category created');
      return saved;
    } catch (error: unknown) {
      if (this.isDuplicate(error)) throw new ConflictException('Categoria já cadastrada');
      throw error;
    }
  }

  list(userId: string): Promise<Category[]> {
    return this.repository.find({ where: { userId }, order: { nome: 'ASC' } });
  }

  async get(userId: string, id: string): Promise<Category> {
    const category = await this.repository.findOneBy({ id, userId });
    if (!category) throw new NotFoundException('Categoria não encontrada');
    return category;
  }

  async update(userId: string, id: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.get(userId, id);
    category.nome = this.normalize(dto.nome);
    try {
      const saved = await this.repository.save(category);
      this.logger.info({ userId, categoryId: id }, 'category updated');
      return saved;
    } catch (error: unknown) {
      if (this.isDuplicate(error)) throw new ConflictException('Categoria já cadastrada');
      throw error;
    }
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.get(userId, id);
    if (await this.transactions.existsBy({ categoriaId: id })) {
      throw new ConflictException({
        error: 'CATEGORY_HAS_LINKED_TRANSACTIONS',
        message: 'Categoria possui transações vinculadas',
      });
    }
    try {
      await this.repository.delete({ id, userId });
    } catch (error: unknown) {
      if (this.isForeignKeyViolation(error)) {
        throw new ConflictException({
          error: 'CATEGORY_HAS_LINKED_TRANSACTIONS',
          message: 'Categoria possui transações vinculadas',
        });
      }
      throw error;
    }
    this.logger.info({ userId, categoryId: id }, 'category deleted');
  }

  private normalize(nome: string): string {
    return nome.trim().toUpperCase();
  }

  private isDuplicate(error: unknown): boolean {
    return (
      error instanceof QueryFailedError && (error.driverError as { code?: string }).code === '23505'
    );
  }

  private isForeignKeyViolation(error: unknown): boolean {
    return (
      error instanceof QueryFailedError && (error.driverError as { code?: string }).code === '23503'
    );
  }
}
