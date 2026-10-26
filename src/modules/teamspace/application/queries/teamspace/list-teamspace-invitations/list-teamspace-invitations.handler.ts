import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { ListTeamspaceInvitationsResponseDto, TeamspaceInvitationManagementResponseDto } from 'src/modules/teamspace/application/dto/teamspace/response/teamspace-invitation-management.response.dto';
import type { TeamspaceInvitationRepository } from 'src/modules/teamspace/domain/repositories/teamspace-invitation.repository';
import type { TeamspaceRepository } from 'src/modules/teamspace/domain/repositories/teamspace.repository';
import { TEAMSPACE_TYPES } from 'src/modules/teamspace/teamspace.types';
import { ListTeamspaceInvitationsQuery } from './list-teamspace-invitations.query';

@Injectable()
export class ListTeamspaceInvitationsHandler {
  constructor(
    @Inject(TEAMSPACE_TYPES.repositories.TeamspaceRepository)
    private readonly teamspaceRepo: TeamspaceRepository,
    @Inject(TEAMSPACE_TYPES.repositories.TeamspaceInvitationRepository)
    private readonly invitationRepo: TeamspaceInvitationRepository,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(query: ListTeamspaceInvitationsQuery): Promise<ListTeamspaceInvitationsResponseDto> {
    if (!(await this.teamspaceRepo.findById(query.teamspaceId))) {
      throw new NotFoundException('Teamspace not found');
    }
    if (!(await this.authorizationService.authorize({
      userId: query.userId,
      permissions: [PERMISSIONS.TEAMSPACE_MEMBER_ADD],
      target: { type: 'teamspace', id: query.teamspaceId },
    }))) {
      throw new ForbiddenException('You do not have permission to list teamspace invitations');
    }
    const now = new Date();
    const result = await this.invitationRepo.listByTeamspace({
      teamspaceId: query.teamspaceId,
      status: query.status,
      page: query.page,
      limit: query.limit,
      now,
    });
    return {
      items: result.invitations.map((invitation) => TeamspaceInvitationManagementResponseDto.fromDomain(invitation, now)),
      total: result.total,
      page: query.page,
      limit: query.limit,
    };
  }
}
