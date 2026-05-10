import { Inject, Injectable } from '@nestjs/common';
import { AdminWorkspaceItemResponseDto } from 'src/modules/admin/dto/response/dashboard/workspace-overview.response.dto';
import { EntityManager } from 'typeorm';
import { type AdminFindAllWorkspaceRepository } from '../interfaces/repositories/admin-findAll-workspace.repository.interface';
import { AdminFindAllWorkspaceService } from '../interfaces/services/admin-findAll-workspace.service.interface';
import { WORKSPACE_TYPES } from '../interfaces/types';
import { AdminFindAllWorkspaceFilter } from '../interfaces/workspace-filter.type';

@Injectable()
export class AdminFindAllWorkspaceServiceImpl implements AdminFindAllWorkspaceService {
  constructor(
    @Inject(WORKSPACE_TYPES.repositories.AdminFindAllWorkspaceRepository)
    private readonly adminFindAllWorkspaceRepository: AdminFindAllWorkspaceRepository,
  ) {}

  findAllWorkspace(
    filter: AdminFindAllWorkspaceFilter,
    manager?: EntityManager,
  ): Promise<AdminWorkspaceItemResponseDto[]> {
    return this.adminFindAllWorkspaceRepository.findAllWorkspace(
      filter,
      manager,
    );
  }
}
