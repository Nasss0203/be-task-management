import {
  PageBlock,
  PageBlockJson,
  PageBlockStyleConfig,
  PageBlockType,
} from 'src/modules/content/domain/entities/page-block.entity';

export class PageBlockResponseDto {
  id: string;
  page_id: string;
  parent_block_id: string | null;
  type: PageBlockType;
  title: string | null;
  position_x: number | null;
  position_y: number | null;
  width: number | null;
  height: number | null;
  order_index: number;
  content: PageBlockJson;
  style_config: PageBlockStyleConfig;
  data_config: PageBlockJson;
  created_by: string;
  is_open: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  deleted_by: string | null;

  static fromDomain(block: PageBlock): PageBlockResponseDto {
    const dto = new PageBlockResponseDto();
    dto.id = block.getId();
    dto.page_id = block.getPageId();
    dto.parent_block_id = block.getParentBlockId();
    dto.type = block.getType();
    dto.title = block.getTitle();
    dto.position_x = block.getPositionX();
    dto.position_y = block.getPositionY();
    dto.width = block.getWidth();
    dto.height = block.getHeight();
    dto.order_index = block.getOrderIndex();
    dto.content = block.getContent();
    dto.style_config = block.getStyleConfig();
    dto.data_config = block.getDataConfig();
    dto.created_by = block.getCreatedBy();
    dto.is_open = block.getIsOpen();
    dto.created_at = block.getCreatedAt();
    dto.updated_at = block.getUpdatedAt();
    dto.deleted_at = block.getDeletedAt();
    dto.deleted_by = block.getDeletedBy();
    return dto;
  }
}
