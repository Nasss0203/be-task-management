import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plan } from '../billing/domain/entities/plan.entity';
import { Permission } from '../permission/domain/entities/permission.entity';
import { BillingPlanSeedService } from './billing-plan.seed.service';
import { RbacSeedService } from './rbac.seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([Permission, Plan])],
  providers: [RbacSeedService, BillingPlanSeedService],
  exports: [RbacSeedService, BillingPlanSeedService],
})
export class SeedsModule {}
