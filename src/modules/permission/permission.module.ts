import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from './domain/entities/permission.entity';
import { PERMISSION_TYPES } from './interfaces/types';
import { PermissionController } from './permission.controller';
import { PermissionService } from './permission.service';
import { FindPermissionRepositoryImpl } from './repositories/find-all-permission.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Permission])],
  controllers: [PermissionController],
  providers: [
    PermissionService,
    {
      provide: PERMISSION_TYPES.repositories.FindPermissionRepository,
      useClass: FindPermissionRepositoryImpl,
    },
  ],
  exports: [PERMISSION_TYPES.repositories.FindPermissionRepository],
})
export class PermissionModule {}
