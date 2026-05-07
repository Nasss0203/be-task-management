import { Controller } from '@nestjs/common';
import { RolePermissionService } from '../role_permission.service';

@Controller('role-permission')
export class RolePermissionController {
  constructor(private readonly rolePermissionService: RolePermissionService) {}
}
