import { Teamspace } from 'src/modules/workspace/domain/aggregates/teamspace/teamspace.aggregate';

import { TeamspaceOrmEntity } from '../entities/teamspace.orm-entity';

export class TeamspaceMapper {
  static toDomain(orm: TeamspaceOrmEntity): Teamspace {
    return Teamspace.restore({
      id: orm.id,
      workspaceId: orm.workspaceId,

      name: orm.name,
      slug: orm.slug,
      description: orm.description,
      icon: orm.icon,
      visibility: orm.visibility,

      createdBy: orm.createdBy,

      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,

      deletedAt: orm.deletedAt,
      deletedBy: orm.deletedBy,
    });
  }

  static toOrm(domain: Teamspace): TeamspaceOrmEntity {
    const orm = new TeamspaceOrmEntity();

    orm.id = domain.getId();
    orm.workspaceId = domain.getWorkspaceId();

    orm.name = domain.getName();
    orm.slug = domain.getSlug();
    orm.description = domain.getDescription();
    orm.icon = domain.getIcon();
    orm.visibility = domain.getVisibility();

    orm.createdBy = domain.getCreatedBy();

    orm.createdAt = domain.getCreatedAt();
    orm.updatedAt = domain.getUpdatedAt();

    orm.deletedAt = domain.getDeletedAt();
    orm.deletedBy = domain.getDeletedBy();

    return orm;
  }
}
