import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { TeamspacePermissionPolicy } from 'src/modules/permission/domain/policies/teamspace-permission.policy';
import { TeamspaceResponseDto } from 'src/modules/teamspace/application/dto/teamspace/response/teamspace.response.dto';
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
import { UpdateTeamspaceCommand } from './update-teamspace.command';

@Injectable()
export class UpdateTeamspaceHandler {
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
    command: UpdateTeamspaceCommand,
  ): Promise<TeamspaceResponseDto> {
    const name =
      command.name === undefined ? undefined : (command.name ?? '').trim();
    if (name !== undefined && !name) {
      throw new BadRequestException('Teamspace name cannot be empty');
    }
    if (
      name === undefined &&
      command.description === undefined &&
      command.icon === undefined
    ) {
      throw new BadRequestException('Nothing to update');
    }

    if (!(await this.teamspaceRepo.findById(command.teamspaceId))) {
      throw new NotFoundException('Teamspace not found');
    }

    if (
      !(await this.authorizationService.authorize({
        userId: command.userId,
        permissions: [PERMISSIONS.TEAMSPACE_UPDATE],
        target: { type: 'teamspace', id: command.teamspaceId },
      }))
    ) {
      throw new ForbiddenException(
        'You do not have permission to update teamspace settings',
      );
    }

    const saved = await this.uow.runInTransaction(async (context) => {
      const initialTeamspace = await this.teamspaceRepo.findById(
        command.teamspaceId,
        context,
      );
      if (!initialTeamspace) throw new NotFoundException('Teamspace not found');
      const initialActor =
        await this.workspaceMemberRepo.findByWorkspaceAndUser(
          initialTeamspace.getWorkspaceId(),
          command.userId,
          context,
        );
      if (!initialActor)
        throw new ForbiddenException('Workspace membership required');
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
      if (!teamspace) throw new NotFoundException('Teamspace not found');
      const actor = await this.workspaceMemberRepo.findByWorkspaceAndUser(
        teamspace.getWorkspaceId(),
        command.userId,
        context,
      );
      const actorMember = actor
        ? await this.memberRepo.findByTeamspaceAndWorkspaceMember(
            command.teamspaceId,
            actor.getId(),
            context,
          )
        : null;
      const actorRole =
        actor?.getRole() === WorkspaceRole.OWNER
          ? TeamspaceRole.OWNER
          : actorMember?.getRoleName();
      if (
        !actor ||
        actor.getId() !== initialActor.getId() ||
        actor.isGuest() ||
        !actorRole ||
        !TeamspacePermissionPolicy.hasPermission(
          actorRole,
          PERMISSIONS.TEAMSPACE_UPDATE,
        )
      ) {
        throw new ForbiddenException(
          'You do not have permission to update teamspace settings',
        );
      }

      teamspace.update({
        name,
        icon: command.icon,
        description: command.description,
      });
      return this.teamspaceRepo.save(teamspace, context);
    });
    return TeamspaceResponseDto.fromDomain(saved);
  }
}
