import { WorkspaceInvite } from 'src/modules/workspace/domain/aggregates/workspace-invite/workspace-invite.aggregate';
import { WorkspaceInviteOrmEntity } from '../entities/workspace-invite.orm-entity';

export class WorkspaceInviteMapper {
  static toDomain(entity: WorkspaceInviteOrmEntity): WorkspaceInvite {
    return WorkspaceInvite.restore({
      id: entity.id,
      workspaceId: entity.workspaceId,
      userId: entity.userId ?? null,
      email: entity.email ?? null,
      type: entity.type,
      roleName: entity.roleName,
      invitedBy: entity.invitedBy,
      token: entity.token,
      status: entity.status,
      acceptedAt: entity.acceptedAt ?? null,
      expiresAt: entity.expiresAt,
      maxUses: entity.maxUses ?? null,
      usedCount: entity.usedCount,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  static toOrm(model: WorkspaceInvite): WorkspaceInviteOrmEntity {
    const e = new WorkspaceInviteOrmEntity();

    e.id = model.getId();
    e.workspaceId = model.getWorkspaceId();
    e.userId = model.getUserId();
    e.email = model.getEmail();
    e.type = model.getType();
    e.roleName = model.getRoleName();
    e.invitedBy = model.getInvitedBy();
    e.token = model.getToken();
    e.status = model.getStatus();
    e.acceptedAt = model.getAcceptedAt();
    e.expiresAt = model.getExpiresAt();
    e.maxUses = model.getMaxUses();
    e.usedCount = model.getUsedCount();
    e.createdAt = model.getCreatedAt();
    e.updatedAt = model.getUpdatedAt();

    return e;
  }
}
