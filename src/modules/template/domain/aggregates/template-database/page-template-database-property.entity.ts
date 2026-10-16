import { randomUUID } from 'crypto';

import { PropertyType } from 'src/modules/database/domain/enums/property-type.enum';

import { PageTemplateDatabasePropertyOption } from './page-template-database-property-option.entity';

export type CreatePageTemplateDatabasePropertyParams = {
  id?: string;
  templateDatabaseId: string;

  name: string;
  type: PropertyType;

  isDefault?: boolean;
  isHideable?: boolean;
  position: string;

  options?: PageTemplateDatabasePropertyOption[];
};

export type RestorePageTemplateDatabasePropertyParams = {
  id: string;
  templateDatabaseId: string;

  name: string;
  type: PropertyType;

  isDefault: boolean;
  isHideable: boolean;
  position: string;

  options?: PageTemplateDatabasePropertyOption[];
};

export class PageTemplateDatabaseProperty {
  private options: PageTemplateDatabasePropertyOption[];

  private constructor(
    private readonly id: string,
    private readonly templateDatabaseId: string,
    private name: string,
    private readonly type: PropertyType,
    private readonly isDefault: boolean,
    private readonly isHideable: boolean,
    private position: string,
    options: PageTemplateDatabasePropertyOption[],
  ) {
    this.validateName(name);
    this.validatePosition(position);

    this.name = name.trim();
    this.position = position.trim();
    this.options = [...options];
  }

  static create(
    params: CreatePageTemplateDatabasePropertyParams,
  ): PageTemplateDatabaseProperty {
    return new PageTemplateDatabaseProperty(
      params.id ?? randomUUID(),
      params.templateDatabaseId,
      params.name,
      params.type,
      params.isDefault ?? false,
      params.isHideable ?? true,
      params.position,
      params.options ?? [],
    );
  }

  static restore(
    params: RestorePageTemplateDatabasePropertyParams,
  ): PageTemplateDatabaseProperty {
    return new PageTemplateDatabaseProperty(
      params.id,
      params.templateDatabaseId,
      params.name,
      params.type,
      params.isDefault,
      params.isHideable,
      params.position,
      params.options ?? [],
    );
  }

  getId(): string {
    return this.id;
  }

  getTemplateDatabaseId(): string {
    return this.templateDatabaseId;
  }

  getName(): string {
    return this.name;
  }

  getType(): PropertyType {
    return this.type;
  }

  getIsDefault(): boolean {
    return this.isDefault;
  }

  getIsHideable(): boolean {
    return this.isHideable;
  }

  getPosition(): string {
    return this.position;
  }

  getOptions(): readonly PageTemplateDatabasePropertyOption[] {
    return [...this.options];
  }

  addOption(option: PageTemplateDatabasePropertyOption): void {
    this.options.push(option);
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
}
