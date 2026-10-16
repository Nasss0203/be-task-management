import { PageBlockType } from 'src/shared/domain/page-block-type.enum';
import type {
  PageBlockJson,
  PageBlockStyleConfig,
} from 'src/shared/domain/page-block.types';

import { PageTemplateBlock } from '../../../domain/entities/page-template-block.entity';

export class PageTemplateBlockResponseDto {
  id: string;
  version_id: string;
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

  static fromDomain(block: PageTemplateBlock): PageTemplateBlockResponseDto {
    const dto = new PageTemplateBlockResponseDto();

    dto.id = block.getId();
    dto.version_id = block.getVersionId();
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

    return dto;
  }
}
