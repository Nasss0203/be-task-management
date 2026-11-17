import { Inject, Injectable } from '@nestjs/common';
import { SystemRole } from 'src/modules/identity/domain/enums/system-role.enum';
import { ADMIN_TYPES } from '../../../admin.types';
import { AdminAccessRoleResponseDto } from '../../dto/response/admin-access.response.dto';
import { AdminAuthorizationService } from '../../services/admin-authorization.service';

const ADMIN_SYSTEM_ROLES = [
  SystemRole.SUPER_ADMIN,
  SystemRole.SYSTEM_ADMIN,
] as const;

@Injectable()
export class ListAdminAccessRolesHandler {
  constructor(
    @Inject(ADMIN_TYPES.services.AdminAuthorizationService)
    private readonly adminAuthorizationService: AdminAuthorizationService,
  ) {}

  execute(): AdminAccessRoleResponseDto[] {
    return ADMIN_SYSTEM_ROLES.map((systemRole) => ({
      systemRole,
      permissions:
        this.adminAuthorizationService.getRolePermissions(systemRole),
    }));
  }
}
