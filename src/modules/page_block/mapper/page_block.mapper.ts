import { PageBlock } from '../domain/entities/page_block.entity';
import { PageBlockModel } from '../domain/models/page_block.model';
import { PageBlockResponseDto } from '../dto/response/page_block.response.dto';
import { SavePageBlockInput } from '../interfaces/repositories/create.page_block.repository.interface';

export class PageBlockMapper {
  static toModel(entity: PageBlock): PageBlockModel {
    return new PageBlockModel(
      entity.id,
      entity.page_id,
      entity.type,
      entity.title ?? null,
      entity.position_x ?? null,
      entity.position_y ?? null,
      entity.width ?? null,
      entity.height ?? null,
      entity.order_index,
      entity.content ?? null,
      entity.style_config ?? null,
      entity.data_config ?? null,
      entity.created_by,
      entity.is_open,
      entity.created_at,
      entity.updated_at,
    );
  }

  static toEntity(model: PageBlockModel | SavePageBlockInput): PageBlock {
    const e = new PageBlock();

    if ('id' in model && model.id != null) {
      e.id = model.id;
    }

    e.page_id = model.page_id;
    e.type = model.type;
    e.title = model.title ?? null;
    e.position_x = model.position_x ?? null;
    e.position_y = model.position_y ?? null;
    e.width = model.width ?? null;
    e.height = model.height ?? null;
    e.order_index = model.order_index ?? 0;
    e.content = model.content ?? null;
    e.style_config = model.style_config ?? null;
    e.data_config = model.data_config ?? null;
    e.created_by = model.created_by;

    if ('created_at' in model && model.created_at != null) {
      e.created_at = model.created_at;
    }

    if ('updated_at' in model && model.updated_at != null) {
      e.updated_at = model.updated_at;
    }

    return e;
  }

  static toResponse(model: PageBlockModel): PageBlockResponseDto {
    return {
      id: model.id,
      page_id: model.page_id,
      type: model.type,
      title: model.title,
      position_x: model.position_x,
      position_y: model.position_y,
      width: model.width,
      height: model.height,
      order_index: model.order_index,
      content: model.content,
      style_config: model.style_config,
      data_config: model.data_config,
      created_by: model.created_by,
      is_open: model.is_open,
      created_at: model.created_at,
      updated_at: model.updated_at,
    };
  }
}
