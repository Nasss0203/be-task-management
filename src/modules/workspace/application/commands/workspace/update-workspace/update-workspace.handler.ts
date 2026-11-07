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
import { UpdateWorkspaceCommand } from './update-workspace.command';

@Injectable()
export class UpdateWorkspaceHandler {
  constructor(
    @Inject(WORKSPACE_TYPES.repositories.WorkspaceRepository)
    private readonly workspaceRepository: WorkspaceRepository,
    @Inject(ACTIVITY_TYPES.services.CreateActivityService)
    private readonly createActivityService: CreateActivityService,
  ) {}

  async execute(
    command: UpdateWorkspaceCommand,
  ): Promise<WorkspaceResponseDto> {
    const workspace = await this.workspaceRepository.findByUserIdAndWorkspaceId(
      command.userId,
      command.workspaceId,
    );

    if (!workspace) {
      throw new HttpException('Workspace not found', HttpStatus.NOT_FOUND);
    }

    const previousName = workspace.getName();
    const previousIcon = workspace.getIcon();

    workspace.rename(command.dto.name ?? workspace.getName());

    if (command.dto.icon !== undefined) {
      workspace.changeIcon(command.dto.icon);
    }

    const updated = await this.workspaceRepository.save(workspace);

    const fields = [
      previousName !== workspace.getName() ? 'name' : null,
      previousIcon !== workspace.getIcon() ? 'icon' : null,
    ].filter((field): field is string => field !== null);
    if (fields.length) {
      await this.createActivityService.create({
        workspaceId: command.workspaceId,
        entityType: ActivityEntityType.WORKSPACE,
        entityId: command.workspaceId,
        actorId: command.userId,
        action: ActivityAction.WORKSPACE_UPDATED,
        metadata: { fields },
      });
    }

    return WorkspaceResponseDto.fromDomain(updated);
  }
}
