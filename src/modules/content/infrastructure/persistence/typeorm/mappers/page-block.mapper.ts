import { PageBlock } from 'src/modules/content/domain/entities/page-block.entity';
import { PageBlockOrmEntity } from '../entities/page-block.orm-entity';

export class PageBlockMapper {
  static toDomain(orm: PageBlockOrmEntity): PageBlock {
    return PageBlock.restore({
      id: orm.id,
      pageId: orm.page_id,
      parentBlockId: orm.parent_block_id,
      type: orm.type,
      title: orm.title,
      positionX: orm.position_x,
      positionY: orm.position_y,
      width: orm.width,
      height: orm.height,
      orderIndex: orm.order_index,
      content: orm.content,
      styleConfig: orm.style_config,
      dataConfig: orm.data_config,
      createdBy: orm.created_by,
      isOpen: orm.is_open,
      createdAt: orm.created_at,
      updatedAt: orm.updated_at,
      deletedAt: orm.deleted_at,
      deletedBy: orm.deleted_by,
    });
  }

  static toOrm(domain: PageBlock): PageBlockOrmEntity {
    const orm = new PageBlockOrmEntity();
    orm.id = domain.getId();
    orm.page_id = domain.getPageId();
    orm.parent_block_id = domain.getParentBlockId();
    orm.type = domain.getType();
    orm.title = domain.getTitle();
    orm.position_x = domain.getPositionX();
    orm.position_y = domain.getPositionY();
    orm.width = domain.getWidth();
    orm.height = domain.getHeight();
    orm.order_index = domain.getOrderIndex();
    orm.content = domain.getContent();
    orm.style_config = domain.getStyleConfig();
    orm.data_config = domain.getDataConfig();
    orm.created_by = domain.getCreatedBy();
    orm.is_open = domain.getIsOpen();
    orm.created_at = domain.getCreatedAt();
    orm.updated_at = domain.getUpdatedAt();
    orm.deleted_at = domain.getDeletedAt();
    orm.deleted_by = domain.getDeletedBy();
    return orm;
  }
}
