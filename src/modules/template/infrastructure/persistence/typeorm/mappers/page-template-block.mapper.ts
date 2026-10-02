import { PageTemplateBlock } from '../../../../domain/entities/page-template-block.entity';
import { PageTemplateBlockOrmEntity } from '../entities/page-template-block.orm-entity';

export class PageTemplateBlockMapper {
  static toDomain(entity: PageTemplateBlockOrmEntity): PageTemplateBlock {
    return PageTemplateBlock.restore({
      id: entity.id,
      versionId: entity.versionId,
      parentBlockId: entity.parentBlockId,
      type: entity.type,
      title: entity.title,
      positionX: entity.positionX,
      positionY: entity.positionY,
      width: entity.width,
      height: entity.height,
      orderIndex: entity.orderIndex,
      content: entity.content,
      styleConfig: entity.styleConfig,
      dataConfig: entity.dataConfig,
      createdBy: entity.createdBy,
      isOpen: entity.isOpen,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  static toOrm(domain: PageTemplateBlock): PageTemplateBlockOrmEntity {
    const entity = new PageTemplateBlockOrmEntity();
    entity.id = domain.getId();
    entity.versionId = domain.getVersionId();
    entity.parentBlockId = domain.getParentBlockId();
    entity.type = domain.getType();
    entity.title = domain.getTitle();
    entity.positionX = domain.getPositionX();
    entity.positionY = domain.getPositionY();
    entity.width = domain.getWidth();
    entity.height = domain.getHeight();
    entity.orderIndex = domain.getOrderIndex();
    entity.content = domain.getContent();
    entity.styleConfig = domain.getStyleConfig();
    entity.dataConfig = domain.getDataConfig();
    entity.createdBy = domain.getCreatedBy();
    entity.isOpen = domain.getIsOpen();
    entity.createdAt = domain.getCreatedAt();
    entity.updatedAt = domain.getUpdatedAt();
    return entity;
  }
}
