import { Workspace } from '../domain/entities/workspace.entity';
import { WorkspaceModel } from '../domain/models/workspaces.model';
import { WorkspaceResponseDto } from '../dto/response/workspaces.response.dto';
import type { SaveWorkspaceInput } from '../interfaces/repositories/create-workspace.repository.interface';

export class WorkspaceMapper {
  static toModel(entity: Workspace): WorkspaceModel {
    return new WorkspaceModel(
      entity.id,
      entity.name,
      entity.slug,
      entity.planType,
      entity.layoutMode,
      entity.createdAt,
      entity.updatedAt,
      entity.deletedAt ?? null,
      entity.deletedBy ?? null,
      entity.createdBy ?? null,
    );
  }

  static toEntity(model: WorkspaceModel | SaveWorkspaceInput): Workspace {
    const e = new Workspace();

    if (model.id != null) e.id = model.id;

    e.name = model.name;
    e.slug = model.slug;
    e.planType = model.planType;
    e.layoutMode = model.layoutMode;

    if (model.createdAt != null) e.createdAt = model.createdAt;
    if (model.updatedAt != null) e.updatedAt = model.updatedAt;

    if (model.deletedAt !== undefined) {
      e.deletedAt = model.deletedAt ?? null;
    }

    if ('deletedBy' in model && model.deletedBy !== undefined) {
      e.deletedBy = model.deletedBy ?? null;
    }

    if ('createdBy' in model && model.createdBy !== undefined) {
      e.createdBy = model.createdBy ?? null;
    }

    return e;
  }

  static toResponse(model: WorkspaceModel): WorkspaceResponseDto {
    return {
      id: model.id,
      name: model.name,
      slug: model.slug,
      planType: model.planType,
      layoutMode: model.layoutMode,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
      deletedAt: model.deletedAt,
      deletedBy: model.deletedBy,
      createdBy: model.createdBy,
    };
  }
}
