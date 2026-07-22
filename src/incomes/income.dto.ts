import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  Matches,
  ValidateIf,
} from 'class-validator';
import { PageQueryDto } from '../common/dto/page-query.dto';
import { IncomeRecurrence, IncomeType } from './income.entity';

const MONEY = /^(?:0\.(?:0[1-9]|[1-9]\d?)|[1-9]\d{0,11}(?:\.\d{1,2})?)$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export class CreateIncomeDto {
  @IsEnum(IncomeType) tipo!: IncomeType;
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(1, 120)
  nome!: string;
  @Matches(MONEY) valor!: string;
  @IsEnum(IncomeRecurrence) recorrencia!: IncomeRecurrence;
  @Matches(DATE) @IsDateString({ strict: true }) dataRecebimento!: string;
}

export class UpdateIncomeDto {
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsEnum(IncomeType)
  tipo?: IncomeType;
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(1, 120)
  nome?: string;
  @ValidateIf((_object, value: unknown) => value !== undefined) @Matches(MONEY) valor?: string;
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsEnum(IncomeRecurrence)
  recorrencia?: IncomeRecurrence;
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @Matches(DATE)
  @IsDateString({ strict: true })
  dataRecebimento?: string;
}

export class IncomeQueryDto extends PageQueryDto {
  @IsOptional() @IsEnum(IncomeType) tipo?: IncomeType;
  @IsOptional() @IsEnum(IncomeRecurrence) recorrencia?: IncomeRecurrence;
  @IsOptional() @Matches(DATE) @IsDateString({ strict: true }) dataInicio?: string;
  @IsOptional() @Matches(DATE) @IsDateString({ strict: true }) dataFim?: string;
}
