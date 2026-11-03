import { FormAnswerKey } from 'src/modules/content/domain/entities/form-answer-key.entity';

import { FormAnswerKeyOrmEntity } from '../entities/form-answer-key.orm-entity';

export class FormAnswerKeyMapper {
  static toDomain(entity: FormAnswerKeyOrmEntity): FormAnswerKey {
    return FormAnswerKey.create({
      fieldBlockId: entity.field_block_id,
      correctValue: entity.correct_value,
      points: entity.points,
    });
  }

  static toOrm(answerKey: FormAnswerKey): FormAnswerKeyOrmEntity {
    const entity = new FormAnswerKeyOrmEntity();

    entity.field_block_id = answerKey.getFieldBlockId();
    entity.correct_value = answerKey.getCorrectValue();
    entity.points = answerKey.getPoints();

    return entity;
  }
}
