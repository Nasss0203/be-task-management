import { Inject, Injectable } from '@nestjs/common';
import { TeamspaceResponseDto } from 'src/modules/teamspace/application/dto/teamspace/response/teamspace.response.dto';
import type { TeamspaceRepository } from 'src/modules/teamspace/domain/repositories/teamspace.repository';
import { TEAMSPACE_TYPES } from 'src/modules/teamspace/teamspace.types';
import { GetArchivedTeamspacesQuery } from './get-archived-teamspaces.query';

@Injectable()
export class GetArchivedTeamspacesHandler {
  constructor(
    @Inject(TEAMSPACE_TYPES.repositories.TeamspaceRepository)
    private readonly teamspaceRepo: TeamspaceRepository,
  ) {}

  async execute(
    query: GetArchivedTeamspacesQuery,
  ): Promise<TeamspaceResponseDto[]> {
    const teamspaces = await this.teamspaceRepo.findArchivedManageableByUser(
      query.userId,
      { workspaceId: query.workspaceId },
    );
    return teamspaces.map((teamspace) =>
      TeamspaceResponseDto.fromDomain(teamspace),
    );
  }
}
