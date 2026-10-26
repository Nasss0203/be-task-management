import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { hashTeamspaceInviteToken, isTeamspaceInviteToken } from 'src/modules/teamspace/application/services/teamspace-invite-token';
import { TeamspaceMember } from 'src/modules/teamspace/domain/entities/teamspace-member.entity';
import { TeamspaceRole } from 'src/modules/teamspace/domain/enums/teamspace-role.enum';
import type { TeamspaceInviteLinkRepository } from 'src/modules/teamspace/domain/repositories/teamspace-invite-link.repository';
import type { TeamspaceMemberRepository } from 'src/modules/teamspace/domain/repositories/teamspace-member.repository';
import type { TeamspaceRepository } from 'src/modules/teamspace/domain/repositories/teamspace.repository';
import { TEAMSPACE_TYPES } from 'src/modules/teamspace/teamspace.types';
import type { WorkspaceMemberRepository } from 'src/modules/workspace/domain/repositories/workspace-member.repository';
import { WORKSPACE_TYPES } from 'src/modules/workspace/workspace.types';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import type { TeamspaceMembershipLock } from '../../../ports/teamspace-membership-lock.port';
import { JoinTeamspaceByLinkCommand } from './join-teamspace-by-link.command';

@Injectable()
export class JoinTeamspaceByLinkHandler {
  constructor(
    @Inject(TEAMSPACE_TYPES.repositories.TeamspaceInviteLinkRepository)
    private readonly linkRepo: TeamspaceInviteLinkRepository,
    @Inject(TEAMSPACE_TYPES.repositories.TeamspaceRepository)
    private readonly teamspaceRepo: TeamspaceRepository,
    @Inject(TEAMSPACE_TYPES.repositories.TeamspaceMemberRepository)
    private readonly memberRepo: TeamspaceMemberRepository,
    @Inject(WORKSPACE_TYPES.repositories.WorkspaceMemberRepository)
    private readonly workspaceMemberRepo: WorkspaceMemberRepository,
    @Inject(TEAMSPACE_TYPES.ports.TeamspaceMembershipLock)
    private readonly membershipLock: TeamspaceMembershipLock,
    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,
  ) {}

  async execute(command: JoinTeamspaceByLinkCommand): Promise<TeamspaceMember> {
    if (!isTeamspaceInviteToken(command.token)) {
      throw new BadRequestException('Invalid teamspace invite token');
    }
    const tokenHash = hashTeamspaceInviteToken(command.token);
    const initialLink = await this.linkRepo.findByTokenHash(tokenHash);
    if (!initialLink) throw new NotFoundException('Teamspace invite link not found');

    return this.uow.runInTransaction(async (context) => {
      const preliminaryTeamspace = await this.teamspaceRepo.findById(
        initialLink.getTeamspaceId(), context,
      );
      if (!preliminaryTeamspace) throw new NotFoundException('Teamspace not found');
      const preliminaryActor = await this.workspaceMemberRepo.findByWorkspaceAndUser(
        preliminaryTeamspace.getWorkspaceId(), command.userId, context,
      );
      if (!preliminaryActor || preliminaryActor.isGuest()) {
        throw new ForbiddenException('Workspace membership required to join this teamspace');
      }

      await this.membershipLock.lockForMembershipChange(
        preliminaryActor.getId(), initialLink.getTeamspaceId(), command.userId, context,
      );
      const link = await this.linkRepo.findByIdForUpdate(initialLink.getId(), context);
      if (!link || link.getTokenHash() !== tokenHash ||
        link.getTeamspaceId() !== initialLink.getTeamspaceId()) {
        throw new NotFoundException('Teamspace invite link not found');
      }
      const teamspace = await this.teamspaceRepo.findById(link.getTeamspaceId(), context);
      if (!teamspace) throw new NotFoundException('Teamspace not found');
      const actor = await this.workspaceMemberRepo.findByWorkspaceAndUser(
        teamspace.getWorkspaceId(), command.userId, context,
      );
      if (!actor || actor.getId() !== preliminaryActor.getId() || actor.isGuest()) {
        throw new ForbiddenException('Workspace membership required to join this teamspace');
      }
      const now = new Date();
      if (!link.canBeUsed(now)) {
        throw new ConflictException('Teamspace invite link is no longer valid');
      }
      if (await this.memberRepo.exists(teamspace.getId(), actor.getId(), context)) {
        throw new ConflictException('Workspace member already belongs to teamspace');
      }
      const member = await this.memberRepo.save(TeamspaceMember.create({
        teamspaceId: teamspace.getId(),
        workspaceMemberId: actor.getId(),
        roleName: TeamspaceRole.MEMBER,
      }), context);
      link.recordSuccessfulUse(now);
      await this.linkRepo.save(link, context);
      return member;
    });
  }
}
