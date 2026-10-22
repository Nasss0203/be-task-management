import { TEAMSPACE_TYPES } from 'src/modules/teamspace/teamspace.types';
import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { WORKSPACE_TYPES } from 'src/modules/workspace/workspace.types';

import type { TeamspaceMemberRepository } from 'src/modules/teamspace/domain/repositories/teamspace-member.repository';
import type { TeamspaceRepository } from 'src/modules/teamspace/domain/repositories/teamspace.repository';
import type { WorkspaceMemberRepository } from 'src/modules/workspace/domain/repositories/workspace-member.repository';

import { TeamspaceMember } from 'src/modules/teamspace/domain/entities/teamspace-member.entity';

import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { TeamspaceRole } from 'src/modules/teamspace/domain/enums/teamspace-role.enum';
import { TeamspacePermissionPolicy } from 'src/modules/permission/domain/policies/teamspace-permission.policy';
import { WorkspaceRole } from 'src/modules/workspace/domain/enums/workspace-role.enum';
import type { TeamspaceMembershipLock } from '../../../ports/teamspace-membership-lock.port';
import { AddTeamspaceMemberCommand } from './add-teamspace-member.command';

@Injectable()
export class AddTeamspaceMemberHandler {
  constructor(
    @Inject(TEAMSPACE_TYPES.repositories.TeamspaceRepository)
    private readonly teamspaceRepo: TeamspaceRepository,

    @Inject(TEAMSPACE_TYPES.repositories.TeamspaceMemberRepository)
    private readonly teamspaceMemberRepo: TeamspaceMemberRepository,

    @Inject(WORKSPACE_TYPES.repositories.WorkspaceMemberRepository)
    private readonly workspaceMemberRepo: WorkspaceMemberRepository,

    @Inject(TEAMSPACE_TYPES.ports.TeamspaceMembershipLock)
    private readonly membershipLock: TeamspaceMembershipLock,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,

    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(command: AddTeamspaceMemberCommand): Promise<TeamspaceMember> {
    const allowed = await this.authorizationService.authorize({
      userId: command.userId,
      permissions: [PERMISSIONS.TEAMSPACE_MEMBER_ADD],
      target: {
        type: 'teamspace',
        id: command.teamspaceId,
      },
    });

    if (!allowed) {
      throw new ForbiddenException(
        'You do not have permission to add members to this teamspace',
      );
    }
    if (
      command.role === TeamspaceRole.OWNER &&
      !(await this.authorizationService.authorize({
        userId: command.userId,
        permissions: [PERMISSIONS.TEAMSPACE_MEMBER_UPDATE],
        target: { type: 'teamspace', id: command.teamspaceId },
      }))
    ) {
      throw new ForbiddenException(
        'You do not have permission to appoint teamspace owners',
      );
    }
    return this.uow.runInTransaction(async (manager) => {
      await this.membershipLock.lockForMembershipChange(
        command.workspaceMemberId,
        command.teamspaceId,
        command.userId,
        manager,
      );

      /**
       * 1. Teamspace phải tồn tại.
       */
      const teamspace = await this.teamspaceRepo.findById(
        command.teamspaceId,
        manager,
      );

      if (!teamspace) {
        throw new NotFoundException('Teamspace not found');
      }

      const actor = await this.workspaceMemberRepo.findByWorkspaceAndUser(
        teamspace.getWorkspaceId(),
        command.userId,
        manager,
      );
      const actorTeamspaceMember = actor
        ? await this.teamspaceMemberRepo.findByTeamspaceAndWorkspaceMember(
            command.teamspaceId,
            actor.getId(),
            manager,
          )
        : null;
      const actorRole =
        actor?.getRole() === WorkspaceRole.OWNER
          ? TeamspaceRole.OWNER
          : actorTeamspaceMember?.getRoleName();
      const requiredPermissions =
        command.role === TeamspaceRole.OWNER
          ? [
              PERMISSIONS.TEAMSPACE_MEMBER_ADD,
              PERMISSIONS.TEAMSPACE_MEMBER_UPDATE,
            ]
          : [PERMISSIONS.TEAMSPACE_MEMBER_ADD];
      if (
        !actor ||
        actor.isGuest() ||
        !actorRole ||
        !TeamspacePermissionPolicy.hasAllPermissions(
          actorRole,
          requiredPermissions,
        )
      ) {
        throw new ForbiddenException(
          'You do not have permission to add members to this teamspace',
        );
      }

      /**
       * 2. WorkspaceMember phải tồn tại.
       */
      const workspaceMember = await this.workspaceMemberRepo.findById(
        command.workspaceMemberId,
        manager,
      );

      if (!workspaceMember) {
        throw new NotFoundException('Workspace member not found');
      }

      /**
       * Guest không tham gia Workspace Teamspace.
       * Guest chỉ truy cập content được share trực tiếp qua PageShare.
       */
      if (workspaceMember.isGuest()) {
        throw new ForbiddenException(
          'Guest memberships cannot be added to a teamspace',
        );
      }

      /**
       * 3. WorkspaceMember phải thuộc cùng Workspace
       * với Teamspace.
       */
      if (workspaceMember.getWorkspaceId() !== teamspace.getWorkspaceId()) {
        throw new NotFoundException(
          'Workspace member does not belong to teamspace workspace',
        );
      }

      /**
       * 4. Không được add trùng member.
       */
      const existed = await this.teamspaceMemberRepo.exists(
        command.teamspaceId,
        command.workspaceMemberId,
        manager,
      );

      if (existed) {
        throw new ConflictException(
          'Workspace member already belongs to teamspace',
        );
      }

      /**
       * 5. Tạo TeamspaceMember.
       */
      const teamspaceMember = TeamspaceMember.create({
        teamspaceId: command.teamspaceId,
        workspaceMemberId: command.workspaceMemberId,
        roleName: command.role,
      });

      /**
       * 6. Lưu.
       */
      return this.teamspaceMemberRepo.save(teamspaceMember, manager);
    });
  }
}
