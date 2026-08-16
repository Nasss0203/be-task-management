import { PropertyType } from '../../enums/property-type.enum';
import { DuplicatePropertyOptionNameException } from '../../exceptions/duplicate-property-option-name.exception';
import { PropertyOptionNotFoundException } from '../../exceptions/property-option-not-found.exception';
import { PropertyName } from '../../value-objects/property-name.vo';
import { PropertyOption } from './property-option.entity';

export class DatabaseProperty {
  private options: PropertyOption[];
  private name: PropertyName;
  constructor(
    readonly id: string,
    readonly databaseId: string,
    name: string,
    readonly type: PropertyType,
    private position: string,
    options: PropertyOption[] = [],
  ) {
    this.validatePosition(position);
    this.validateOptions(type, options);

    this.name = PropertyName.create(name);
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
    return this.name.getValue();
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
    this.name = PropertyName.create(name);
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

  hasSameName(name: string): boolean {
    const otherName = PropertyName.create(name);

    return this.name.equals(otherName);
  }

  updateOption(
    optionId: string,
    name: string,
    color: string | null,
  ): PropertyOption {
    if (!this.supportsOptions()) {
      throw new Error(`Property type ${this.type} does not support options`);
    }

    const option = this.options.find((item) => item.getId() === optionId);

    if (!option) {
      throw new PropertyOptionNotFoundException();
    }

    const duplicateName = this.options.some(
      (item) =>
        item.getId() !== optionId &&
        item.getName().trim().toLowerCase() === name.trim().toLowerCase(),
    );

    if (duplicateName) {
      throw new DuplicatePropertyOptionNameException();
    }

    option.rename(name);
    option.changeColor(color);

    return option;
  }

  removeOption(optionId: string): PropertyOption {
    if (!this.supportsOptions()) {
      throw new Error(`Property type ${this.type} does not support options`);
    }

    const optionIndex = this.options.findIndex(
      (option) => option.getId() === optionId,
    );

    if (optionIndex === -1) {
      throw new PropertyOptionNotFoundException();
    }

    const [removedOption] = this.options.splice(optionIndex, 1);

    return removedOption;
  }

  private supportsOptions(): boolean {
    return [
      PropertyType.SELECT,
      PropertyType.MULTI_SELECT,
      PropertyType.STATUS,
    ].includes(this.type);
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
