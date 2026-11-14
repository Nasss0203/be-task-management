import { ACTIVITY_TYPES } from 'src/modules/activity/activity.types';
import { type CreateActivityService } from 'src/modules/activity/application/ports/create-activity.service.port';
import {
  ActivityAction,
  ActivityEntityType,
} from 'src/modules/activity/domain/entities/activity.entity';
import { BILLING_TYPES } from 'src/modules/billing/billing.types';
import type { SubscriptionLifecyclePort } from 'src/modules/billing/application/ports/subscription-lifecycle.port';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { WorkspaceResponseDto } from 'src/modules/workspace/application/dto/workspace/response/workspaces.response.dto';
import type { WorkspaceRepository } from 'src/modules/workspace/domain/repositories/workspace.repository';
import { WORKSPACE_TYPES } from 'src/modules/workspace/workspace.types';
import { SoftDeleteWorkspaceCommand } from './soft-delete-workspace.command';

@Injectable()
export class SoftDeleteWorkspaceHandler {
  constructor(
    @Inject(WORKSPACE_TYPES.repositories.WorkspaceRepository)
    private readonly workspaceRepository: WorkspaceRepository,
    @Inject(ACTIVITY_TYPES.services.CreateActivityService)
    private readonly createActivityService: CreateActivityService,

    @Inject(BILLING_TYPES.services.SubscriptionLifecyclePort)
    private readonly subscriptionLifecycle: SubscriptionLifecyclePort,
  ) {}

  async execute(
    command: SoftDeleteWorkspaceCommand,
  ): Promise<WorkspaceResponseDto> {
    const workspace = await this.workspaceRepository.findByUserIdAndWorkspaceId(
      command.userId,
      command.workspaceId,
    );

    if (!workspace) {
      throw new HttpException('Workspace not found', HttpStatus.NOT_FOUND);
    }

    workspace.softDelete(command.userId, new Date());

    const deletedWorkspace = await this.workspaceRepository.save(workspace);
    await this.subscriptionLifecycle.handleWorkspaceDeleted(
      command.workspaceId,
    );
    await this.createActivityService.create({
      workspaceId: command.workspaceId,
      entityType: ActivityEntityType.WORKSPACE,
      entityId: command.workspaceId,
      actorId: command.userId,
      action: ActivityAction.WORKSPACE_DELETED,
    });

    return WorkspaceResponseDto.fromDomain(deletedWorkspace);
  }
}
