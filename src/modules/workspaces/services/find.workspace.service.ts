import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { WorkspaceModel } from '../domain/models/workspaces.model';
import { type FindWorkspaceRepository } from '../interfaces/repositories/find.workspace.repository.interface';
import { FindWorkspaceService } from '../interfaces/services/find.workspace.service.interface';
import { WORKSPACE_TYPES } from '../interfaces/types';

@Injectable()
export class FindWorkspaceServiceImpl implements FindWorkspaceService {
  constructor(
    @Inject(WORKSPACE_TYPES.repositories.FindWorkspaceRepository)
    private readonly findWorkspaceRepository: FindWorkspaceRepository,
  ) {}

  async findAllByUserId(userId: string): Promise<WorkspaceModel[]> {
    return await this.findWorkspaceRepository.findWorkspacesByUserId(userId);
  }

  async findOneByWorkspaceId(
    userId: string,
    workspaceId: string,
  ): Promise<WorkspaceModel> {
    const workspace = await this.findWorkspaceRepository.findOneWorkspaceById(
      userId,
      workspaceId,
    );

    if (!workspace) {
      throw new HttpException('Workspace not found', HttpStatus.NOT_FOUND);
    }

    return workspace;
  }
}
