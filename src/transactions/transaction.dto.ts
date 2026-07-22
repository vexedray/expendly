import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { PageQueryDto } from '../common/dto/page-query.dto';
import { TransactionStatus } from './transaction.entity';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export class TransactionQueryDto extends PageQueryDto {
  @IsOptional() @IsUUID() categoriaId?: string;
  @IsOptional() @IsUUID() creditCardId?: string;
  @IsOptional() @IsEnum(TransactionStatus) status?: TransactionStatus;
  @IsOptional() @Matches(DATE) @IsDateString({ strict: true }) dataInicio?: string;
  @IsOptional() @Matches(DATE) @IsDateString({ strict: true }) dataFim?: string;
}

export class UpdateTransactionDto {
  @IsOptional() @ValidateIf((_object, value: unknown) => value !== null) @IsUUID() categoriaId?:
    string | null;
  @IsOptional()
  @ValidateIf((_object, value: unknown) => value !== null)
  @IsString()
  @MaxLength(160)
  descricao?: string | null;
  @IsOptional() @ValidateIf((_object, value: unknown) => value !== null) @IsUUID() creditCardId?:
    string | null;
}
