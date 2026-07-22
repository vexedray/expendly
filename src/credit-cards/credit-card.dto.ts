import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { PageQueryDto } from '../common/dto/page-query.dto';
import { CreditCardType } from './credit-card.entity';

export class CreateCreditCardDto {
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(1, 80)
  nome!: string;
  @IsInt() @Min(1) @Max(31) diaFechamento!: number;
  @IsInt() @Min(1) @Max(31) diaVencimento!: number;
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsEnum(CreditCardType)
  tipo?: CreditCardType;
  @ValidateIf((_object, value: unknown) => value !== undefined) @IsBoolean() ativo?: boolean;
}

export class UpdateCreditCardDto {
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(1, 80)
  nome?: string;
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsInt()
  @Min(1)
  @Max(31)
  diaFechamento?: number;
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsInt()
  @Min(1)
  @Max(31)
  diaVencimento?: number;
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsEnum(CreditCardType)
  tipo?: CreditCardType;
  @ValidateIf((_object, value: unknown) => value !== undefined) @IsBoolean() ativo?: boolean;
}

export class CreditCardQueryDto extends PageQueryDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean()
  ativo?: boolean;
  @IsOptional() @IsEnum(CreditCardType) tipo?: CreditCardType;
}
