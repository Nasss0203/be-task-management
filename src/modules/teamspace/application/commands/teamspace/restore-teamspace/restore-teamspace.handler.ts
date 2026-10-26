import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TeamspaceResponseDto } from 'src/modules/teamspace/application/dto/teamspace/response/teamspace.response.dto';
import type { TeamspaceRepository } from 'src/modules/teamspace/domain/repositories/teamspace.repository';
import { TEAMSPACE_TYPES } from 'src/modules/teamspace/teamspace.types';
import { RestoreTeamspaceCommand } from './restore-teamspace.command';

@Injectable()
export class RestoreTeamspaceHandler {
  constructor(
    @Inject(TEAMSPACE_TYPES.repositories.TeamspaceRepository)
    private readonly teamspaceRepo: TeamspaceRepository,
  ) {}

  async execute(
    command: RestoreTeamspaceCommand,
  ): Promise<TeamspaceResponseDto> {
    // The query only returns teamspaces the user owns (or owns the workspace of),
    // so "no permission" and "not archived" both surface as 404.
    const [teamspace] = await this.teamspaceRepo.findArchivedManageableByUser(
      command.userId,
      { teamspaceId: command.teamspaceId },
    );
    if (!teamspace) {
      throw new NotFoundException('Archived teamspace not found');
    }

    teamspace.restoreDeleted();
    return TeamspaceResponseDto.fromDomain(
      await this.teamspaceRepo.save(teamspace),
    );
  }
}
