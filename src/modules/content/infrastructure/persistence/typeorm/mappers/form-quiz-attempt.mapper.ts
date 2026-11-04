import { FormQuizAttempt } from 'src/modules/content/domain/entities/form-quiz-attempt.entity';

import { FormQuizAttemptOrmEntity } from '../entities/form-quiz-attempt.orm-entity';

export class FormQuizAttemptMapper {
  static toDomain(entity: FormQuizAttemptOrmEntity): FormQuizAttempt {
    return FormQuizAttempt.restore({
      id: entity.id,
      sectionBlockId: entity.section_block_id,
      userId: entity.user_id,
      attemptNo: entity.attempt_no,
      rowId: entity.row_id,
      score: entity.score,
      maxScore: entity.max_score,
      results: entity.results,
      createdAt: entity.created_at,
    });
  }

  static toOrm(attempt: FormQuizAttempt): FormQuizAttemptOrmEntity {
    const entity = new FormQuizAttemptOrmEntity();

    entity.id = attempt.getId();
    entity.section_block_id = attempt.getSectionBlockId();
    entity.user_id = attempt.getUserId();
    entity.attempt_no = attempt.getAttemptNo();
    entity.row_id = attempt.getRowId();
    entity.score = attempt.getScore();
    entity.max_score = attempt.getMaxScore();
    entity.results = attempt.getResults();
    entity.created_at = attempt.getCreatedAt();

    return entity;
  }
}
