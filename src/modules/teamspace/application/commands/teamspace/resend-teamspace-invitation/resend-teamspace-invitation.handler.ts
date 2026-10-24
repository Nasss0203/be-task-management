import { ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { TeamspacePermissionPolicy } from 'src/modules/permission/domain/policies/teamspace-permission.policy';
import { TeamspaceInvitationResponseDto } from 'src/modules/teamspace/application/dto/teamspace/response/teamspace-invitation.response.dto';
import { TEAMSPACE_INVITATION_LIFETIME_MS } from 'src/modules/teamspace/application/services/teamspace-invitation-policy';
import { rethrowInvitationPendingUniqueConflict } from 'src/modules/teamspace/application/services/teamspace-invitation-unique-conflict';
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
import { TEAMSPACE_INVITATION_DELIVERY_OUTBOX, type TeamspaceInvitationDeliveryOutbox } from 'src/shared/infrastructure/outbox/teamspace-invitation-delivery.port';
import type { TeamspaceMembershipLock } from '../../../ports/teamspace-membership-lock.port';
import { ResendTeamspaceInvitationCommand } from './resend-teamspace-invitation.command';

@Injectable()
export class ResendTeamspaceInvitationHandler {
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
    @Inject(TEAMSPACE_INVITATION_DELIVERY_OUTBOX)
    private readonly deliveryOutbox: TeamspaceInvitationDeliveryOutbox,
  ) {}

  async execute(command: ResendTeamspaceInvitationCommand): Promise<TeamspaceInvitationResponseDto> {
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
      throw new ForbiddenException('You do not have permission to resend teamspace invitations');
    }

    try {
      const current = await this.uow.runInTransaction(async (context) => {
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
          throw new ForbiddenException('You do not have permission to resend teamspace invitations');
        }
        const recipient = await this.workspaceMemberRepo.findById(invitation.getWorkspaceMemberId(), context);
        if (!recipient || recipient.getWorkspaceId() !== teamspace.getWorkspaceId()) {
          throw new NotFoundException('Workspace member not found');
        }
        if (recipient.isGuest()) {
          throw new ForbiddenException('Guest memberships cannot be invited to a teamspace');
        }
        if (await this.memberRepo.exists(teamspace.getId(), recipient.getId(), context)) {
          throw new ConflictException('Workspace member already belongs to teamspace');
        }
        const now = new Date();
        const effectiveStatus = invitation.getEffectiveStatus(now);
        if (effectiveStatus !== TeamspaceInvitationStatus.PENDING &&
          effectiveStatus !== TeamspaceInvitationStatus.EXPIRED) {
          throw new ConflictException('Teamspace invitation cannot be resent');
        }
        const pending = await this.invitationRepo.findPendingByTeamspaceAndWorkspaceMemberForUpdate(
          teamspace.getId(), recipient.getId(), context,
        );
        if (pending && pending.getId() !== invitation.getId()) {
          if (pending.canAccept(now)) {
            throw new ConflictException('A pending teamspace invitation already exists');
          }
          pending.expire(now);
          await this.invitationRepo.save(pending, context);
        }
        const expiresAt = new Date(now.getTime() + TEAMSPACE_INVITATION_LIFETIME_MS);
        let current: TeamspaceInvitation;
        if (invitation.canAccept(now)) {
          invitation.renew(expiresAt, now);
          current = await this.invitationRepo.save(invitation, context);
        } else {
          if (invitation.getStatus() === TeamspaceInvitationStatus.PENDING) {
            invitation.expire(now);
            await this.invitationRepo.save(invitation, context);
          }
          current = await this.invitationRepo.save(TeamspaceInvitation.create({
            teamspaceId: teamspace.getId(),
            workspaceMemberId: recipient.getId(),
            invitedBy: command.userId,
            expiresAt,
          }), context);
        }
        await this.deliveryOutbox.enqueue(current.getId(), context);
        return current;
      });
      return TeamspaceInvitationResponseDto.fromDomain(current);
    } catch (error) {
      rethrowInvitationPendingUniqueConflict(error);
    }
  }
}
