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
      entity.title,
      entity.position_x,
      entity.position_y,
      entity.width,
      entity.height,
      entity.order_index,
      entity.style_config ?? null,
      entity.data_config ?? null,
      entity.created_by,
      entity.created_at,
      entity.updated_at,
    );
  }

  static toEntity(model: PageBlockModel | SavePageBlockInput): PageBlock {
    const e = new PageBlock();

    if ('id' in model && model.id != null) e.id = model.id;

    e.page_id = model.page_id;
    e.type = model.type;
    e.title = model.title;
    e.position_x = model.position_x;
    e.position_y = model.position_y;
    e.width = model.width;
    e.height = model.height;
    e.order_index = model.order_index;
    e.style_config = model.style_config ?? null;
    e.data_config = model.data_config ?? null;

    if ('created_by' in model && model.created_by != null) {
      e.created_by = model.created_by;
    }

    if ('createdAt' in model && model.created_at != null) {
      e.created_at = model.created_at;
    }

    if ('updatedAt' in model && model.updated_at != null) {
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
      style_config: model.style_config,
      data_config: model.data_config,
      created_by: model.created_by,
      created_at: model.created_at,
      updated_at: model.updated_at,
    };
  }
}
