import type { RowValueData } from 'src/modules/database/domain/aggregates/row/row-value.type';

export class FormAnswerKey {
  private constructor(
    private readonly fieldBlockId: string,
    private readonly correctValue: RowValueData,
    private readonly points: number,
  ) {}

  static create(params: {
    fieldBlockId: string;
    correctValue: RowValueData;
    points: number;
  }): FormAnswerKey {
    return new FormAnswerKey(
      params.fieldBlockId,
      params.correctValue,
      params.points,
    );
  }

  getFieldBlockId(): string {
    return this.fieldBlockId;
  }

  getCorrectValue(): RowValueData {
    return this.correctValue;
  }

  getPoints(): number {
    return this.points;
  }
}
