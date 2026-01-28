import { Module } from '@nestjs/common';
import { RolePermissionService } from './role_permission.service';
import { RolePermissionController } from './role_permission.controller';

@Module({
  controllers: [RolePermissionController],
  providers: [RolePermissionService],
})
export class RolePermissionModule {}
