import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { PersistenceContext } from 'src/shared/domain/persistence-context';
import { EntityManager, Repository } from 'typeorm';

import { TemplateReview } from '../../../../domain/entities/template-review.entity';
import type { TemplateReviewRepository } from '../../../../domain/repositories/template-review.repository';
import { TemplateReviewOrmEntity } from '../entities/template-review.orm-entity';
import { TemplateReviewMapper } from '../mappers/template-review.mapper';

@Injectable()
export class TypeOrmTemplateReviewRepository implements TemplateReviewRepository {
  constructor(
    @InjectRepository(TemplateReviewOrmEntity)
    private readonly repository: Repository<TemplateReviewOrmEntity>,
  ) {}

  private getRepository(
    context?: PersistenceContext,
  ): Repository<TemplateReviewOrmEntity> {
    return context
      ? (context as EntityManager).getRepository(TemplateReviewOrmEntity)
      : this.repository;
  }

  async findByTemplateAndUser(
    templateId: string,
    userId: string,
    context?: PersistenceContext,
  ): Promise<TemplateReview | null> {
    const entity = await this.getRepository(context).findOne({
      where: { templateId, userId },
    });

    return entity ? TemplateReviewMapper.toDomain(entity) : null;
  }

  async save(
    review: TemplateReview,
    context?: PersistenceContext,
  ): Promise<TemplateReview> {
    const entity = TemplateReviewMapper.toOrm(review);

    await this.getRepository(context)
      .createQueryBuilder()
      .insert()
      .into(TemplateReviewOrmEntity)
      .values({
        id: entity.id,
        templateId: entity.templateId,
        userId: entity.userId,
        versionId: entity.versionId,
        rating: entity.rating,
        body: entity.body,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
      })
      .orUpdate(
        ['version_id', 'rating', 'body', 'updated_at'],
        ['template_id', 'user_id'],
      )
      .execute();

    const saved = await this.findByTemplateAndUser(
      entity.templateId,
      entity.userId,
      context,
    );

    if (!saved) {
      throw new Error('Template review was not saved');
    }

    return saved;
  }

  async deleteByTemplateAndUser(
    templateId: string,
    userId: string,
    context?: PersistenceContext,
  ): Promise<boolean> {
    const result = await this.getRepository(context).delete({
      templateId,
      userId,
    });

    return (result.affected ?? 0) > 0;
  }
}
