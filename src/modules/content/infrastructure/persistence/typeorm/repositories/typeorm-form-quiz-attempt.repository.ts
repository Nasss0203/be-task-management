import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';

import type { FormQuizAttempt } from 'src/modules/content/domain/entities/form-quiz-attempt.entity';
import type { FormQuizAttemptRepository } from 'src/modules/content/domain/repositories/form-quiz-attempt.repository';

import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

import { FormQuizAttemptOrmEntity } from '../entities/form-quiz-attempt.orm-entity';
import { FormQuizAttemptMapper } from '../mappers/form-quiz-attempt.mapper';

@Injectable()
export class TypeOrmFormQuizAttemptRepository implements FormQuizAttemptRepository {
  constructor(private readonly dataSource: DataSource) {}

  private resolveRepo(
    context?: PersistenceContext,
  ): Repository<FormQuizAttemptOrmEntity> {
    if (context) {
      const manager = context as EntityManager;

      return manager.getRepository(FormQuizAttemptOrmEntity);
    }

    return this.dataSource.getRepository(FormQuizAttemptOrmEntity);
  }

  async findBySectionAndUser(
    sectionBlockId: string,
    userId: string,
    context?: PersistenceContext,
  ): Promise<FormQuizAttempt[]> {
    const repo = this.resolveRepo(context);

    const entities = await repo.find({
      where: {
        section_block_id: sectionBlockId,
        user_id: userId,
      },
      order: {
        attempt_no: 'ASC',
      },
    });

    return entities.map((entity) => FormQuizAttemptMapper.toDomain(entity));
  }

  async save(
    attempt: FormQuizAttempt,
    context?: PersistenceContext,
  ): Promise<FormQuizAttempt> {
    const repo = this.resolveRepo(context);

    const saved = await repo.save(FormQuizAttemptMapper.toOrm(attempt));

    return FormQuizAttemptMapper.toDomain(saved);
  }
}
