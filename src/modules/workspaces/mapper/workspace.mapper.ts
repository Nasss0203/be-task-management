import { AdminWorkspaceItemResponseDto } from 'src/modules/admin/dto/response/dashboard/workspace-overview.response.dto';
import { Workspace } from '../domain/entities/workspace.entity';
import { WorkspaceModel } from '../domain/models/workspaces.model';
import { WorkspaceResponseDto } from '../dto/response/workspaces.response.dto';
import type { SaveWorkspaceInput } from '../interfaces/repositories/create-workspace.repository.interface';
type AdminWorkspaceRaw = {
  id: string;
  name: string;
  slug: string;
  plan: WorkspaceModel['planType'];
  createdAt: Date;
  updatedAt: Date;
  owner?: string | null;
  membersCount?: string | number | null;
  projectsCount?: string | number | null;
  tasksCount?: string | number | null;
  userCount?: string | number | null;
};
export class WorkspaceMapper {
  static toModel(entity: Workspace): WorkspaceModel {
    return new WorkspaceModel(
      entity.id,
      entity.name,
      entity.slug,
      entity.planType,
      entity.createdAt,
      entity.updatedAt,
      entity.deletedAt ?? null,
      entity.deletedBy ?? null,
    );
  }

  static toEntity(model: WorkspaceModel | SaveWorkspaceInput): Workspace {
    const e = new Workspace();

    if (model.id != null) e.id = model.id;

    e.name = model.name;
    e.slug = model.slug;
    e.planType = model.planType;

    if (model.createdAt != null) e.createdAt = model.createdAt;
    if (model.updatedAt != null) e.updatedAt = model.updatedAt;

    if (model.deletedAt !== undefined) {
      e.deletedAt = model.deletedAt ?? null;
    }

    if ('deletedBy' in model && model.deletedBy !== undefined) {
      e.deletedBy = model.deletedBy ?? null;
    }

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
      deletedBy: model.deletedBy,
    };
  }
  static toAdminWorkspaceItemResponse(
    raw: AdminWorkspaceRaw,
  ): AdminWorkspaceItemResponseDto {
    return {
      id: raw.id,
      name: raw.name,
      slug: raw.slug,
      plan: raw.plan,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      owner: raw.owner ?? undefined,
      membersCount: Number(raw.membersCount ?? 0),
      projectsCount: Number(raw.projectsCount ?? 0),
      tasksCount: Number(raw.tasksCount ?? 0),
      userCount: Number(raw.userCount ?? 0),
    };
  }
}
