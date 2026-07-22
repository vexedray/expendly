import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length } from 'class-validator';
import { IsOptionalField } from '../common/decorators/optional-field.decorator';

export class UpdateMeDto {
  @IsOptionalField()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(2, 100)
  nome?: string;

  @IsOptionalField()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  email?: string;
}
