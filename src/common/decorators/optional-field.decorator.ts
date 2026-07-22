import { ValidateIf } from 'class-validator';

interface OptionalFieldOptions {
  nullable?: boolean;
}

export function IsOptionalField(options: OptionalFieldOptions = {}): PropertyDecorator {
  return ValidateIf(
    (_object, value: unknown) => value !== undefined && !(options.nullable && value === null),
  );
}
