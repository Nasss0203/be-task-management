import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { TeamspacePermissionPolicy } from 'src/modules/permission/domain/policies/teamspace-permission.policy';
import { TeamspaceRole } from 'src/modules/teamspace/domain/enums/teamspace-role.enum';
import type { TeamspaceInviteLinkRepository } from 'src/modules/teamspace/domain/repositories/teamspace-invite-link.repository';
import type { TeamspaceMemberRepository } from 'src/modules/teamspace/domain/repositories/teamspace-member.repository';
import type { TeamspaceRepository } from 'src/modules/teamspace/domain/repositories/teamspace.repository';
import { TEAMSPACE_TYPES } from 'src/modules/teamspace/teamspace.types';
import { WorkspaceRole } from 'src/modules/workspace/domain/enums/workspace-role.enum';
import type { WorkspaceMemberRepository } from 'src/modules/workspace/domain/repositories/workspace-member.repository';
import { WORKSPACE_TYPES } from 'src/modules/workspace/workspace.types';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import type { TeamspaceMembershipLock } from '../../../ports/teamspace-membership-lock.port';
import { RevokeTeamspaceInviteLinkCommand } from './revoke-teamspace-invite-link.command';

@Injectable()
export class RevokeTeamspaceInviteLinkHandler {
  constructor(
    @Inject(TEAMSPACE_TYPES.repositories.TeamspaceRepository)
    private readonly teamspaceRepo: TeamspaceRepository,
    @Inject(TEAMSPACE_TYPES.repositories.TeamspaceMemberRepository)
    private readonly memberRepo: TeamspaceMemberRepository,
    @Inject(TEAMSPACE_TYPES.repositories.TeamspaceInviteLinkRepository)
    private readonly linkRepo: TeamspaceInviteLinkRepository,
    @Inject(WORKSPACE_TYPES.repositories.WorkspaceMemberRepository)
    private readonly workspaceMemberRepo: WorkspaceMemberRepository,
    @Inject(TEAMSPACE_TYPES.ports.TeamspaceMembershipLock)
    private readonly membershipLock: TeamspaceMembershipLock,
    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(command: RevokeTeamspaceInviteLinkCommand): Promise<void> {
    if (!(await this.teamspaceRepo.findById(command.teamspaceId))) {
      throw new NotFoundException('Teamspace not found');
    }
    if (!(await this.authorizationService.authorize({
      userId: command.userId,
      permissions: [PERMISSIONS.TEAMSPACE_MEMBER_ADD],
      target: { type: 'teamspace', id: command.teamspaceId },
    }))) {
      throw new ForbiddenException('You do not have permission to revoke teamspace invite links');
    }

    await this.uow.runInTransaction(async (context) => {
      const preliminaryTeamspace = await this.teamspaceRepo.findById(command.teamspaceId, context);
      if (!preliminaryTeamspace) throw new NotFoundException('Teamspace not found');
      const preliminaryActor = await this.workspaceMemberRepo.findByWorkspaceAndUser(
        preliminaryTeamspace.getWorkspaceId(), command.userId, context,
      );
      if (!preliminaryActor) throw new ForbiddenException('Workspace membership required');
      await this.membershipLock.lockForMembershipChange(
        preliminaryActor.getId(), command.teamspaceId, command.userId, context,
      );
      const link = await this.linkRepo.findByIdForUpdate(command.linkId, context);
      if (!link || link.getTeamspaceId() !== command.teamspaceId) {
        throw new NotFoundException('Teamspace invite link not found');
      }
      const teamspace = await this.teamspaceRepo.findById(command.teamspaceId, context);
      if (!teamspace) throw new NotFoundException('Teamspace not found');
      const actor = await this.workspaceMemberRepo.findByWorkspaceAndUser(
        teamspace.getWorkspaceId(), command.userId, context,
      );
      const actorMember = actor
        ? await this.memberRepo.findByTeamspaceAndWorkspaceMember(
            command.teamspaceId, actor.getId(), context,
          )
        : null;
      const actorRole = actor?.getRole() === WorkspaceRole.OWNER
        ? TeamspaceRole.OWNER : actorMember?.getRoleName();
      if (!actor || actor.getId() !== preliminaryActor.getId() || actor.isGuest() || !actorRole ||
        !TeamspacePermissionPolicy.hasPermission(actorRole, PERMISSIONS.TEAMSPACE_MEMBER_ADD)) {
        throw new ForbiddenException('You do not have permission to revoke teamspace invite links');
      }
      link.revoke();
      await this.linkRepo.save(link, context);
    });
  }
}
