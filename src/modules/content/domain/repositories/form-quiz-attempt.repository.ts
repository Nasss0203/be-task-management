import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

import type { FormQuizAttempt } from '../entities/form-quiz-attempt.entity';

export interface FormQuizAttemptRepository {
  findBySectionAndUser(
    sectionBlockId: string,
    userId: string,
    context?: PersistenceContext,
  ): Promise<FormQuizAttempt[]>;

  save(
    attempt: FormQuizAttempt,
    context?: PersistenceContext,
  ): Promise<FormQuizAttempt>;
}
