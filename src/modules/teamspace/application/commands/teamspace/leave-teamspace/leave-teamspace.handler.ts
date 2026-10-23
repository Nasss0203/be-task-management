import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TeamspaceRole } from 'src/modules/teamspace/domain/enums/teamspace-role.enum';
import type { TeamspaceMemberRepository } from 'src/modules/teamspace/domain/repositories/teamspace-member.repository';
import type { TeamspaceRepository } from 'src/modules/teamspace/domain/repositories/teamspace.repository';
import { TEAMSPACE_TYPES } from 'src/modules/teamspace/teamspace.types';
import type { WorkspaceMemberRepository } from 'src/modules/workspace/domain/repositories/workspace-member.repository';
import { WORKSPACE_TYPES } from 'src/modules/workspace/workspace.types';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import type { TeamspaceMembershipLock } from '../../../ports/teamspace-membership-lock.port';
import { LeaveTeamspaceCommand } from './leave-teamspace.command';

@Injectable()
export class LeaveTeamspaceHandler {
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

  async execute(command: LeaveTeamspaceCommand): Promise<void> {
    await this.uow.runInTransaction(async (context) => {
      // Resolve the actor's WorkspaceMember ID before acquiring row locks.
      const initialTeamspace = await this.teamspaceRepo.findById(
        command.teamspaceId,
        context,
      );
      if (!initialTeamspace) {
        throw new NotFoundException('Teamspace not found');
      }

      const initialActor = await this.workspaceMemberRepo.findByWorkspaceAndUser(
        initialTeamspace.getWorkspaceId(),
        command.userId,
        context,
      );
      if (!initialActor) {
        throw new NotFoundException('Teamspace member not found');
      }

      const initialMember = await this.memberRepo.findByTeamspaceAndWorkspaceMember(
        command.teamspaceId,
        initialActor.getId(),
        context,
      );
      if (!initialMember) {
        throw new NotFoundException('Teamspace member not found');
      }

      await this.membershipLock.lockForMembershipChange(
        initialActor.getId(),
        command.teamspaceId,
        command.userId,
        context,
      );

      const teamspace = await this.teamspaceRepo.findById(
        command.teamspaceId,
        context,
      );
      if (!teamspace) {
        throw new NotFoundException('Teamspace not found');
      }

      const actor = await this.workspaceMemberRepo.findByWorkspaceAndUser(
        teamspace.getWorkspaceId(),
        command.userId,
        context,
      );
      if (
        !actor ||
        actor.getId() !== initialActor.getId() ||
        actor.getWorkspaceId() !== teamspace.getWorkspaceId()
      ) {
        throw new NotFoundException('Teamspace member not found');
      }

      const member = await this.memberRepo.findByTeamspaceAndWorkspaceMember(
        command.teamspaceId,
        actor.getId(),
        context,
      );
      if (
        !member ||
        member.getId() !== initialMember.getId() ||
        member.getTeamspaceId() !== command.teamspaceId ||
        member.getWorkspaceMemberId() !== actor.getId()
      ) {
        throw new NotFoundException('Teamspace member not found');
      }

      if (member.getRoleName() === TeamspaceRole.OWNER) {
        const members = await this.memberRepo.findByTeamspaceId(
          command.teamspaceId,
          context,
        );
        const ownerCount = members.filter(
          (item) => item.getRoleName() === TeamspaceRole.OWNER,
        ).length;
        if (ownerCount <= 1) {
          throw new ConflictException('Cannot leave Teamspace as the last owner');
        }
      }

      const deleted = await this.memberRepo.deleteById(member.getId(), context);
      if (!deleted) {
        throw new NotFoundException('Teamspace member not found');
      }
    });
  }
}
