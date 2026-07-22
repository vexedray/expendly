import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import { IsOptionalField } from '../common/decorators/optional-field.decorator';
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
  @IsOptionalField({ nullable: true })
  @IsUUID()
  categoriaId?: string | null;

  @IsOptionalField({ nullable: true })
  @IsString()
  @MaxLength(160)
  descricao?: string | null;

  @IsOptionalField({ nullable: true })
  @IsUUID()
  creditCardId?: string | null;
}
