import { PageBlock } from 'src/modules/content/domain/entities/page-block.entity';
import type {
  PageBlockJson,
  PageBlockStyleConfig,
} from 'src/shared/domain/page-block.types';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';

/** Bảng chỉ đọc của database nằm trên chính page được publish. */
export interface PublicDatabaseDto {
  id: string;
  name: string;
  view: {
    id: string;
    name: string;
    type: string;
    properties: { propertyId: string; position: string; visible: boolean }[];
  };
  properties: {
    id: string;
    name: string;
    type: string;
    isHideable: boolean;
    position: string;
    options: { id: string; name: string; color: string | null }[];
  }[];
  rows: { id: string; values: { propertyId: string; value: unknown }[] }[];
}

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

  /** Chỉ có ở DATABASE_VIEW; null khi database không thuộc page này. */
  database?: PublicDatabaseDto | null;

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

    // DATABASE_VIEW config is workspace-only; the public table comes from `database` instead.
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
