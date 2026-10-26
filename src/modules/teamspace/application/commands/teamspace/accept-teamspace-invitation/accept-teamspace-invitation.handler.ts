import { ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TeamspaceInvitationResponseDto } from 'src/modules/teamspace/application/dto/teamspace/response/teamspace-invitation.response.dto';
import { TeamspaceMember } from 'src/modules/teamspace/domain/entities/teamspace-member.entity';
import { TeamspaceInvitationStatus } from 'src/modules/teamspace/domain/enums/teamspace-invitation-status.enum';
import { TeamspaceRole } from 'src/modules/teamspace/domain/enums/teamspace-role.enum';
import type { TeamspaceInvitationRepository } from 'src/modules/teamspace/domain/repositories/teamspace-invitation.repository';
import type { TeamspaceMemberRepository } from 'src/modules/teamspace/domain/repositories/teamspace-member.repository';
import type { TeamspaceRepository } from 'src/modules/teamspace/domain/repositories/teamspace.repository';
import { TEAMSPACE_TYPES } from 'src/modules/teamspace/teamspace.types';
import type { WorkspaceMemberRepository } from 'src/modules/workspace/domain/repositories/workspace-member.repository';
import { WORKSPACE_TYPES } from 'src/modules/workspace/workspace.types';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import type { TeamspaceMembershipLock } from '../../../ports/teamspace-membership-lock.port';
import { AcceptTeamspaceInvitationCommand } from './accept-teamspace-invitation.command';

@Injectable()
export class AcceptTeamspaceInvitationHandler {
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
  ) {}

  async execute(command: AcceptTeamspaceInvitationCommand): Promise<TeamspaceInvitationResponseDto> {
    const accepted = await this.uow.runInTransaction(async (context) => {
      const initial = await this.invitationRepo.findById(command.invitationId, context);
      if (!initial) throw new NotFoundException('Teamspace invitation not found');

      const initialTeamspace = await this.teamspaceRepo.findById(initial.getTeamspaceId(), context);
      if (!initialTeamspace) throw new NotFoundException('Teamspace not found');
      const initialRecipient = await this.workspaceMemberRepo.findByWorkspaceAndUser(
        initialTeamspace.getWorkspaceId(), command.userId, context,
      );
      if (!initialRecipient || initialRecipient.getId() !== initial.getWorkspaceMemberId()) {
        throw new ForbiddenException('This invitation is not for the current user');
      }

      await this.membershipLock.lockForMembershipChange(
        initial.getWorkspaceMemberId(), initial.getTeamspaceId(), command.userId, context,
      );

      const invitation = await this.invitationRepo.findByIdForUpdate(command.invitationId, context);
      if (!invitation || invitation.getWorkspaceMemberId() !== initialRecipient.getId() ||
        invitation.getTeamspaceId() !== initial.getTeamspaceId()) {
        throw new NotFoundException('Teamspace invitation not found');
      }
      const teamspace = await this.teamspaceRepo.findById(invitation.getTeamspaceId(), context);
      if (!teamspace) throw new NotFoundException('Teamspace not found');
      const recipient = await this.workspaceMemberRepo.findByWorkspaceAndUser(
        teamspace.getWorkspaceId(), command.userId, context,
      );
      if (!recipient || recipient.getId() !== invitation.getWorkspaceMemberId() || recipient.isGuest()) {
        throw new ForbiddenException('This invitation is not for the current workspace member');
      }
      const now = new Date();
      if (invitation.getEffectiveStatus(now) !== TeamspaceInvitationStatus.PENDING) {
        throw new ConflictException('Teamspace invitation is no longer valid');
      }
      if (await this.memberRepo.exists(teamspace.getId(), recipient.getId(), context)) {
        throw new ConflictException('Workspace member already belongs to teamspace');
      }

      await this.memberRepo.save(TeamspaceMember.create({
        teamspaceId: teamspace.getId(),
        workspaceMemberId: recipient.getId(),
        roleName: TeamspaceRole.MEMBER,
      }), context);
      invitation.accept(now);
      return this.invitationRepo.save(invitation, context);
    });
    return TeamspaceInvitationResponseDto.fromDomain(accepted);
  }
}
