import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRole } from '../user_roles/domain/entities/user_role.entity';
import { UserRolesModule } from '../user_roles/user_roles.module';
import { PermissionController } from './controller/permission.controller';
import { Permission } from './domain/entities/permission.entity';
import { PERMISSION_TYPES } from './interfaces/types';
import { PermissionService } from './permission.service';
import { FindPermissionRepositoryImpl } from './repositories/find-all-permission.repository';
import { FindPermissionServiceImpl } from './services/find-all-permission.service';

@Module({
  imports: [TypeOrmModule.forFeature([Permission, UserRole]), UserRolesModule],
  controllers: [PermissionController],
  providers: [
    PermissionService,
    {
      provide: PERMISSION_TYPES.repositories.FindPermissionRepository,
      useClass: FindPermissionRepositoryImpl,
    },

    {
      provide: PERMISSION_TYPES.services.FindPermissionService,
      useClass: FindPermissionServiceImpl,
    },
  ],
  exports: [
    PERMISSION_TYPES.repositories.FindPermissionRepository,
    PERMISSION_TYPES.services.FindPermissionService,
  ],
})
export class PermissionModule {}
