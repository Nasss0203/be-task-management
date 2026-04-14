import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { RoleName } from '../domain/entities/role.entity';
import { RoleModel } from '../domain/model/role.model';
import { type FindRoleRepository } from '../interfaces/repositories/find-role.repository.interface';
import { FindRoleService } from '../interfaces/services/find-role.service.interface';
import { ROLE_TYPES } from '../interfaces/types';

@Injectable()
export class FindRoleServiceImpl implements FindRoleService {
  constructor(
    @Inject(ROLE_TYPES.repositories.FindRoleRepository)
    private readonly findRoleRepository: FindRoleRepository,
  ) {}

  async findByNameAndWorkspace(
    roleName: RoleName,
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<RoleModel | null> {
    return this.findRoleRepository.findByNameAndWorkspace(
      roleName,
      workspaceId,
      manager,
    );
  }
}
