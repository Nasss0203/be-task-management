import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { DiscoverTeamspacesResponseDto, DiscoverTeamspaceItemResponseDto } from 'src/modules/teamspace/application/dto/teamspace/response/discover-teamspaces.response.dto';
import type { TeamspaceRepository } from 'src/modules/teamspace/domain/repositories/teamspace.repository';
import { TEAMSPACE_TYPES } from 'src/modules/teamspace/teamspace.types';
import type { WorkspaceMemberRepository } from 'src/modules/workspace/domain/repositories/workspace-member.repository';
import { WORKSPACE_TYPES } from 'src/modules/workspace/workspace.types';
import { DiscoverTeamspacesQuery } from './discover-teamspaces.query';

@Injectable()
export class DiscoverTeamspacesHandler {
  constructor(
    @Inject(TEAMSPACE_TYPES.repositories.TeamspaceRepository)
    private readonly teamspaceRepo: TeamspaceRepository,
    @Inject(WORKSPACE_TYPES.repositories.WorkspaceMemberRepository)
    private readonly workspaceMemberRepo: WorkspaceMemberRepository,
  ) {}

  async execute(query: DiscoverTeamspacesQuery): Promise<DiscoverTeamspacesResponseDto> {
    const actor = await this.workspaceMemberRepo.findByWorkspaceAndUser(
      query.workspaceId, query.userId,
    );
    if (!actor || actor.isGuest()) {
      throw new ForbiddenException('Workspace membership required to discover teamspaces');
    }

    const { items, total } = await this.teamspaceRepo.findOpenByWorkspaceAndUser(
      query.workspaceId, query.userId, query.limit, (query.page - 1) * query.limit,
    );
    return {
      items: items.map(({ teamspace, isMember }) =>
        DiscoverTeamspaceItemResponseDto.fromDomain(teamspace, isMember)),
      total,
      page: query.page,
      limit: query.limit,
    };
  }
}
