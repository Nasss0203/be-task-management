import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { TeamspacePermissionPolicy } from 'src/modules/permission/domain/policies/teamspace-permission.policy';
import { TeamspaceRole } from 'src/modules/teamspace/domain/enums/teamspace-role.enum';
import type { TeamspaceMemberRepository } from 'src/modules/teamspace/domain/repositories/teamspace-member.repository';
import type { TeamspaceRepository } from 'src/modules/teamspace/domain/repositories/teamspace.repository';
import { TEAMSPACE_TYPES } from 'src/modules/teamspace/teamspace.types';
import { WorkspaceRole } from 'src/modules/workspace/domain/enums/workspace-role.enum';
import type { WorkspaceMemberRepository } from 'src/modules/workspace/domain/repositories/workspace-member.repository';
import { WORKSPACE_TYPES } from 'src/modules/workspace/workspace.types';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import type { TeamspaceMembershipLock } from '../../../ports/teamspace-membership-lock.port';
import { RemoveTeamspaceMemberCommand } from './remove-teamspace-member.command';

@Injectable()
export class RemoveTeamspaceMemberHandler {
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

    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(command: RemoveTeamspaceMemberCommand): Promise<void> {
    if (
      !(await this.authorizationService.authorize({
        userId: command.userId,
        permissions: [PERMISSIONS.TEAMSPACE_MEMBER_REMOVE],
        target: { type: 'teamspace', id: command.teamspaceId },
      }))
    ) {
      throw new ForbiddenException(
        'You do not have permission to remove teamspace members',
      );
    }

    await this.uow.runInTransaction(async (context) => {
      // Resolve the target WorkspaceMember before acquiring the shared locks.
      const initialMember = await this.memberRepo.findById(
        command.teamspaceMemberId,
        context,
      );
      if (
        !initialMember ||
        initialMember.getTeamspaceId() !== command.teamspaceId
      ) {
        throw new NotFoundException('Teamspace member not found');
      }

      // Locks involved WorkspaceMembers first, then the Teamspace row.
      await this.membershipLock.lockForMembershipChange(
        initialMember.getWorkspaceMemberId(),
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

      const member = await this.memberRepo.findById(
        command.teamspaceMemberId,
        context,
      );
      if (!member || member.getTeamspaceId() !== command.teamspaceId) {
        throw new NotFoundException('Teamspace member not found');
      }

      // Recheck the actor against memberships read with the transaction manager.
      const actor = await this.workspaceMemberRepo.findByWorkspaceAndUser(
        teamspace.getWorkspaceId(),
        command.userId,
        context,
      );
      const actorTeamspaceMember = actor
        ? await this.memberRepo.findByTeamspaceAndWorkspaceMember(
            command.teamspaceId,
            actor.getId(),
            context,
          )
        : null;
      const actorRole =
        actor?.getRole() === WorkspaceRole.OWNER
          ? TeamspaceRole.OWNER
          : actorTeamspaceMember?.getRoleName();
      if (
        !actor ||
        actor.isGuest() ||
        !actorRole ||
        !TeamspacePermissionPolicy.hasPermission(
          actorRole,
          PERMISSIONS.TEAMSPACE_MEMBER_REMOVE,
        )
      ) {
        throw new ForbiddenException(
          'You do not have permission to remove teamspace members',
        );
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
          throw new ConflictException('Cannot remove the last Teamspace owner');
        }
      }

      const deleted = await this.memberRepo.deleteById(member.getId(), context);
      if (!deleted) {
        throw new NotFoundException('Teamspace member not found');
      }
    });
  }
}
