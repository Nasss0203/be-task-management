import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plan } from '../billing/domain/entities/plan.entity';
import { RolePermission } from '../role_permission/domain/entities/role_permission.entity';
import { Permission } from '../permission/domain/entities/permission.entity';
import { Role } from '../role/domain/entities/role.entity';
import { Workspace } from '../workspaces/domain/entities/workspace.entity';
import { BillingPlanSeedService } from './billing-plan.seed.service';
import { RbacSeedService } from './rbac.seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Permission,
      Plan,
      Role,
      RolePermission,
      Workspace,
    ]),
  ],
  providers: [RbacSeedService, BillingPlanSeedService],
  exports: [RbacSeedService, BillingPlanSeedService],
})
export class SeedsModule {}
