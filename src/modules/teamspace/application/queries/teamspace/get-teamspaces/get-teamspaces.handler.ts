import { TEAMSPACE_TYPES } from 'src/modules/teamspace/teamspace.types';
import { Inject, Injectable } from '@nestjs/common';


import type { TeamspaceRepository } from 'src/modules/teamspace/domain/repositories/teamspace.repository';

import { TeamspaceResponseDto } from '../../../dto/teamspace/response/teamspace.response.dto';
import { GetTeamspacesQuery } from './get-teamspaces.query';

@Injectable()
export class GetTeamspacesHandler {
  constructor(
    @Inject(TEAMSPACE_TYPES.repositories.TeamspaceRepository)
    private readonly teamspaceRepository: TeamspaceRepository,
  ) {}

  async execute(query: GetTeamspacesQuery): Promise<TeamspaceResponseDto[]> {
    const teamspaces =
      await this.teamspaceRepository.findAccessibleByWorkspaceAndUser(
        query.workspaceId,
        query.userId,
      );

    return teamspaces.map((teamspace) =>
      TeamspaceResponseDto.fromDomain(teamspace),
    );
  }
}
