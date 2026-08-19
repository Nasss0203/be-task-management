import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WorkspaceRole } from 'src/modules/workspace/domain/enums/workspace-role.enum';
import { WorkspaceMemberOrmEntity } from 'src/modules/workspace/infrastructure/persistence/typeorm/entities/workspace-member.orm-entity';
import { EntityManager, Repository } from 'typeorm';
import { PERMISSIONS } from '../constants/permission.constant';
import { ROLE_PERMISSION_MAP } from '../constants/role-permission-map.constant';
import { Permission } from '../domain/entities/permission.entity';
import { PermissionModel } from '../domain/models/permission.model';
import { FindPermissionRepository } from '../interfaces/repositories/find-all-permission.repository.interface';

@Injectable()
export class FindPermissionRepositoryImpl implements FindPermissionRepository {
  constructor(
    @InjectRepository(Permission)
    private readonly repo: Repository<Permission>,

    @InjectRepository(WorkspaceMemberOrmEntity)
    private readonly workspaceMemberRepo: Repository<WorkspaceMemberOrmEntity>,
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
    const repo = manager
      ? manager.getRepository(WorkspaceMemberOrmEntity)
      : this.workspaceMemberRepo;

    const membership = await repo.findOne({
      select: {
        id: true,
        roleName: true,
      },
      where: {
        userId,
        workspaceId,
      },
    });

    if (!membership) {
      return [];
    }

    if (membership.roleName === WorkspaceRole.OWNER) {
      return Object.values(PERMISSIONS);
    }

    return ROLE_PERMISSION_MAP[membership.roleName] ?? [];
  }
}
