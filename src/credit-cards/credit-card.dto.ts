import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { IsOptionalField } from '../common/decorators/optional-field.decorator';
import { PageQueryDto } from '../common/dto/page-query.dto';
import { CreditCardType } from './credit-card.entity';

export class CreateCreditCardDto {
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(1, 80)
  nome!: string;

  @IsInt()
  @Min(1)
  @Max(31)
  diaFechamento!: number;

  @IsInt()
  @Min(1)
  @Max(31)
  diaVencimento!: number;

  @IsOptionalField()
  @IsEnum(CreditCardType)
  tipo?: CreditCardType;

  @IsOptionalField()
  @IsBoolean()
  ativo?: boolean;
}

export class UpdateCreditCardDto {
  @IsOptionalField()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(1, 80)
  nome?: string;

  @IsOptionalField()
  @IsInt()
  @Min(1)
  @Max(31)
  diaFechamento?: number;

  @IsOptionalField()
  @IsInt()
  @Min(1)
  @Max(31)
  diaVencimento?: number;

  @IsOptionalField()
  @IsEnum(CreditCardType)
  tipo?: CreditCardType;

  @IsOptionalField()
  @IsBoolean()
  ativo?: boolean;
}

export class CreditCardQueryDto extends PageQueryDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean()
  ativo?: boolean;

  @IsOptional()
  @IsEnum(CreditCardType)
  tipo?: CreditCardType;
}
