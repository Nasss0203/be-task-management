import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { UserRoleModel } from '../domain/model/user_role.model';
import { CreateUserRoleDto } from '../dto/create-user_role.dto';
import { type UserRoleRepository } from '../interfaces/repositories/user_role.repository.interface';
import { CreateUserRoleService } from '../interfaces/services/create.user_role.service.interface';
import { USER_ROLE_TYPES } from '../interfaces/types';

@Injectable()
export class CreateUserRoleServiceImpl implements CreateUserRoleService {
  constructor(
    @Inject(USER_ROLE_TYPES.repositories.UserRoleRepository)
    private readonly repo: UserRoleRepository,
  ) {}
  async create(
    createUserRoleDto: CreateUserRoleDto,
    manager?: EntityManager,
  ): Promise<UserRoleModel> {
    const create = await this.repo.save(createUserRoleDto, manager);

    return create;
  }
}
