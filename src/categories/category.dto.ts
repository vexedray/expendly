import { Transform } from 'class-transformer';
import { IsString, Length } from 'class-validator';

export class CreateCategoryDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @Length(1, 80)
  nome!: string;
}

export class UpdateCategoryDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @Length(1, 80)
  nome!: string;
}
