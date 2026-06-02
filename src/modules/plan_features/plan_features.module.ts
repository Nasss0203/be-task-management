import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreatePlanFeatureApplicationImpl } from './applications/create.plan_feature.application';
import { DeletePlanFeatureApplicationImpl } from './applications/delete.plan_feature.application';
import { FindPlanFeatureApplicationImpl } from './applications/find.plan_feature.application';
import { UpdatePlanFeatureApplicationImpl } from './applications/update.plan_feature.application';
import { PlanFeaturesController } from './controller/plan_features.controller';
import { PlanFeature } from './domain/entities/plan_feature.entity';
import { PLAN_FEATURE_TYPES } from './interfaces/types';
import { CreatePlanFeatureRepositoryImpl } from './repositories/create.plan_feature.repository';
import { DeletePlanFeatureRepositoryImpl } from './repositories/delete.plan_feature.repository';
import { FindPlanFeatureRepositoryImpl } from './repositories/find.plan_feature.repository';
import { UpdatePlanFeatureRepositoryImpl } from './repositories/update.plan_feature.repository';
import { CreatePlanFeatureServiceImpl } from './services/create.plan_feature.service';
import { DeletePlanFeatureServiceImpl } from './services/delete.plan_feature.service';
import { FindPlanFeatureServiceImpl } from './services/find.plan_feature.service';
import { UpdatePlanFeatureServiceImpl } from './services/update.plan_feature.service';

@Module({
  imports: [TypeOrmModule.forFeature([PlanFeature])],
  controllers: [PlanFeaturesController],
  providers: [
    {
      provide: PLAN_FEATURE_TYPES.repositories.CreatePlanFeatureRepository,
      useClass: CreatePlanFeatureRepositoryImpl,
    },
    {
      provide: PLAN_FEATURE_TYPES.repositories.FindPlanFeatureRepository,
      useClass: FindPlanFeatureRepositoryImpl,
    },
    {
      provide: PLAN_FEATURE_TYPES.repositories.UpdatePlanFeatureRepository,
      useClass: UpdatePlanFeatureRepositoryImpl,
    },
    {
      provide: PLAN_FEATURE_TYPES.repositories.DeletePlanFeatureRepository,
      useClass: DeletePlanFeatureRepositoryImpl,
    },
    {
      provide: PLAN_FEATURE_TYPES.services.CreatePlanFeatureService,
      useClass: CreatePlanFeatureServiceImpl,
    },
    {
      provide: PLAN_FEATURE_TYPES.services.FindPlanFeatureService,
      useClass: FindPlanFeatureServiceImpl,
    },
    {
      provide: PLAN_FEATURE_TYPES.services.UpdatePlanFeatureService,
      useClass: UpdatePlanFeatureServiceImpl,
    },
    {
      provide: PLAN_FEATURE_TYPES.services.DeletePlanFeatureService,
      useClass: DeletePlanFeatureServiceImpl,
    },
    {
      provide: PLAN_FEATURE_TYPES.applications.CreatePlanFeatureApplication,
      useClass: CreatePlanFeatureApplicationImpl,
    },
    {
      provide: PLAN_FEATURE_TYPES.applications.FindPlanFeatureApplication,
      useClass: FindPlanFeatureApplicationImpl,
    },
    {
      provide: PLAN_FEATURE_TYPES.applications.UpdatePlanFeatureApplication,
      useClass: UpdatePlanFeatureApplicationImpl,
    },
    {
      provide: PLAN_FEATURE_TYPES.applications.DeletePlanFeatureApplication,
      useClass: DeletePlanFeatureApplicationImpl,
    },
  ],
  exports: [
    PLAN_FEATURE_TYPES.services.CreatePlanFeatureService,
    PLAN_FEATURE_TYPES.services.FindPlanFeatureService,
    PLAN_FEATURE_TYPES.services.UpdatePlanFeatureService,
    PLAN_FEATURE_TYPES.services.DeletePlanFeatureService,
  ],
})
export class PlanFeaturesModule {}
