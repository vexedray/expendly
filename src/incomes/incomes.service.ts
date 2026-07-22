import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PinoLogger } from 'nestjs-pino';
import { Repository } from 'typeorm';
import { Page, pageResult } from '../common/dto/page-query.dto';
import { CreateIncomeDto, IncomeQueryDto, UpdateIncomeDto } from './income.dto';
import { Income } from './income.entity';

@Injectable()
export class IncomesService {
  constructor(
    @InjectRepository(Income) private readonly repository: Repository<Income>,
    private readonly logger: PinoLogger,
  ) {}

  async create(userId: string, dto: CreateIncomeDto): Promise<Income> {
    const saved = await this.repository.save(
      this.repository.create({ ...dto, userId, nome: dto.nome.trim(), valor: Number(dto.valor) }),
    );
    this.logger.info({ userId, incomeId: saved.id }, 'income created');
    return saved;
  }

  async list(userId: string, query: IncomeQueryDto): Promise<Page<Income>> {
    const qb = this.repository
      .createQueryBuilder('income')
      .where('income.userId = :userId', { userId });
    if (query.tipo) qb.andWhere('income.tipo = :tipo', { tipo: query.tipo });
    if (query.recorrencia)
      qb.andWhere('income.recorrencia = :recorrencia', { recorrencia: query.recorrencia });
    if (query.dataInicio)
      qb.andWhere('income.dataRecebimento >= :dataInicio', { dataInicio: query.dataInicio });
    if (query.dataFim)
      qb.andWhere('income.dataRecebimento <= :dataFim', { dataFim: query.dataFim });
    const [data, total] = await qb
      .orderBy('income.dataRecebimento', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();
    return pageResult(data, total, query);
  }

  async get(userId: string, id: string): Promise<Income> {
    const income = await this.repository.findOneBy({ id, userId });
    if (!income) throw new NotFoundException('Receita não encontrada');
    return income;
  }

  async update(userId: string, id: string, dto: UpdateIncomeDto): Promise<Income> {
    const income = await this.get(userId, id);
    this.repository.merge(income, {
      ...dto,
      nome: dto.nome === undefined ? income.nome : dto.nome.trim(),
      valor: dto.valor === undefined ? income.valor : Number(dto.valor),
    });
    const saved = await this.repository.save(income);
    this.logger.info({ userId, incomeId: id }, 'income updated');
    return saved;
  }

  async remove(userId: string, id: string): Promise<void> {
    const result = await this.repository.delete({ id, userId });
    if (!result.affected) throw new NotFoundException('Receita não encontrada');
    this.logger.info({ userId, incomeId: id }, 'income deleted');
  }
}
