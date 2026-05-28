import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ActivityAction,
  ActivityEntityType,
} from 'src/modules/activity/domain/entities/activity.entity';
import { type CreateActivityService } from 'src/modules/activity/interfaces/services/create-activity.service.interface';
import { ACTIVITY_TYPES } from 'src/modules/activity/interfaces/types';
import { DeleteProjectApplication } from '../interfaces/applications/delete-project.application.interface';
import { type DeleteProjectService } from '../interfaces/services/delete-project.service.interface';
import { type FindProjectService } from '../interfaces/services/find.project.service.interface';
import { PROJECT_TYPES } from '../interfaces/types';

@Injectable()
export class DeleteProjectApplicationImpl implements DeleteProjectApplication {
  constructor(
    @Inject(PROJECT_TYPES.services.FindProjectService)
    private readonly findProjectService: FindProjectService,

    @Inject(PROJECT_TYPES.services.DeleteProjectService)
    private readonly deleteProjectService: DeleteProjectService,

    @Inject(ACTIVITY_TYPES.services.CreateActivityService)
    private readonly createActivityService: CreateActivityService,
  ) {}

  async delete(input: {
    workspaceId: string;
    projectId: string;
    userId: string;
  }): Promise<void> {
    const project = await this.findProjectService.findOneProjectForRestore(
      input.workspaceId,
      input.projectId,
    );

    if (!project) {
      throw new NotFoundException('Project not found in this workspace');
    }

    if (project.deletedAt) {
      throw new BadRequestException('Project is already deleted');
    }

    if (project.workspaceDeletedAt) {
      throw new BadRequestException(
        'Cannot delete project because workspace is deleted',
      );
    }

    await this.deleteProjectService.softDeleteProject({
      projectId: input.projectId,
      deletedBy: input.userId,
    });

    await this.createActivityService.create({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      entityType: ActivityEntityType.PROJECT,
      entityId: input.projectId,
      actorId: input.userId,
      action: ActivityAction.PROJECT_DELETED,
      metadata: {
        name: project.name,
        key: project.key,
      },
    });
  }

  async restore(input: {
    workspaceId: string;
    projectId: string;
    userId: string;
  }): Promise<void> {
    const project = await this.findProjectService.findOneProjectForRestore(
      input.workspaceId,
      input.projectId,
    );

    if (!project) {
      throw new NotFoundException('Project not found in this workspace');
    }

    if (!project.deletedAt) {
      throw new BadRequestException('Project is not deleted');
    }

    if (project.workspaceDeletedAt) {
      throw new BadRequestException(
        'Cannot restore project because workspace is deleted',
      );
    }

    const keyExists = await this.findProjectService.existsActiveProjectKey(
      input.workspaceId,
      project.key,
      input.projectId,
    );

    if (keyExists) {
      throw new ConflictException(
        'Project key already exists in this workspace',
      );
    }

    await this.deleteProjectService.restoreProject({
      projectId: input.projectId,
    });

    await this.createActivityService.create({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      entityType: ActivityEntityType.PROJECT,
      entityId: input.projectId,
      actorId: input.userId,
      action: ActivityAction.PROJECT_RESTORED,
      metadata: {
        name: project.name,
        key: project.key,
      },
    });
  }
}
