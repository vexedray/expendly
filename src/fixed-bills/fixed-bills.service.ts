import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PinoLogger } from 'nestjs-pino';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Page, pageResult } from '../common/dto/page-query.dto';
import { CreateFixedBillDto, FixedBillQueryDto, UpdateFixedBillDto } from './fixed-bill.dto';
import { FixedBill } from './fixed-bill.entity';

@Injectable()
export class FixedBillsService {
  constructor(
    @InjectRepository(FixedBill) private readonly repository: Repository<FixedBill>,
    private readonly logger: PinoLogger,
  ) {}

  async create(userId: string, dto: CreateFixedBillDto): Promise<FixedBill> {
    const saved = await this.repository.save(
      this.repository.create({
        ...dto,
        userId,
        nome: dto.nome.trim(),
        valor: Number(dto.valor),
        ativo: dto.ativo ?? true,
      }),
    );
    this.logger.info({ userId, fixedBillId: saved.id }, 'fixed bill created');
    return saved;
  }

  async list(userId: string, query: FixedBillQueryDto): Promise<Page<FixedBill>> {
    const where: FindOptionsWhere<FixedBill> = {
      userId,
      ...(query.ativo === undefined ? {} : { ativo: query.ativo }),
    };
    const [data, total] = await this.repository.findAndCount({
      where,
      order: { diaVencimento: 'ASC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
    return pageResult(data, total, query);
  }

  async get(userId: string, id: string): Promise<FixedBill> {
    const bill = await this.repository.findOneBy({ id, userId });
    if (!bill) throw new NotFoundException('Conta fixa não encontrada');
    return bill;
  }

  async update(userId: string, id: string, dto: UpdateFixedBillDto): Promise<FixedBill> {
    const bill = await this.get(userId, id);
    this.repository.merge(bill, {
      ...dto,
      nome: dto.nome === undefined ? bill.nome : dto.nome.trim(),
      valor: dto.valor === undefined ? bill.valor : Number(dto.valor),
    });
    const saved = await this.repository.save(bill);
    this.logger.info({ userId, fixedBillId: id }, 'fixed bill updated');
    return saved;
  }

  async remove(userId: string, id: string): Promise<void> {
    const result = await this.repository.delete({ id, userId });
    if (!result.affected) throw new NotFoundException('Conta fixa não encontrada');
    this.logger.info({ userId, fixedBillId: id }, 'fixed bill deleted');
  }
}
