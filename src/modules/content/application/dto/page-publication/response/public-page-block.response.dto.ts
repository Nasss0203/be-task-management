import { PageBlock } from 'src/modules/content/domain/entities/page-block.entity';
import type {
  PageBlockJson,
  PageBlockStyleConfig,
} from 'src/shared/domain/page-block.types';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';

export class PublicPageBlockResponseDto {
  id: string;
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

  is_open: boolean;

  static fromDomain(block: PageBlock): PublicPageBlockResponseDto {
    const dto = new PublicPageBlockResponseDto();

    dto.id = block.getId();
    dto.parent_block_id = block.getParentBlockId();

    dto.type = block.getType();
    dto.title = block.getTitle();

    dto.position_x = block.getPositionX();
    dto.position_y = block.getPositionY();
    dto.width = block.getWidth();
    dto.height = block.getHeight();

    dto.order_index = block.getOrderIndex();

    // DATABASE_VIEW configuration is workspace-only; public rendering is unsupported.
    dto.content =
      block.getType() === PageBlockType.DATABASE_VIEW
        ? null
        : block.getContent();
    dto.style_config = block.getStyleConfig();
    dto.data_config =
      block.getType() === PageBlockType.DATABASE_VIEW
        ? null
        : block.getDataConfig();

    dto.is_open = block.getIsOpen();

    return dto;
  }
}
