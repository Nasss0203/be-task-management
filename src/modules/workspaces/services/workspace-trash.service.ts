import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { WorkspaceModel } from '../domain/models/workspaces.model';
import { type WorkspaceTrashRepository } from '../interfaces/repositories/workspace-trash.repository.interface';
import { WorkspaceTrashService } from '../interfaces/services/workspace-trash.service.interface';
import { WORKSPACE_TYPES } from '../interfaces/types';

@Injectable()
export class WorkspaceTrashServiceImpl implements WorkspaceTrashService {
  constructor(
    @Inject(WORKSPACE_TYPES.repositories.WorkspaceTrashRepository)
    private readonly workspaceTrashRepository: WorkspaceTrashRepository,
  ) {}

  async findDeletedWorkspacesByUserId(
    userId: string,
  ): Promise<WorkspaceModel[]> {
    return this.workspaceTrashRepository.findDeletedWorkspacesByUserId(userId);
  }

  async softDeleteWorkspace(
    userId: string,
    workspaceId: string,
  ): Promise<WorkspaceModel> {
    const workspace = await this.workspaceTrashRepository.softDeleteWorkspace(
      userId,
      workspaceId,
    );

    if (!workspace) {
      throw new HttpException('Workspace not found', HttpStatus.NOT_FOUND);
    }

    return workspace;
  }

  async restoreWorkspace(
    userId: string,
    workspaceId: string,
  ): Promise<WorkspaceModel> {
    const workspace = await this.workspaceTrashRepository.restoreWorkspace(
      userId,
      workspaceId,
    );

    if (!workspace) {
      throw new HttpException(
        'Deleted workspace not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return workspace;
  }
}
