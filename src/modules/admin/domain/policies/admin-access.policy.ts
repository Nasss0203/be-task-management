import { SystemRole } from 'src/modules/identity/domain/enums/system-role.enum';
import {
  ADMIN_PERMISSIONS,
  type AdminPermissionCode,
} from '../permissions/admin-permission-code';
import { AdminActor } from '../value-objects/admin-actor.vo';

const SYSTEM_ADMIN_PERMISSIONS: readonly AdminPermissionCode[] = [
  ADMIN_PERMISSIONS.ACCESS_READ,
  ADMIN_PERMISSIONS.USERS_READ,
  ADMIN_PERMISSIONS.WORKSPACES_READ,
  ADMIN_PERMISSIONS.DASHBOARD_READ,
];

const SUPER_ADMIN_PERMISSIONS: readonly AdminPermissionCode[] =
  Object.values(ADMIN_PERMISSIONS);

export class AdminAccessPolicy {
  static hasPermission(
    actor: AdminActor,
    permission: AdminPermissionCode,
  ): boolean {
    return AdminAccessPolicy.getPermissions(actor).includes(permission);
  }

  static getPermissions(actor: AdminActor): readonly AdminPermissionCode[] {
    if (actor.systemRole === SystemRole.SUPER_ADMIN) {
      return SUPER_ADMIN_PERMISSIONS;
    }

    if (actor.systemRole === SystemRole.SYSTEM_ADMIN) {
      return SYSTEM_ADMIN_PERMISSIONS;
    }

    return [];
  }
}
