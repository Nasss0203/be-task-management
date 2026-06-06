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
  planName?: string | null;
  planSlug?: string | null;
  status?: 'ACTIVE' | 'DELETED';
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;

  ownerName?: string | null;
  ownerEmail?: string | null;

  membersCount?: string | number | null;
  projectsCount?: string | number | null;
  boardsCount?: string | number | null;
  tasksCount?: string | number | null;
};
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
      planName: raw.planName ?? raw.plan,
      planSlug: raw.planSlug ?? raw.plan,
      status: raw.status ?? (raw.deletedAt ? 'DELETED' : 'ACTIVE'),
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt ?? null,

      ownerName: raw.ownerName ?? null,
      ownerEmail: raw.ownerEmail ?? null,

      membersCount: Number(raw.membersCount ?? 0),
      projectsCount: Number(raw.projectsCount ?? 0),
      boardsCount: Number(raw.boardsCount ?? 0),
      tasksCount: Number(raw.tasksCount ?? 0),
    };
  }
}
