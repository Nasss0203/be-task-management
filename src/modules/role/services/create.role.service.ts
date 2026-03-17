import { Inject, Injectable } from '@nestjs/common';
import { RoleModel } from '../domain/model/role.model';
import { CreateRoleDto } from '../dto/create-role.dto';
import { type RoleRepository } from '../interfaces/repositories/role.repository.interface';
import { CreateRoleService } from '../interfaces/services/create.role.service.interface';
import { ROLE_TYPES } from '../interfaces/types';

@Injectable()
export class CreateRoleServiceImpl implements CreateRoleService {
  constructor(
    @Inject(ROLE_TYPES.repositories.RoleRepository)
    private readonly workspaceRepo: RoleRepository,
  ) {}
  async create(createRoleDto: CreateRoleDto): Promise<RoleModel> {
    throw new Error('Method not implemented.');
  }
}
