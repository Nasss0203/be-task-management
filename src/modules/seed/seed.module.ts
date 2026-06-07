import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plan } from '../billing/domain/entities/plan.entity';
import { Feature } from '../features/domain/entities/feature.entity';
import { PlanFeature } from '../plan_features/domain/entities/plan_feature.entity';
import { RolePermission } from '../role_permission/domain/entities/role_permission.entity';
import { Permission } from '../permission/domain/entities/permission.entity';
import { Role } from '../role/domain/entities/role.entity';
import { User } from '../users/domain/entities/user.entity';
import { Workspace } from '../workspaces/domain/entities/workspace.entity';
import { BillingPlanSeedService } from './billing-plan.seed.service';
import { FeatureSeedService } from './feature.seed.service';
import { RbacSeedService } from './rbac.seed.service';
import { SuperAdminSeedService } from './super-admin.seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Permission,
      Feature,
      Plan,
      PlanFeature,
      Role,
      RolePermission,
      User,
      Workspace,
    ]),
  ],
  providers: [
    RbacSeedService,
    BillingPlanSeedService,
    FeatureSeedService,
    SuperAdminSeedService,
  ],
  exports: [
    RbacSeedService,
    BillingPlanSeedService,
    FeatureSeedService,
    SuperAdminSeedService,
  ],
})
export class SeedsModule {}
