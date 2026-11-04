import type { FormAnswerKey } from 'src/modules/content/domain/entities/form-answer-key.entity';
import type { RowValueData } from 'src/modules/database/domain/aggregates/row/row-value.type';

export class FormAnswerKeyResponseDto {
  field_block_id: string;
  correct_value: RowValueData;
  points: number;

  static fromDomain(key: FormAnswerKey): FormAnswerKeyResponseDto {
    return {
      field_block_id: key.getFieldBlockId(),
      correct_value: key.getCorrectValue(),
      points: key.getPoints(),
    };
  }

  static removed(fieldBlockId: string): FormAnswerKeyResponseDto {
    return { field_block_id: fieldBlockId, correct_value: null, points: 0 };
  }
}
