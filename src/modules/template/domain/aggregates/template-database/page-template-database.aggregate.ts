import { randomUUID } from 'crypto';

import { PageTemplateDatabaseProperty } from './page-template-database-property.entity';
import { PageTemplateDatabaseRow } from './page-template-database-row.entity';
import { PageTemplateDatabaseView } from './page-template-database-view.entity';

export type CreatePageTemplateDatabaseParams = {
  id?: string;
  versionId: string;
  name: string;

  properties?: PageTemplateDatabaseProperty[];
  rows?: PageTemplateDatabaseRow[];
  views?: PageTemplateDatabaseView[];
};

export type RestorePageTemplateDatabaseParams = {
  id: string;
  versionId: string;
  name: string;

  properties?: PageTemplateDatabaseProperty[];
  rows?: PageTemplateDatabaseRow[];
  views?: PageTemplateDatabaseView[];
};

export class PageTemplateDatabase {
  private properties: PageTemplateDatabaseProperty[];
  private rows: PageTemplateDatabaseRow[];
  private views: PageTemplateDatabaseView[];

  private constructor(
    private readonly id: string,
    private readonly versionId: string,
    private name: string,
    properties: PageTemplateDatabaseProperty[],
    rows: PageTemplateDatabaseRow[],
    views: PageTemplateDatabaseView[],
  ) {
    this.validateName(name);

    this.name = name.trim();
    this.properties = [...properties];
    this.rows = [...rows];
    this.views = [...views];
  }

  static create(
    params: CreatePageTemplateDatabaseParams,
  ): PageTemplateDatabase {
    return new PageTemplateDatabase(
      params.id ?? randomUUID(),
      params.versionId,
      params.name,
      params.properties ?? [],
      params.rows ?? [],
      params.views ?? [],
    );
  }

  static restore(
    params: RestorePageTemplateDatabaseParams,
  ): PageTemplateDatabase {
    return new PageTemplateDatabase(
      params.id,
      params.versionId,
      params.name,
      params.properties ?? [],
      params.rows ?? [],
      params.views ?? [],
    );
  }

  getId(): string {
    return this.id;
  }

  getVersionId(): string {
    return this.versionId;
  }

  getName(): string {
    return this.name;
  }

  getProperties(): readonly PageTemplateDatabaseProperty[] {
    return [...this.properties];
  }

  getRows(): readonly PageTemplateDatabaseRow[] {
    return [...this.rows];
  }

  getViews(): readonly PageTemplateDatabaseView[] {
    return [...this.views];
  }

  rename(name: string): void {
    this.validateName(name);

    this.name = name.trim();
  }

  addProperty(property: PageTemplateDatabaseProperty): void {
    this.properties.push(property);
  }

  addRow(row: PageTemplateDatabaseRow): void {
    this.rows.push(row);
  }

  addView(view: PageTemplateDatabaseView): void {
    this.views.push(view);
  }

  private validateName(name: string): void {
    if (!name.trim()) {
      throw new Error('Template database name is required');
    }
  }
}
