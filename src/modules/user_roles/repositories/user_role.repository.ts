import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { UserRole } from '../domain/entities/user_role.entity';
import { UserRoleModel } from '../domain/model/user_role.model';
import {
  SaveUserRoleInput,
  UserRoleRepository,
} from '../interfaces/repositories/user_role.repository.interface';
import { UserRoleMapper } from '../mapper/user_roles.mapper';

@Injectable()
export class UserRoleRepositoryImpl implements UserRoleRepository {
  constructor(
    @InjectRepository(UserRole)
    private readonly repo: Repository<UserRole>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<UserRole> {
    return manager ? manager.getRepository(UserRole) : this.repo;
  }

  async save(
    userRole: UserRoleModel | SaveUserRoleInput,
    manager?: EntityManager,
  ): Promise<UserRoleModel> {
    const repo = this.getRepo(manager);
    const entity = UserRoleMapper.toEntity(userRole as UserRoleModel);
    const saved = await repo.save(entity);
    return UserRoleMapper.toModel(saved);
  }

  async deleteByUserId(
    workspaceId: string,
    userId: string,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = this.getRepo(manager);
    await repo.delete({ workspace_id: workspaceId, user_id: userId });
  }
}
