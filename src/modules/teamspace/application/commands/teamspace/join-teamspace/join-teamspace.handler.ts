import { ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TeamspaceMember } from 'src/modules/teamspace/domain/entities/teamspace-member.entity';
import { TeamspaceRole } from 'src/modules/teamspace/domain/enums/teamspace-role.enum';
import type { TeamspaceMemberRepository } from 'src/modules/teamspace/domain/repositories/teamspace-member.repository';
import type { TeamspaceRepository } from 'src/modules/teamspace/domain/repositories/teamspace.repository';
import { TEAMSPACE_TYPES } from 'src/modules/teamspace/teamspace.types';
import type { WorkspaceMemberRepository } from 'src/modules/workspace/domain/repositories/workspace-member.repository';
import { WORKSPACE_TYPES } from 'src/modules/workspace/workspace.types';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import type { TeamspaceMembershipLock } from '../../../ports/teamspace-membership-lock.port';
import { JoinTeamspaceCommand } from './join-teamspace.command';

@Injectable()
export class JoinTeamspaceHandler {
  constructor(
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

  async execute(command: JoinTeamspaceCommand): Promise<TeamspaceMember> {
    try {
      return await this.uow.runInTransaction(async (context) => {
        const initialTeamspace = await this.teamspaceRepo.findById(command.teamspaceId, context);
        if (!initialTeamspace) throw new NotFoundException('Teamspace not found');
        const initialActor = await this.workspaceMemberRepo.findByWorkspaceAndUser(
          initialTeamspace.getWorkspaceId(), command.userId, context,
        );
        if (!initialActor || initialActor.isGuest()) {
          throw new NotFoundException('Teamspace not found');
        }

        await this.membershipLock.lockForMembershipChange(
          initialActor.getId(), command.teamspaceId, command.userId, context,
        );
        const teamspace = await this.teamspaceRepo.findById(command.teamspaceId, context);
        if (!teamspace) throw new NotFoundException('Teamspace not found');
        const actor = await this.workspaceMemberRepo.findByWorkspaceAndUser(
          teamspace.getWorkspaceId(), command.userId, context,
        );
        if (!actor || actor.getId() !== initialActor.getId() ||
          actor.getWorkspaceId() !== teamspace.getWorkspaceId() || actor.isGuest()) {
          throw new NotFoundException('Teamspace not found');
        }
        if (!teamspace.canJoinWithoutInvitation()) {
          throw new ForbiddenException('This teamspace requires an invitation');
        }
        if (await this.memberRepo.exists(teamspace.getId(), actor.getId(), context)) {
          throw new ConflictException('Workspace member already belongs to teamspace');
        }
        return this.memberRepo.save(TeamspaceMember.create({
          teamspaceId: teamspace.getId(),
          workspaceMemberId: actor.getId(),
          roleName: TeamspaceRole.MEMBER,
        }), context);
      });
    } catch (error) {
      const driverError = (error as { driverError?: { code?: string; constraint?: string } }).driverError;
      if (driverError?.code === '23505' &&
        driverError.constraint === 'UQ_teamspace_members_teamspace_workspace_member') {
        throw new ConflictException('Workspace member already belongs to teamspace');
      }
      throw error;
    }
  }
}
