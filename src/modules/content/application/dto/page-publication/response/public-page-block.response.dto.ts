import {
  PageBlock,
  PageBlockJson,
  PageBlockStyleConfig,
  PageBlockType,
} from 'src/modules/content/domain/entities/page-block.entity';

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

    dto.content = block.getContent();
    dto.style_config = block.getStyleConfig();
    dto.data_config = block.getDataConfig();

    dto.is_open = block.getIsOpen();

    return dto;
  }
}
