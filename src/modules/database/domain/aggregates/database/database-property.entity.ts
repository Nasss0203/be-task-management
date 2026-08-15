import { PropertyType } from '../../enums/property-type.enum';
import { PropertyOption } from './property-option.entity';

export class DatabaseProperty {
  private options: PropertyOption[];

  constructor(
    readonly id: string,
    readonly databaseId: string,
    private name: string,
    readonly type: PropertyType,
    private position: string,
    options: PropertyOption[] = [],
  ) {
    this.validateName(name);
    this.validatePosition(position);
    this.validateOptions(type, options);

    this.name = name.trim();
    this.position = position.trim();
    this.options = [...options];
  }

  getId(): string {
    return this.id;
  }

  getDatabaseId(): string {
    return this.databaseId;
  }

  getName(): string {
    return this.name;
  }

  getType(): PropertyType {
    return this.type;
  }

  getPosition(): string {
    return this.position;
  }

  getOptions(): readonly PropertyOption[] {
    return [...this.options];
  }

  rename(name: string): void {
    this.validateName(name);
    this.name = name.trim();
  }

  changePosition(position: string): void {
    this.validatePosition(position);
    this.position = position.trim();
  }

  addOption(option: PropertyOption): void {
    if (!this.supportsOptions()) {
      throw new Error(`Property type ${this.type} does not support options`);
    }

    const duplicateName = this.options.some(
      (item) =>
        item.getName().trim().toLowerCase() ===
        option.getName().trim().toLowerCase(),
    );

    if (duplicateName) {
      throw new Error('Property option name already exists');
    }

    this.options.push(option);
  }

  private supportsOptions(): boolean {
    return [
      PropertyType.SELECT,
      PropertyType.MULTI_SELECT,
      PropertyType.STATUS,
    ].includes(this.type);
  }

  private validateName(name: string): void {
    if (!name.trim()) {
      throw new Error('Property name is required');
    }
  }

  private validatePosition(position: string): void {
    if (!position.trim()) {
      throw new Error('Property position is required');
    }
  }

  private validateOptions(type: PropertyType, options: PropertyOption[]): void {
    const supportsOptions = [
      PropertyType.SELECT,
      PropertyType.MULTI_SELECT,
      PropertyType.STATUS,
    ].includes(type);

    if (!supportsOptions && options.length > 0) {
      throw new Error(`Property type ${type} does not support options`);
    }

    const names = options.map((option) =>
      option.getName().trim().toLowerCase(),
    );

    if (new Set(names).size !== names.length) {
      throw new Error('Property option name already exists');
    }
  }
}
