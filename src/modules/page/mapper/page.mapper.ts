import { PageBlock } from 'src/modules/page_block/domain/entities/page_block.entity';
import { Page } from '../domain/entities/page.entity';
import { PageModel } from '../domain/models/page.model';
import { PageResponseDto } from '../dto/response/page.response.dto';
import { SavePageInput } from '../interfaces/repositories/page.repository.interface';

export class PageMapper {
  static toModel(entity: Page): PageModel {
    return new PageModel(
      entity.id,
      entity.workspace_id,
      entity.slug ?? null,
      entity.title,
      entity.icon ?? null,
      entity.cover_url ?? null,
      entity.is_template,
      entity.created_by,
      entity.blocks ?? ([] as PageBlock[]),
      entity.createdAt,
      entity.updatedAt,

      entity.deletedAt ?? null,
      entity.deletedBy ?? null,
    );
  }

  static toEntity(model: PageModel | SavePageInput): Page {
    const e = new Page();

    if (model.id != null) e.id = model.id;

    e.workspace_id = model.workspace_id;
    e.slug = model.slug ?? null;
    e.title = model.title;
    if ('icon' in model) e.icon = model.icon ?? null;
    if ('cover_url' in model) e.cover_url = model.cover_url ?? null;

    if (model.blocks != null) e.blocks = model.blocks;
    if (model.is_template != null) e.is_template = model.is_template;
    if (model.created_by != null) e.created_by = model.created_by;
    if (model.createdAt != null) e.createdAt = model.createdAt;
    if (model.updatedAt != null) e.updatedAt = model.updatedAt;

    if ('deletedAt' in model && model.deletedAt !== undefined) {
      e.deletedAt = model.deletedAt ?? null;
    }

    if ('deletedBy' in model && model.deletedBy !== undefined) {
      e.deletedBy = model.deletedBy ?? null;
    }

    return e;
  }

  static toResponse(model: PageModel): PageResponseDto {
    return {
      id: model.id,
      blocks: model.blocks,
      title: model.title,
      slug: model.slug,
      icon: model.icon,
      cover_url: model.cover_url,
      is_template: model.is_template,
      workspace_id: model.workspace_id,
      created_by: model.created_by,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,

      deletedAt: model.deletedAt,
      deletedBy: model.deletedBy,
    };
  }
}
