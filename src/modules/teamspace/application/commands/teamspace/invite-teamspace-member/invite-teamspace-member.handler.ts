import {
  ConflictException, ForbiddenException, Inject, Injectable, NotFoundException,
} from '@nestjs/common';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { TeamspacePermissionPolicy } from 'src/modules/permission/domain/policies/teamspace-permission.policy';
import { TeamspaceInvitationResponseDto } from 'src/modules/teamspace/application/dto/teamspace/response/teamspace-invitation.response.dto';
import { TeamspaceInvitation } from 'src/modules/teamspace/domain/entities/teamspace-invitation.entity';
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
import { InviteTeamspaceMemberCommand } from './invite-teamspace-member.command';

@Injectable()
export class InviteTeamspaceMemberHandler {
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

  async execute(command: InviteTeamspaceMemberCommand): Promise<TeamspaceInvitationResponseDto> {
    if (!(await this.teamspaceRepo.findById(command.teamspaceId))) {
      throw new NotFoundException('Teamspace not found');
    }
    if (!(await this.authorizationService.authorize({
      userId: command.userId,
      permissions: [PERMISSIONS.TEAMSPACE_MEMBER_ADD],
      target: { type: 'teamspace', id: command.teamspaceId },
    }))) {
      throw new ForbiddenException('You do not have permission to invite teamspace members');
    }

    const invitation = await this.uow.runInTransaction(async (context) => {
      await this.membershipLock.lockForMembershipChange(
        command.workspaceMemberId, command.teamspaceId, command.userId, context,
      );

      const teamspace = await this.teamspaceRepo.findById(command.teamspaceId, context);
      if (!teamspace) throw new NotFoundException('Teamspace not found');

      const actor = await this.workspaceMemberRepo.findByWorkspaceAndUser(
        teamspace.getWorkspaceId(), command.userId, context,
      );
      const actorTeamspaceMember = actor
        ? await this.memberRepo.findByTeamspaceAndWorkspaceMember(
            command.teamspaceId, actor.getId(), context,
          )
        : null;
      const actorRole = actor?.getRole() === WorkspaceRole.OWNER
        ? TeamspaceRole.OWNER
        : actorTeamspaceMember?.getRoleName();
      if (!actor || actor.isGuest() || !actorRole ||
        !TeamspacePermissionPolicy.hasPermission(actorRole, PERMISSIONS.TEAMSPACE_MEMBER_ADD)) {
        throw new ForbiddenException('You do not have permission to invite teamspace members');
      }

      const target = await this.workspaceMemberRepo.findById(command.workspaceMemberId, context);
      if (!target || target.getWorkspaceId() !== teamspace.getWorkspaceId()) {
        throw new NotFoundException('Workspace member not found');
      }
      if (target.isGuest()) {
        throw new ForbiddenException('Guest memberships cannot be invited to a teamspace');
      }
      if (await this.memberRepo.exists(command.teamspaceId, target.getId(), context)) {
        throw new ConflictException('Workspace member already belongs to teamspace');
      }

      const pending = await this.invitationRepo.findPendingByTeamspaceAndWorkspaceMember(
        command.teamspaceId, target.getId(), context,
      );
      if (pending) {
        if (pending.getEffectiveStatus() === TeamspaceInvitationStatus.PENDING) {
          throw new ConflictException('A pending teamspace invitation already exists');
        }
        pending.expire();
        await this.invitationRepo.save(pending, context);
      }

      return this.invitationRepo.save(TeamspaceInvitation.create({
        teamspaceId: command.teamspaceId,
        workspaceMemberId: target.getId(),
        invitedBy: command.userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }), context);
    });

    return TeamspaceInvitationResponseDto.fromDomain(invitation);
  }
}
