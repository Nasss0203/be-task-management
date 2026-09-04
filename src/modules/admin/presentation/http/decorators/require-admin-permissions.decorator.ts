import { SetMetadata } from '@nestjs/common';
import type { AdminPermissionCode } from '../../../domain/permissions/admin-permission-code';

export const ADMIN_PERMISSIONS_KEY = 'admin:required-permissions';

export const RequireAdminPermissions = (
  ...permissions: AdminPermissionCode[]
) => SetMetadata(ADMIN_PERMISSIONS_KEY, permissions);
