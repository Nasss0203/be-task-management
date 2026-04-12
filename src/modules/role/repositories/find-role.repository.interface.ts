import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Role, RoleName } from '../domain/entities/role.entity';
import { RoleModel } from '../domain/model/role.model';
import { FindRoleRepository } from '../interfaces/repositories/find-role.repository.interface';
import { RoleMapper } from '../mapper/role.mapper';

@Injectable()
export class FindRoleRepositoryImpl implements FindRoleRepository {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<Role> {
    return manager ? manager.getRepository(Role) : this.roleRepo;
  }

  async findByNameAndWorkspace(
    roleName: RoleName,
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<RoleModel | null> {
    const row = await this.getRepo(manager).findOne({
      where: {
        name: roleName,
        workspace_id: workspaceId,
      },
    });

    if (!row) return null;

    return RoleMapper.toModel(row);
  }
}
