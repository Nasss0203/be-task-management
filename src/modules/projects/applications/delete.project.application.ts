import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
  }
}
