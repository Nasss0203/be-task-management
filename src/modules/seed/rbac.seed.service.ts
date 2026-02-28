import { Injectable } from '@nestjs/common';
import { Permission } from 'src/modules/permission/entities/permission.entity';
import { Role, RoleName } from 'src/modules/role/entities/role.entity';
import { Workspace } from 'src/modules/workspaces/domain/entities/workspace.entity';
import { DataSource, In } from 'typeorm';
import { RolePermission } from '../role_permission/entities/role_permission.entity';
import { PERMISSIONS, ROLE_PERMISSION_TEMPLATE } from './rbac.seed-data';

@Injectable()
export class RbacSeedService {
  constructor(private readonly ds: DataSource) {}

  async seedAll() {
    return this.ds.transaction(async (manager) => {
      // 1) seed permissions (global)
      const permRepo = manager.getRepository(Permission);

      const codes = PERMISSIONS.map((p) => p.code);
      const existingPerms = await permRepo.find({ where: { code: In(codes) } });
      const permMap = new Map(existingPerms.map((p) => [p.code, p]));

      const toInsert: Permission[] = [];
      const toUpdate: Permission[] = [];

      for (const p of PERMISSIONS) {
        const found = permMap.get(p.code);
        if (!found) {
          toInsert.push(
            permRepo.create({ code: p.code, description: p.description }),
          );
        } else if ((found.description || '') !== (p.description || '')) {
          found.description = p.description;
          toUpdate.push(found);
        }
      }

      if (toInsert.length) await permRepo.save(toInsert);
      if (toUpdate.length) await permRepo.save(toUpdate);

      // reload perms to get ids (including inserted)
      const allPerms = await permRepo.find({ where: { code: In(codes) } });
      const permIdByCode = new Map(allPerms.map((p) => [p.code, p.id]));

      // 2) backfill roles + role_permissions for all workspaces
      const wsRepo = manager.getRepository(Workspace);
      const roleRepo = manager.getRepository(Role);
      const rpRepo = manager.getRepository(RolePermission);

      const workspaces = await wsRepo.find({ select: { id: true } });

      let rolesCreated = 0;
      let rolePermInserted = 0;

      for (const ws of workspaces) {
        // ensure roles exist
        const needRoleNames: RoleName[] = [RoleName.OWNER, RoleName.MEMBER];

        const existingRoles = await roleRepo.find({
          where: { workspace_id: ws.id, name: In(needRoleNames as any) },
        });

        const roleByName = new Map(existingRoles.map((r) => [r.name, r]));

        for (const name of needRoleNames) {
          if (!roleByName.get(name)) {
            const created = await roleRepo.save(
              roleRepo.create({ workspace_id: ws.id, name }),
            );
            roleByName.set(name, created);
            rolesCreated++;
          }
        }

        // ensure role_permissions exist (OWNER)
        {
          const ownerRole = roleByName.get(RoleName.OWNER)!;
          const perms = ROLE_PERMISSION_TEMPLATE.OWNER.map((code) => ({
            role_id: ownerRole.id,
            permission_id: permIdByCode.get(code)!,
          }));

          // Insert từng cái để bỏ qua trùng (cách đơn giản, chắc chắn)
          for (const x of perms) {
            try {
              await rpRepo.insert(x);
              rolePermInserted++;
            } catch (e) {
              // duplicate => bỏ qua
            }
          }
        }

        // ensure role_permissions exist (MEMBER)
        {
          const memberRole = roleByName.get(RoleName.MEMBER)!;
          const perms = ROLE_PERMISSION_TEMPLATE.MEMBER.map((code) => ({
            role_id: memberRole.id,
            permission_id: permIdByCode.get(code)!,
          }));

          for (const x of perms) {
            try {
              await rpRepo.insert(x);
              rolePermInserted++;
            } catch (e) {
              // duplicate => bỏ qua
            }
          }
        }
      }

      return {
        permissionsInserted: toInsert.length,
        permissionsUpdated: toUpdate.length,
        workspaces: workspaces.length,
        rolesCreated,
        rolePermInserted,
      };
    });
  }
}
