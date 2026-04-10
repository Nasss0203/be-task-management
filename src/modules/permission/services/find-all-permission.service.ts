import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { type FindPermissionRepository } from '../interfaces/repositories/find-all-permission.repository.interface';
import { FindPermissionService } from '../interfaces/services/find-all-permission.service.interface';
import { PERMISSION_TYPES } from '../interfaces/types';

@Injectable()
export class FindPermissionServiceImpl implements FindPermissionService {
  constructor(
    @Inject(PERMISSION_TYPES.repositories.FindPermissionRepository)
    private readonly repo: FindPermissionRepository,
  ) {}

  findPermissionsByUserAndWorkspace(
    userId: string,
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<string[]> {
    return this.repo.findPermissionsByUserAndWorkspace(
      userId,
      workspaceId,
      manager,
    );
  }
}
