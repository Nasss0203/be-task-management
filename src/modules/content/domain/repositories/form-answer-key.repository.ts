import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

import type { FormAnswerKey } from '../entities/form-answer-key.entity';

export interface FormAnswerKeyRepository {
  findByFieldBlockIds(
    fieldBlockIds: string[],
    context?: PersistenceContext,
  ): Promise<FormAnswerKey[]>;

  save(
    answerKey: FormAnswerKey,
    context?: PersistenceContext,
  ): Promise<FormAnswerKey>;

  deleteByFieldBlockId(
    fieldBlockId: string,
    context?: PersistenceContext,
  ): Promise<void>;
}
