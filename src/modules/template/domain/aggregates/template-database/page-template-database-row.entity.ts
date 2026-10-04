import { randomUUID } from 'crypto';

import { PageTemplateDatabaseRowValue } from './page-template-database-row-value.entity';

export type CreatePageTemplateDatabaseRowParams = {
  id?: string;
  templateDatabaseId: string;
  values?: PageTemplateDatabaseRowValue[];
};

export type RestorePageTemplateDatabaseRowParams = {
  id: string;
  templateDatabaseId: string;
  values?: PageTemplateDatabaseRowValue[];
};

export class PageTemplateDatabaseRow {
  private values: PageTemplateDatabaseRowValue[];

  private constructor(
    private readonly id: string,
    private readonly templateDatabaseId: string,
    values: PageTemplateDatabaseRowValue[],
  ) {
    this.values = [...values];
  }

  static create(
    params: CreatePageTemplateDatabaseRowParams,
  ): PageTemplateDatabaseRow {
    return new PageTemplateDatabaseRow(
      params.id ?? randomUUID(),
      params.templateDatabaseId,
      params.values ?? [],
    );
  }

  static restore(
    params: RestorePageTemplateDatabaseRowParams,
  ): PageTemplateDatabaseRow {
    return new PageTemplateDatabaseRow(
      params.id,
      params.templateDatabaseId,
      params.values ?? [],
    );
  }

  getId(): string {
    return this.id;
  }

  getTemplateDatabaseId(): string {
    return this.templateDatabaseId;
  }

  getValues(): readonly PageTemplateDatabaseRowValue[] {
    return [...this.values];
  }

  addValue(value: PageTemplateDatabaseRowValue): void {
    this.values.push(value);
  }
}
