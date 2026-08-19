import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkspaceMemberOrmEntity } from '../workspace/infrastructure/persistence/typeorm/entities/workspace-member.orm-entity';
import { PermissionController } from './controller/permission.controller';
import { Permission } from './domain/entities/permission.entity';
import { PERMISSION_TYPES } from './interfaces/types';
import { PermissionService } from './permission.service';
import { FindPermissionRepositoryImpl } from './repositories/find-all-permission.repository';
import { FindPermissionServiceImpl } from './services/find-all-permission.service';

@Module({
  imports: [TypeOrmModule.forFeature([Permission, WorkspaceMemberOrmEntity])],
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
