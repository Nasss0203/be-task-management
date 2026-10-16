import { randomUUID } from 'crypto';

import type { RowValueData } from 'src/modules/database/domain/aggregates/row/row-value.type';

export type CreatePageTemplateDatabaseRowValueParams = {
  id?: string;
  templateRowId: string;
  templatePropertyId: string;
  value: RowValueData;
};

export type RestorePageTemplateDatabaseRowValueParams = {
  id: string;
  templateRowId: string;
  templatePropertyId: string;
  value: RowValueData;
};

export class PageTemplateDatabaseRowValue {
  private constructor(
    private readonly id: string,
    private readonly templateRowId: string,
    private readonly templatePropertyId: string,
    private value: RowValueData,
  ) {}

  static create(
    params: CreatePageTemplateDatabaseRowValueParams,
  ): PageTemplateDatabaseRowValue {
    return new PageTemplateDatabaseRowValue(
      params.id ?? randomUUID(),
      params.templateRowId,
      params.templatePropertyId,
      params.value,
    );
  }

  static restore(
    params: RestorePageTemplateDatabaseRowValueParams,
  ): PageTemplateDatabaseRowValue {
    return new PageTemplateDatabaseRowValue(
      params.id,
      params.templateRowId,
      params.templatePropertyId,
      params.value,
    );
  }

  getId(): string {
    return this.id;
  }

  getTemplateRowId(): string {
    return this.templateRowId;
  }

  getTemplatePropertyId(): string {
    return this.templatePropertyId;
  }

  getValue(): RowValueData {
    return this.value;
  }
}
