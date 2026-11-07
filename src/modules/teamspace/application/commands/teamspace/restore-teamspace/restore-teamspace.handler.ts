import { ACTIVITY_TYPES } from 'src/modules/activity/activity.types';
import { type CreateActivityService } from 'src/modules/activity/application/ports/create-activity.service.port';
import {
  ActivityAction,
  ActivityEntityType,
} from 'src/modules/activity/domain/entities/activity.entity';
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
    @Inject(ACTIVITY_TYPES.services.CreateActivityService)
    private readonly createActivityService: CreateActivityService,
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
    const restored = await this.teamspaceRepo.save(teamspace);
    await this.createActivityService.create({
      workspaceId: teamspace.getWorkspaceId(),
      entityType: ActivityEntityType.TEAMSPACE,
      entityId: teamspace.getId(),
      actorId: command.userId,
      action: ActivityAction.TEAMSPACE_RESTORED,
    });
    return TeamspaceResponseDto.fromDomain(restored);
  }
}
