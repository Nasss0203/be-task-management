import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import {
  CreateRolePermissionInput,
  type CreateRolePermissionRepository,
} from '../interfaces/repositories/create-role_permission.repository.interface';
import { CreateRolePermissionService } from '../interfaces/services/create-role_permission.service.interface';
import { ROLE_PERMISSION_TYPES } from '../interfaces/types';

@Injectable()
export class CreateRolePermissionServiceImpl implements CreateRolePermissionService {
  constructor(
    @Inject(ROLE_PERMISSION_TYPES.repositories.CreateRolePermissionRepository)
    private readonly createRolePermissionRepository: CreateRolePermissionRepository,
  ) {}

  async createMany(
    data: CreateRolePermissionInput[],
    manager?: EntityManager,
  ): Promise<void> {
    await this.createRolePermissionRepository.saveMany(data, manager);
  }
}
