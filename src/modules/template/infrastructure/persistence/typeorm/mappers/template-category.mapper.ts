import { TemplateCategory } from '../../../../domain/aggregates/template-category/template-category.aggregate';
import { TemplateCategoryOrmEntity } from '../entities/template-category.orm-entity';

export class TemplateCategoryMapper {
  static toDomain(entity: TemplateCategoryOrmEntity): TemplateCategory {
    return TemplateCategory.restore({
      id: entity.id,
      name: entity.name,
      slug: entity.slug,
      description: entity.description,
      isActive: entity.isActive,
      sortOrder: entity.sortOrder,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  static toOrm(domain: TemplateCategory): TemplateCategoryOrmEntity {
    const entity = new TemplateCategoryOrmEntity();
    entity.id = domain.getId();
    entity.name = domain.getName();
    entity.slug = domain.getSlug();
    entity.description = domain.getDescription();
    entity.isActive = domain.getIsActive();
    entity.sortOrder = domain.getSortOrder();
    entity.createdAt = domain.getCreatedAt();
    entity.updatedAt = domain.getUpdatedAt();
    return entity;
  }
}
