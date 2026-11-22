import { ACTIVITY_TYPES } from 'src/modules/activity/activity.types';
import { type CreateActivityService } from 'src/modules/activity/application/ports/create-activity.service.port';
import {
  ActivityAction,
  ActivityEntityType,
} from 'src/modules/activity/domain/entities/activity.entity';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { FreeWorkspaceLimitService } from 'src/modules/workspace/application/services/free-workspace-limit.service';
import { WorkspaceResponseDto } from 'src/modules/workspace/application/dto/workspace/response/workspaces.response.dto';
import type { WorkspaceRepository } from 'src/modules/workspace/domain/repositories/workspace.repository';
import { WORKSPACE_TYPES } from 'src/modules/workspace/workspace.types';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { RestoreWorkspaceCommand } from './restore-workspace.command';

@Injectable()
export class RestoreWorkspaceHandler {
  constructor(
    @Inject(WORKSPACE_TYPES.repositories.WorkspaceRepository)
    private readonly workspaceRepository: WorkspaceRepository,
    @Inject(ACTIVITY_TYPES.services.CreateActivityService)
    private readonly createActivityService: CreateActivityService,
    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,
    private readonly freeWorkspaceLimit: FreeWorkspaceLimitService,
  ) {}

  async execute(
    command: RestoreWorkspaceCommand,
  ): Promise<WorkspaceResponseDto> {
    const restoredWorkspace = await this.uow.runInTransaction(
      async (context) => {
        const workspace =
          await this.workspaceRepository.findDeletedByUserIdAndWorkspaceId(
            command.userId,
            command.workspaceId,
            context,
          );

        if (!workspace) {
          throw new HttpException(
            'Deleted workspace not found',
            HttpStatus.NOT_FOUND,
          );
        }

        await this.freeWorkspaceLimit.assertCanRestore(
          command.userId,
          command.workspaceId,
          context,
        );
        workspace.restore();

        return this.workspaceRepository.save(workspace, context);
      },
    );
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
