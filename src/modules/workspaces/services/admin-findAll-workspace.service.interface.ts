import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { WorkspaceModel } from '../domain/models/workspaces.model';
import { AdminFindAllWorkspaceService } from '../interfaces/services/admin-fileAll-workspace.service.interface';
import { WORKSPACE_TYPES } from '../interfaces/types';
import { AdminFindAllWorkspaceFilter } from '../interfaces/workspace-filter.type';
import { AdminFindAllWorkspaceRepositoryImpl } from '../repositories/admin-findAll-workspace.repository';

@Injectable()
export class AdminFindAllWorkspaceServiceImpl implements AdminFindAllWorkspaceService {
  constructor(
    @Inject(WORKSPACE_TYPES.repositories.AdminFindAllWorkspaceRepository)
    private readonly adminFindAllWorkspaceRepository: AdminFindAllWorkspaceRepositoryImpl,
  ) {}

  findAllWorkspace(
    filter: AdminFindAllWorkspaceFilter,
    manager?: EntityManager,
  ): Promise<WorkspaceModel[]> {
    return this.adminFindAllWorkspaceRepository.findAllWorkspace(
      filter,
      manager,
    );
  }
}
