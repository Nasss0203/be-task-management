import { TemplateReview } from '../../../../domain/entities/template-review.entity';
import { TemplateReviewOrmEntity } from '../entities/template-review.orm-entity';

export class TemplateReviewMapper {
  static toDomain(entity: TemplateReviewOrmEntity): TemplateReview {
    return TemplateReview.reconstitute({
      id: entity.id,
      templateId: entity.templateId,
      userId: entity.userId,
      versionId: entity.versionId,
      rating: entity.rating,
      body: entity.body,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  static toOrm(domain: TemplateReview): TemplateReviewOrmEntity {
    const entity = new TemplateReviewOrmEntity();

    entity.id = domain.getId();
    entity.templateId = domain.getTemplateId();
    entity.userId = domain.getUserId();
    entity.versionId = domain.getVersionId();
    entity.rating = domain.getRating();
    entity.body = domain.getBody();
    entity.createdAt = domain.getCreatedAt();
    entity.updatedAt = domain.getUpdatedAt();

    return entity;
  }
}
