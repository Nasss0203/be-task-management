import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { TeamspaceInviteLinkResponseDto } from 'src/modules/teamspace/application/dto/teamspace/response/teamspace-invite-link.response.dto';
import type { TeamspaceInviteLinkRepository } from 'src/modules/teamspace/domain/repositories/teamspace-invite-link.repository';
import type { TeamspaceRepository } from 'src/modules/teamspace/domain/repositories/teamspace.repository';
import { TEAMSPACE_TYPES } from 'src/modules/teamspace/teamspace.types';
import { ListTeamspaceInviteLinksQuery } from './list-teamspace-invite-links.query';

@Injectable()
export class ListTeamspaceInviteLinksHandler {
  constructor(
    @Inject(TEAMSPACE_TYPES.repositories.TeamspaceRepository)
    private readonly teamspaceRepo: TeamspaceRepository,
    @Inject(TEAMSPACE_TYPES.repositories.TeamspaceInviteLinkRepository)
    private readonly linkRepo: TeamspaceInviteLinkRepository,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(query: ListTeamspaceInviteLinksQuery): Promise<TeamspaceInviteLinkResponseDto[]> {
    if (!(await this.teamspaceRepo.findById(query.teamspaceId))) {
      throw new NotFoundException('Teamspace not found');
    }
    if (!(await this.authorizationService.authorize({
      userId: query.userId,
      permissions: [PERMISSIONS.TEAMSPACE_MEMBER_ADD],
      target: { type: 'teamspace', id: query.teamspaceId },
    }))) {
      throw new ForbiddenException('You do not have permission to list teamspace invite links');
    }
    const links = await this.linkRepo.findByTeamspaceId(query.teamspaceId);
    return links.map(TeamspaceInviteLinkResponseDto.fromDomain);
  }
}
