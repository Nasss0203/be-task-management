import { WorkspaceMember } from 'src/modules/workspace/domain/aggregates/workspace-member/workspace-member.aggregate';
import { WorkspaceMemberOrmEntity } from '../entities/workspace-member.orm-entity';

export class WorkspaceMemberMapper {
  static toDomain(entity: WorkspaceMemberOrmEntity): WorkspaceMember {
    return WorkspaceMember.restore({
      id: entity.id,
      workspaceId: entity.workspaceId,
      userId: entity.userId,
      role: entity.roleName,
      joinedAt: entity.joinedAt,
      lastOpenedAt: entity.lastOpenedAt ?? null,
    });
  }

  static toOrm(model: WorkspaceMember): WorkspaceMemberOrmEntity {
    const e = new WorkspaceMemberOrmEntity();

    e.id = model.getId();
    e.userId = model.getUserId();
    e.workspaceId = model.getWorkspaceId();
    e.roleName = model.getRole();
    e.joinedAt = model.getJoinedAt();
    e.lastOpenedAt = model.getLastOpenedAt();

    return e;
  }
}
