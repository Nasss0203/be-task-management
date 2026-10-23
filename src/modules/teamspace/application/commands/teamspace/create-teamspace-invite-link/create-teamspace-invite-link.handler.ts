import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { TeamspacePermissionPolicy } from 'src/modules/permission/domain/policies/teamspace-permission.policy';
import { CreatedTeamspaceInviteLinkResponseDto } from 'src/modules/teamspace/application/dto/teamspace/response/teamspace-invite-link.response.dto';
import { createTeamspaceInviteToken, hashTeamspaceInviteToken } from 'src/modules/teamspace/application/services/teamspace-invite-token';
import { TeamspaceInviteLink } from 'src/modules/teamspace/domain/entities/teamspace-invite-link.entity';
import { TeamspaceRole } from 'src/modules/teamspace/domain/enums/teamspace-role.enum';
import type { TeamspaceInviteLinkRepository } from 'src/modules/teamspace/domain/repositories/teamspace-invite-link.repository';
import type { TeamspaceMemberRepository } from 'src/modules/teamspace/domain/repositories/teamspace-member.repository';
import type { TeamspaceRepository } from 'src/modules/teamspace/domain/repositories/teamspace.repository';
import { TEAMSPACE_TYPES } from 'src/modules/teamspace/teamspace.types';
import { WorkspaceRole } from 'src/modules/workspace/domain/enums/workspace-role.enum';
import type { WorkspaceMemberRepository } from 'src/modules/workspace/domain/repositories/workspace-member.repository';
import { WORKSPACE_TYPES } from 'src/modules/workspace/workspace.types';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import type { TeamspaceMembershipLock } from '../../../ports/teamspace-membership-lock.port';
import { CreateTeamspaceInviteLinkCommand } from './create-teamspace-invite-link.command';

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class CreateTeamspaceInviteLinkHandler {
  constructor(
    @Inject(TEAMSPACE_TYPES.repositories.TeamspaceRepository)
    private readonly teamspaceRepo: TeamspaceRepository,
    @Inject(TEAMSPACE_TYPES.repositories.TeamspaceMemberRepository)
    private readonly memberRepo: TeamspaceMemberRepository,
    @Inject(TEAMSPACE_TYPES.repositories.TeamspaceInviteLinkRepository)
    private readonly linkRepo: TeamspaceInviteLinkRepository,
    @Inject(WORKSPACE_TYPES.repositories.WorkspaceMemberRepository)
    private readonly workspaceMemberRepo: WorkspaceMemberRepository,
    @Inject(TEAMSPACE_TYPES.ports.TeamspaceMembershipLock)
    private readonly membershipLock: TeamspaceMembershipLock,
    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(command: CreateTeamspaceInviteLinkCommand): Promise<CreatedTeamspaceInviteLinkResponseDto> {
    const now = new Date();
    const expiresAt = command.expiresAt
      ? new Date(command.expiresAt)
      : new Date(now.getTime() + 7 * DAY_MS);
    if (Number.isNaN(expiresAt.getTime()) || expiresAt <= now ||
      expiresAt.getTime() - now.getTime() > 30 * DAY_MS) {
      throw new BadRequestException('Invite link expiration must be within the next 30 days');
    }
    if (command.maxUses !== undefined &&
      (!Number.isInteger(command.maxUses) || command.maxUses < 1 || command.maxUses > 100)) {
      throw new BadRequestException('max_uses must be between 1 and 100');
    }

    if (!(await this.teamspaceRepo.findById(command.teamspaceId))) {
      throw new NotFoundException('Teamspace not found');
    }
    if (!(await this.authorizationService.authorize({
      userId: command.userId,
      permissions: [PERMISSIONS.TEAMSPACE_MEMBER_ADD],
      target: { type: 'teamspace', id: command.teamspaceId },
    }))) {
      throw new ForbiddenException('You do not have permission to create teamspace invite links');
    }

    const token = createTeamspaceInviteToken();
    const link = await this.uow.runInTransaction(async (context) => {
      const preliminaryTeamspace = await this.teamspaceRepo.findById(command.teamspaceId, context);
      if (!preliminaryTeamspace) throw new NotFoundException('Teamspace not found');
      const preliminaryActor = await this.workspaceMemberRepo.findByWorkspaceAndUser(
        preliminaryTeamspace.getWorkspaceId(), command.userId, context,
      );
      if (!preliminaryActor) throw new ForbiddenException('Workspace membership required');

      await this.membershipLock.lockForMembershipChange(
        preliminaryActor.getId(), command.teamspaceId, command.userId, context,
      );
      const teamspace = await this.teamspaceRepo.findById(command.teamspaceId, context);
      if (!teamspace) throw new NotFoundException('Teamspace not found');
      const actor = await this.workspaceMemberRepo.findByWorkspaceAndUser(
        teamspace.getWorkspaceId(), command.userId, context,
      );
      const actorMember = actor
        ? await this.memberRepo.findByTeamspaceAndWorkspaceMember(
            command.teamspaceId, actor.getId(), context,
          )
        : null;
      const actorRole = actor?.getRole() === WorkspaceRole.OWNER
        ? TeamspaceRole.OWNER : actorMember?.getRoleName();
      if (!actor || actor.getId() !== preliminaryActor.getId() || actor.isGuest() || !actorRole ||
        !TeamspacePermissionPolicy.hasPermission(actorRole, PERMISSIONS.TEAMSPACE_MEMBER_ADD)) {
        throw new ForbiddenException('You do not have permission to create teamspace invite links');
      }
      if (expiresAt <= new Date()) {
        throw new BadRequestException('Invite link expiration has passed');
      }
      return this.linkRepo.save(TeamspaceInviteLink.create({
        teamspaceId: teamspace.getId(),
        tokenHash: hashTeamspaceInviteToken(token),
        createdBy: command.userId,
        expiresAt,
        maxUses: command.maxUses ?? null,
      }), context);
    });
    return CreatedTeamspaceInviteLinkResponseDto.fromCreated(link, token);
  }
}
