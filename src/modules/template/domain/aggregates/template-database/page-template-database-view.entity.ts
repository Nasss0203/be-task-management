import { randomUUID } from 'crypto';

import { DatabaseViewType } from 'src/modules/database/domain/enums/database-view-type.enum';

import { PageTemplateDatabaseViewProperty } from './page-template-database-view-property.entity';

export type CreatePageTemplateDatabaseViewParams = {
  id?: string;
  templateDatabaseId: string;
  name: string;
  type: DatabaseViewType;
  position: string;
  properties?: PageTemplateDatabaseViewProperty[];
};

export type RestorePageTemplateDatabaseViewParams = {
  id: string;
  templateDatabaseId: string;
  name: string;
  type: DatabaseViewType;
  position: string;
  properties?: PageTemplateDatabaseViewProperty[];
};

export class PageTemplateDatabaseView {
  private properties: PageTemplateDatabaseViewProperty[];

  private constructor(
    private readonly id: string,
    private readonly templateDatabaseId: string,
    private name: string,
    private readonly type: DatabaseViewType,
    private position: string,
    properties: PageTemplateDatabaseViewProperty[],
  ) {
    this.validateName(name);
    this.validatePosition(position);

    this.name = name.trim();
    this.position = position.trim();
    this.properties = [...properties];
  }

  static create(
    params: CreatePageTemplateDatabaseViewParams,
  ): PageTemplateDatabaseView {
    return new PageTemplateDatabaseView(
      params.id ?? randomUUID(),
      params.templateDatabaseId,
      params.name,
      params.type,
      params.position,
      params.properties ?? [],
    );
  }

  static restore(
    params: RestorePageTemplateDatabaseViewParams,
  ): PageTemplateDatabaseView {
    return new PageTemplateDatabaseView(
      params.id,
      params.templateDatabaseId,
      params.name,
      params.type,
      params.position,
      params.properties ?? [],
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

  getType(): DatabaseViewType {
    return this.type;
  }

  getPosition(): string {
    return this.position;
  }

  getProperties(): readonly PageTemplateDatabaseViewProperty[] {
    return [...this.properties];
  }

  addProperty(property: PageTemplateDatabaseViewProperty): void {
    this.properties.push(property);
  }

  private validateName(name: string): void {
    if (!name.trim()) {
      throw new Error('Database view name is required');
    }
  }

  private validatePosition(position: string): void {
    if (!position.trim()) {
      throw new Error('Database view position is required');
    }
  }
}
