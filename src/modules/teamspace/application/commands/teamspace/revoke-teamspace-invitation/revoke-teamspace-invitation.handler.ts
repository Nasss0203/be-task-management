import { ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { TeamspacePermissionPolicy } from 'src/modules/permission/domain/policies/teamspace-permission.policy';
import { TeamspaceInvitationStatus } from 'src/modules/teamspace/domain/enums/teamspace-invitation-status.enum';
import { TeamspaceRole } from 'src/modules/teamspace/domain/enums/teamspace-role.enum';
import type { TeamspaceInvitationRepository } from 'src/modules/teamspace/domain/repositories/teamspace-invitation.repository';
import type { TeamspaceMemberRepository } from 'src/modules/teamspace/domain/repositories/teamspace-member.repository';
import type { TeamspaceRepository } from 'src/modules/teamspace/domain/repositories/teamspace.repository';
import { TEAMSPACE_TYPES } from 'src/modules/teamspace/teamspace.types';
import { WorkspaceRole } from 'src/modules/workspace/domain/enums/workspace-role.enum';
import type { WorkspaceMemberRepository } from 'src/modules/workspace/domain/repositories/workspace-member.repository';
import { WORKSPACE_TYPES } from 'src/modules/workspace/workspace.types';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import type { TeamspaceMembershipLock } from '../../../ports/teamspace-membership-lock.port';
import { RevokeTeamspaceInvitationCommand } from './revoke-teamspace-invitation.command';

@Injectable()
export class RevokeTeamspaceInvitationHandler {
  constructor(
    @Inject(TEAMSPACE_TYPES.repositories.TeamspaceRepository)
    private readonly teamspaceRepo: TeamspaceRepository,
    @Inject(TEAMSPACE_TYPES.repositories.TeamspaceMemberRepository)
    private readonly memberRepo: TeamspaceMemberRepository,
    @Inject(TEAMSPACE_TYPES.repositories.TeamspaceInvitationRepository)
    private readonly invitationRepo: TeamspaceInvitationRepository,
    @Inject(WORKSPACE_TYPES.repositories.WorkspaceMemberRepository)
    private readonly workspaceMemberRepo: WorkspaceMemberRepository,
    @Inject(TEAMSPACE_TYPES.ports.TeamspaceMembershipLock)
    private readonly membershipLock: TeamspaceMembershipLock,
    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(command: RevokeTeamspaceInvitationCommand): Promise<void> {
    const initial = await this.invitationRepo.findById(command.invitationId);
    if (!initial) throw new NotFoundException('Teamspace invitation not found');
    if (!(await this.teamspaceRepo.findById(initial.getTeamspaceId()))) {
      throw new NotFoundException('Teamspace not found');
    }
    if (!(await this.authorizationService.authorize({
      userId: command.userId,
      permissions: [PERMISSIONS.TEAMSPACE_MEMBER_ADD],
      target: { type: 'teamspace', id: initial.getTeamspaceId() },
    }))) {
      throw new ForbiddenException('You do not have permission to revoke teamspace invitations');
    }

    await this.uow.runInTransaction(async (context) => {
      await this.membershipLock.lockForMembershipChange(
        initial.getWorkspaceMemberId(), initial.getTeamspaceId(), command.userId, context,
      );
      const invitation = await this.invitationRepo.findByIdForUpdate(command.invitationId, context);
      if (!invitation || invitation.getTeamspaceId() !== initial.getTeamspaceId() ||
        invitation.getWorkspaceMemberId() !== initial.getWorkspaceMemberId()) {
        throw new NotFoundException('Teamspace invitation not found');
      }
      const teamspace = await this.teamspaceRepo.findById(invitation.getTeamspaceId(), context);
      if (!teamspace) throw new NotFoundException('Teamspace not found');
      const actor = await this.workspaceMemberRepo.findByWorkspaceAndUser(
        teamspace.getWorkspaceId(), command.userId, context,
      );
      const actorMember = actor
        ? await this.memberRepo.findByTeamspaceAndWorkspaceMember(teamspace.getId(), actor.getId(), context)
        : null;
      const actorRole = actor?.getRole() === WorkspaceRole.OWNER
        ? TeamspaceRole.OWNER : actorMember?.getRoleName();
      if (!actor || actor.isGuest() || !actorRole ||
        !TeamspacePermissionPolicy.hasPermission(actorRole, PERMISSIONS.TEAMSPACE_MEMBER_ADD)) {
        throw new ForbiddenException('You do not have permission to revoke teamspace invitations');
      }

      if (invitation.getStatus() === TeamspaceInvitationStatus.REVOKED) return;
      const now = new Date();
      if (!invitation.canAccept(now)) {
        throw new ConflictException('Teamspace invitation is no longer pending');
      }
      invitation.revoke(now);
      await this.invitationRepo.save(invitation, context);
    });
  }
}
