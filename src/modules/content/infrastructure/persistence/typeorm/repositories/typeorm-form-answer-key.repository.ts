import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, In, Repository } from 'typeorm';

import type { FormAnswerKey } from 'src/modules/content/domain/entities/form-answer-key.entity';
import type { FormAnswerKeyRepository } from 'src/modules/content/domain/repositories/form-answer-key.repository';

import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

import { FormAnswerKeyOrmEntity } from '../entities/form-answer-key.orm-entity';
import { FormAnswerKeyMapper } from '../mappers/form-answer-key.mapper';

@Injectable()
export class TypeOrmFormAnswerKeyRepository implements FormAnswerKeyRepository {
  constructor(private readonly dataSource: DataSource) {}

  private resolveRepo(
    context?: PersistenceContext,
  ): Repository<FormAnswerKeyOrmEntity> {
    if (context) {
      const manager = context as EntityManager;

      return manager.getRepository(FormAnswerKeyOrmEntity);
    }

    return this.dataSource.getRepository(FormAnswerKeyOrmEntity);
  }

  async findByFieldBlockIds(
    fieldBlockIds: string[],
    context?: PersistenceContext,
  ): Promise<FormAnswerKey[]> {
    if (fieldBlockIds.length === 0) return [];

    const repo = this.resolveRepo(context);

    const entities = await repo.find({
      where: {
        field_block_id: In(fieldBlockIds),
      },
    });

    return entities.map((entity) => FormAnswerKeyMapper.toDomain(entity));
  }

  async save(
    answerKey: FormAnswerKey,
    context?: PersistenceContext,
  ): Promise<FormAnswerKey> {
    const repo = this.resolveRepo(context);

    const saved = await repo.save(FormAnswerKeyMapper.toOrm(answerKey));

    return FormAnswerKeyMapper.toDomain(saved);
  }

  async deleteByFieldBlockId(
    fieldBlockId: string,
    context?: PersistenceContext,
  ): Promise<void> {
    const repo = this.resolveRepo(context);

    await repo.delete({
      field_block_id: fieldBlockId,
    });
  }
}
