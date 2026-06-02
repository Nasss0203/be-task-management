import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateFeatureApplicationImpl } from './applications/create.feature.application';
import { DeleteFeatureApplicationImpl } from './applications/delete.feature.application';
import { FindFeatureApplicationImpl } from './applications/find.feature.application';
import { UpdateFeatureApplicationImpl } from './applications/update.feature.application';
import { FeaturesController } from './controller/features.controller';
import { Feature } from './domain/entities/feature.entity';
import { FEATURE_TYPES } from './interfaces/types';
import { CreateFeatureRepositoryImpl } from './repositories/create.feature.repository';
import { DeleteFeatureRepositoryImpl } from './repositories/delete.feature.repository';
import { FindFeatureRepositoryImpl } from './repositories/find.feature.repository';
import { UpdateFeatureRepositoryImpl } from './repositories/update.feature.repository';
import { CreateFeatureServiceImpl } from './services/create.feature.service';
import { DeleteFeatureServiceImpl } from './services/delete.feature.service';
import { FindFeatureServiceImpl } from './services/find.feature.service';
import { UpdateFeatureServiceImpl } from './services/update.feature.service';

@Module({
  imports: [TypeOrmModule.forFeature([Feature])],
  controllers: [FeaturesController],
  providers: [
    {
      provide: FEATURE_TYPES.repositories.CreateFeatureRepository,
      useClass: CreateFeatureRepositoryImpl,
    },
    {
      provide: FEATURE_TYPES.repositories.FindFeatureRepository,
      useClass: FindFeatureRepositoryImpl,
    },
    {
      provide: FEATURE_TYPES.repositories.UpdateFeatureRepository,
      useClass: UpdateFeatureRepositoryImpl,
    },
    {
      provide: FEATURE_TYPES.repositories.DeleteFeatureRepository,
      useClass: DeleteFeatureRepositoryImpl,
    },
    {
      provide: FEATURE_TYPES.services.CreateFeatureService,
      useClass: CreateFeatureServiceImpl,
    },
    {
      provide: FEATURE_TYPES.services.FindFeatureService,
      useClass: FindFeatureServiceImpl,
    },
    {
      provide: FEATURE_TYPES.services.UpdateFeatureService,
      useClass: UpdateFeatureServiceImpl,
    },
    {
      provide: FEATURE_TYPES.services.DeleteFeatureService,
      useClass: DeleteFeatureServiceImpl,
    },
    {
      provide: FEATURE_TYPES.applications.CreateFeatureApplication,
      useClass: CreateFeatureApplicationImpl,
    },
    {
      provide: FEATURE_TYPES.applications.FindFeatureApplication,
      useClass: FindFeatureApplicationImpl,
    },
    {
      provide: FEATURE_TYPES.applications.UpdateFeatureApplication,
      useClass: UpdateFeatureApplicationImpl,
    },
    {
      provide: FEATURE_TYPES.applications.DeleteFeatureApplication,
      useClass: DeleteFeatureApplicationImpl,
    },
  ],
  exports: [
    FEATURE_TYPES.services.CreateFeatureService,
    FEATURE_TYPES.services.FindFeatureService,
    FEATURE_TYPES.services.UpdateFeatureService,
    FEATURE_TYPES.services.DeleteFeatureService,
  ],
})
export class FeaturesModule {}
