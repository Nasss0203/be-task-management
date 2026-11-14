import { ACTIVITY_TYPES } from 'src/modules/activity/activity.types';
import { type CreateActivityService } from 'src/modules/activity/application/ports/create-activity.service.port';
import {
  ActivityAction,
  ActivityEntityType,
} from 'src/modules/activity/domain/entities/activity.entity';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { WorkspaceResponseDto } from 'src/modules/workspace/application/dto/workspace/response/workspaces.response.dto';
import type { WorkspaceRepository } from 'src/modules/workspace/domain/repositories/workspace.repository';
import { WORKSPACE_TYPES } from 'src/modules/workspace/workspace.types';
import { RestoreWorkspaceCommand } from './restore-workspace.command';

@Injectable()
export class RestoreWorkspaceHandler {
  constructor(
    @Inject(WORKSPACE_TYPES.repositories.WorkspaceRepository)
    private readonly workspaceRepository: WorkspaceRepository,
    @Inject(ACTIVITY_TYPES.services.CreateActivityService)
    private readonly createActivityService: CreateActivityService,
  ) {}

  async execute(
    command: RestoreWorkspaceCommand,
  ): Promise<WorkspaceResponseDto> {
    const workspace =
      await this.workspaceRepository.findDeletedByUserIdAndWorkspaceId(
        command.userId,
        command.workspaceId,
      );

    if (!workspace) {
      throw new HttpException(
        'Deleted workspace not found',
        HttpStatus.NOT_FOUND,
      );
    }

    workspace.restore();

    const restoredWorkspace = await this.workspaceRepository.save(workspace);
    await this.createActivityService.create({
      workspaceId: command.workspaceId,
      entityType: ActivityEntityType.WORKSPACE,
      entityId: command.workspaceId,
      actorId: command.userId,
      action: ActivityAction.WORKSPACE_RESTORED,
    });

    return WorkspaceResponseDto.fromDomain(restoredWorkspace);
  }
}
