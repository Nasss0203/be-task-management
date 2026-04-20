import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolePermissionController } from './controller/role_permission.controller';
import { RolePermission } from './domain/entities/role_permission.entity';
import { ROLE_PERMISSION_TYPES } from './interfaces/types';
import { CreateRolePermissionRepositoryImpl } from './repositories/create-role_permission.repository';
import { RolePermissionService } from './role_permission.service';
import { CreateRolePermissionServiceImpl } from './services/create-role_permission.service';

@Module({
  imports: [TypeOrmModule.forFeature([RolePermission])],
  controllers: [RolePermissionController],
  providers: [
    RolePermissionService,
    {
      provide:
        ROLE_PERMISSION_TYPES.repositories.CreateRolePermissionRepository,
      useClass: CreateRolePermissionRepositoryImpl,
    },
    {
      provide: ROLE_PERMISSION_TYPES.services.CreateRolePermissionService,
      useClass: CreateRolePermissionServiceImpl,
    },
  ],
  exports: [ROLE_PERMISSION_TYPES.services.CreateRolePermissionService],
})
export class RolePermissionModule {}
