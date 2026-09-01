import type { AdminPermissionCode } from '../permissions/admin-permission-code';
import { AdminActor } from '../value-objects/admin-actor.vo';

export class AdminAccessPolicy {
  static hasPermission(
    _actor: AdminActor,
    _permission: AdminPermissionCode,
  ): boolean {
    return false;
  }

  static getPermissions(_actor: AdminActor): readonly AdminPermissionCode[] {
    return [];
  }
}
