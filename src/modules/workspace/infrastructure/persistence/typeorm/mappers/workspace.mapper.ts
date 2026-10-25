import { Workspace } from 'src/modules/workspace/domain/aggregates/workspace/workspace.aggregate';
import { WorkspaceOrmEntity } from '../entities/workspace.orm-entity';

export class WorkspaceMapper {
  static toDomain(entity: WorkspaceOrmEntity): Workspace {
    return Workspace.restore({
      id: entity.id,
      name: entity.name,
      slug: entity.slug,
      icon: entity.icon ?? null,
      layoutMode: entity.layoutMode,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt ?? null,
      deletedBy: entity.deletedBy ?? null,
      createdBy: entity.createdBy ?? null,
    });
  }

  static toOrm(model: Workspace): WorkspaceOrmEntity {
    const e = new WorkspaceOrmEntity();

    e.id = model.getId();

    e.name = model.getName();
    e.slug = model.getSlug();
    e.icon = model.getIcon();
    e.layoutMode = model.getLayoutMode();
    e.createdAt = model.getCreatedAt();
    e.updatedAt = model.getUpdatedAt();
    e.deletedAt = model.getDeletedAt();
    e.deletedBy = model.getDeletedBy();
    e.createdBy = model.getCreatedBy();

    return e;
  }
}
