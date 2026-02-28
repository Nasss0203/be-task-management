import { Workspace } from '../domain/entities/workspace.entity';
import { WorkspaceModel } from '../domain/models/workspaces.model';
import { WorkspaceResponseDto } from '../dto/response/workspaces.response.dto';

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

  static toEntity(model: WorkspaceModel): Workspace {
    const e = new Workspace();
    e.id = model.id;
    e.name = model.name;
    e.slug = model.slug;
    e.planType = model.planType;
    e.createdAt = model.createdAt;
    e.updatedAt = model.updatedAt;
    e.deletedAt = model.deletedAt;
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
      deletedAt: model.deletedAt,
    };
  }
}
