import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RbacSeedService } from './rbac.seed.service';

import { Permission } from 'src/modules/permission/entities/permission.entity';
import { Role } from 'src/modules/role/entities/role.entity';
import { Workspace } from 'src/modules/workspaces/domain/entities/workspace.entity';
import { RolePermission } from '../role_permission/entities/role_permission.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Permission, Workspace, Role, RolePermission]),
  ],
  providers: [RbacSeedService],
  exports: [RbacSeedService],
})
export class SeedsModule {}
