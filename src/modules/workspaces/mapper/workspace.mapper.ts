import { Workspace } from '../domain/entities/workspace.entity';
import { WorkspaceModel } from '../domain/models/workspaces.model';
import { WorkspaceResponseDto } from '../dto/response/workspaces.response.dto';
import type { SaveWorkspaceInput } from '../interfaces/repositories/workspace.repository.interface';

export class WorkspaceMapper {
  static toModel(entity: Workspace): WorkspaceModel {
    return new WorkspaceModel(
      entity.id,
      entity.name,
      entity.slug,
      entity.planType,
      entity.createdAt,
      entity.updatedAt,
      entity.deletedAt,
    );
  }

  /** Chấp nhận cả WorkspaceModel đủ field hoặc SaveWorkspaceInput (create mới, thiếu id/timestamps). */
  static toEntity(model: WorkspaceModel | SaveWorkspaceInput): Workspace {
    const e = new Workspace();
    if (model.id != null) e.id = model.id;
    e.name = model.name;
    e.slug = model.slug;
    e.planType = model.planType;
    if (model.createdAt != null) e.createdAt = model.createdAt;
    if (model.updatedAt != null) e.updatedAt = model.updatedAt;
    if (model.deletedAt !== undefined) e.deletedAt = model.deletedAt;
    return e;
  }

  static toResponse(model: WorkspaceModel): WorkspaceResponseDto {
    return {
      id: model.id,
      name: model.name,
      slug: model.slug,
      planType: model.planType,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }
}
