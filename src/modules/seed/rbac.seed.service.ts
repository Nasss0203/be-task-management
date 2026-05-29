import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import {
  PERMISSION_SEED_DATA,
  PermissionCode,
} from '../permission/constants/permission.constant';
import { ROLE_PERMISSION_MAP } from '../permission/constants/role-permission-map.constant';
import { Permission } from '../permission/domain/entities/permission.entity';
import { Role, RoleName } from '../role/domain/entities/role.entity';
import { RolePermission } from '../role_permission/domain/entities/role_permission.entity';
import { Workspace } from '../workspaces/domain/entities/workspace.entity';

@Injectable()
export class RbacSeedService {
  private readonly logger = new Logger(RbacSeedService.name);

  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,

    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,

    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,

    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
  ) {}

  async seedPermissions(): Promise<void> {
    for (const item of PERMISSION_SEED_DATA) {
      const existed = await this.permissionRepository.findOne({
        where: { code: item.code },
      });

      if (existed) {
        this.logger.log(`Permission existed: ${item.code}`);
        continue;
      }

      const permission = this.permissionRepository.create({
        code: item.code,
        description: item.description,
      });

      await this.permissionRepository.save(permission);
      this.logger.log(`Seeded permission: ${item.code}`);
    }
  }

  async seedWorkspaceRolesAndPermissions(): Promise<void> {
    const permissions = await this.permissionRepository.find();
    const permissionMap = new Map(
      permissions.map((permission) => [permission.code, permission]),
    );

    const workspaces = await this.workspaceRepository.find({
      select: { id: true },
    });

    for (const workspace of workspaces) {
      const roles = await this.roleRepository.find({
        where: { workspace_id: workspace.id },
      });

      const roleMap = new Map(roles.map((role) => [role.name, role]));

      for (const roleName of Object.values(RoleName)) {
        if (roleMap.has(roleName)) continue;

        const role = this.roleRepository.create({
          name: roleName,
          workspace_id: workspace.id,
        });

        const savedRole = await this.roleRepository.save(role);
        roleMap.set(roleName, savedRole);
        this.logger.log(
          `Seeded role ${roleName} for workspace ${workspace.id}`,
        );
      }

      for (const [roleName, permissionCodes] of Object.entries(
        ROLE_PERMISSION_MAP,
      ) as [RoleName, PermissionCode[]][]) {
        const role = roleMap.get(roleName);
        if (!role) continue;

        for (const permissionCode of permissionCodes) {
          const permission = permissionMap.get(permissionCode);
          if (!permission) {
            this.logger.warn(`Permission missing: ${permissionCode}`);
            continue;
          }

          const existed = await this.rolePermissionRepository.findOne({
            where: {
              role_id: role.id,
              permission_id: permission.id,
            },
          });

          if (existed) continue;

          await this.rolePermissionRepository.save(
            this.rolePermissionRepository.create({
              role_id: role.id,
              permission_id: permission.id,
            }),
          );
        }
      }
    }
  }

  async seed(): Promise<void> {
    await this.seedPermissions();
    await this.seedWorkspaceRolesAndPermissions();
    this.logger.log('RBAC seed completed');
  }
}
