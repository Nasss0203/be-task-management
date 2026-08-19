import { PageTemplateBlock } from 'src/modules/content/domain/entities/page-template-block.entity';
import { PageTemplateBlockOrmEntity } from '../entities/page-template-block.orm-entity';

export class PageTemplateBlockMapper {
  static toDomain(orm: PageTemplateBlockOrmEntity): PageTemplateBlock {
    return PageTemplateBlock.restore({
      id: orm.id,
      templateId: orm.templateId,
      parentBlockId: orm.parentBlockId,
      type: orm.type,
      content: orm.content,
      orderIndex: orm.orderIndex,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
      deletedAt: orm.deletedAt,
    });
  }

  static toOrm(domain: PageTemplateBlock): PageTemplateBlockOrmEntity {
    const orm = new PageTemplateBlockOrmEntity();
    orm.id = domain.getId();
    orm.templateId = domain.getTemplateId();
    orm.parentBlockId = domain.getParentBlockId();
    orm.type = domain.getType();
    orm.content = domain.getContent();
    orm.orderIndex = domain.getOrderIndex();
    orm.createdAt = domain.getCreatedAt();
    orm.updatedAt = domain.getUpdatedAt();
    orm.deletedAt = domain.getDeletedAt();
    return orm;
  }
}
