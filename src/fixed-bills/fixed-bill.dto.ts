import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Length, Matches, Max, Min } from 'class-validator';
import { IsOptionalField } from '../common/decorators/optional-field.decorator';
import { PageQueryDto } from '../common/dto/page-query.dto';
const MONEY = /^(?:0\.(?:0[1-9]|[1-9]\d?)|[1-9]\d{0,11}(?:\.\d{1,2})?)$/;

export class CreateFixedBillDto {
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(1, 120)
  nome!: string;

  @Matches(MONEY)
  valor!: string;

  @IsInt()
  @Min(1)
  @Max(31)
  diaVencimento!: number;

  @IsOptionalField()
  @IsBoolean()
  ativo?: boolean;
}

export class UpdateFixedBillDto {
  @IsOptionalField()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(1, 120)
  nome?: string;

  @IsOptionalField()
  @Matches(MONEY)
  valor?: string;

  @IsOptionalField()
  @IsInt()
  @Min(1)
  @Max(31)
  diaVencimento?: number;

  @IsOptionalField()
  @IsBoolean()
  ativo?: boolean;
}

export class FixedBillQueryDto extends PageQueryDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean()
  ativo?: boolean;
}
