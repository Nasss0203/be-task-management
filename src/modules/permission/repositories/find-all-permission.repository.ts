import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RolePermission } from 'src/modules/role_permission/domain/entities/role_permission.entity';
import { UserRole } from 'src/modules/user_roles/domain/entities/user_role.entity';
import { EntityManager, Repository } from 'typeorm';
import { Permission } from '../domain/entities/permission.entity';
import { PermissionModel } from '../domain/models/permission.model';
import { FindPermissionRepository } from '../interfaces/repositories/find-all-permission.repository.interface';

@Injectable()
export class FindPermissionRepositoryImpl implements FindPermissionRepository {
  constructor(
    @InjectRepository(Permission)
    private readonly repo: Repository<Permission>,

    @InjectRepository(UserRole)
    private readonly userRoleRepo: Repository<UserRole>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<Permission> {
    return manager ? manager.getRepository(Permission) : this.repo;
  }

  async findAll(manager?: EntityManager): Promise<PermissionModel[]> {
    const permissions = await this.getRepo(manager).find();

    return permissions.map((permission) => ({
      id: permission.id,
      code: permission.code,
      description: permission.description,
      created_at: permission.created_at,
    }));
  }

  async findPermissionsByUserAndWorkspace(
    userId: string,
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<string[]> {
    const repo = manager ? manager.getRepository(UserRole) : this.userRoleRepo;

    const rows = await repo
      .createQueryBuilder('ur')
      .innerJoin(RolePermission, 'rp', 'rp.role_id = ur.role_id')
      .innerJoin(Permission, 'p', 'p.id = rp.permission_id')
      .select('DISTINCT p.code', 'code')
      .where('ur.user_id = :userId', { userId })
      .andWhere('ur.workspace_id = :workspaceId', { workspaceId })
      .getRawMany();
    console.log('🚀 ~ rows~', rows);

    return rows.map((row) => row.code);
  }
}
