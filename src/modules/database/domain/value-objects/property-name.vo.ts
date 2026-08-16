import { InvalidPropertyNameException } from '../exceptions/invalid-property-name.exception';

export class PropertyName {
  private constructor(private readonly value: string) {}

  static create(value: string): PropertyName {
    const normalizedValue = value.trim();

    if (!normalizedValue) {
      throw new InvalidPropertyNameException('Property name is required');
    }

    if (normalizedValue.length > 255) {
      throw new InvalidPropertyNameException(
        'Property name must not exceed 255 characters',
      );
    }

    return new PropertyName(normalizedValue);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: PropertyName): boolean {
    return this.value.toLowerCase() === other.value.toLowerCase();
  }
}
