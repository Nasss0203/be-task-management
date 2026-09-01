import { Injectable } from '@nestjs/common';
import type { AdminPermissionCode } from '../../domain/permissions/admin-permission-code';
import { AdminAccessPolicy } from '../../domain/policies/admin-access.policy';
import { AdminActor } from '../../domain/value-objects/admin-actor.vo';

@Injectable()
export class AdminAuthorizationService {
  hasPermission(actor: AdminActor, permission: AdminPermissionCode): boolean {
    return AdminAccessPolicy.hasPermission(actor, permission);
  }

  getPermissions(actor: AdminActor): readonly AdminPermissionCode[] {
    return AdminAccessPolicy.getPermissions(actor);
  }
}
