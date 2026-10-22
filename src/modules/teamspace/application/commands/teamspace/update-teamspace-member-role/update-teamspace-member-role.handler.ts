import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { TEAMSPACE_TYPES } from 'src/modules/teamspace/teamspace.types';

import { TeamspaceRole } from 'src/modules/teamspace/domain/enums/teamspace-role.enum';

import type { TeamspaceMember } from 'src/modules/teamspace/domain/entities/teamspace-member.entity';

import type { TeamspaceMemberRepository } from 'src/modules/teamspace/domain/repositories/teamspace-member.repository';

import type { TeamspaceRepository } from 'src/modules/teamspace/domain/repositories/teamspace.repository';

import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';

import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';

import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { TeamspacePermissionPolicy } from 'src/modules/permission/domain/policies/teamspace-permission.policy';
import { WorkspaceRole } from 'src/modules/workspace/domain/enums/workspace-role.enum';
import { WORKSPACE_TYPES } from 'src/modules/workspace/workspace.types';
import type { WorkspaceMemberRepository } from 'src/modules/workspace/domain/repositories/workspace-member.repository';

import type { TeamspaceMembershipLock } from '../../../ports/teamspace-membership-lock.port';
import { UpdateTeamspaceMemberRoleCommand } from './update-teamspace-member-role.command';

@Injectable()
export class UpdateTeamspaceMemberRoleHandler {
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

  async execute(
    command: UpdateTeamspaceMemberRoleCommand,
  ): Promise<TeamspaceMember> {
    if (!Object.values(TeamspaceRole).includes(command.roleName)) {
      throw new BadRequestException('Invalid teamspace role');
    }

    if (
      !(await this.authorizationService.authorize({
        userId: command.userId,
        permissions: [PERMISSIONS.TEAMSPACE_MEMBER_UPDATE],
        target: {
          type: 'teamspace',
          id: command.teamspaceId,
        },
      }))
    ) {
      throw new ForbiddenException(
        'You do not have permission to update teamspace member roles',
      );
    }

    return this.uow.runInTransaction(async (context) => {
      // 1. Đọc membership để xác định WorkspaceMember cần khóa.
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

      // 2. Khóa WorkspaceMember trước, Teamspace sau.
      await this.membershipLock.lockForMembershipChange(
        initialMember.getWorkspaceMemberId(),
        command.teamspaceId,
        command.userId,
        context,
      );

      // 3. Kiểm tra lại sau khi lấy khóa.
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

      // The actor's WorkspaceMember row was locked before the Teamspace row.
      // Read both memberships through the transaction manager after locking.
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
          PERMISSIONS.TEAMSPACE_MEMBER_UPDATE,
        )
      ) {
        throw new ForbiddenException(
          'You do not have permission to update teamspace member roles',
        );
      }

      // 5. Không thay đổi nếu role giống hiện tại.
      if (member.getRoleName() === command.roleName) {
        return member;
      }

      // 6. Nếu hạ OWNER xuống MEMBER, bảo vệ OWNER cuối.
      if (
        member.getRoleName() === TeamspaceRole.OWNER &&
        command.roleName === TeamspaceRole.MEMBER
      ) {
        const members = await this.memberRepo.findByTeamspaceId(
          command.teamspaceId,
          context,
        );

        const ownerCount = members.filter(
          (item) => item.getRoleName() === TeamspaceRole.OWNER,
        ).length;

        if (ownerCount <= 1) {
          throw new ConflictException('Cannot demote the last Teamspace owner');
        }
      }

      // 7. Domain mutation.
      member.changeRole(command.roleName);

      // 8. Persistence.
      return this.memberRepo.save(member, context);
    });
  }
}
