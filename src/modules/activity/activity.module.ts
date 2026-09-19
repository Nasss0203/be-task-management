import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FindActivityApplicationImpl } from './application/queries/get-activities/get-activities.handler';
import { ActivityController } from './presentation/http/controllers/activity.controller';
import { Activity } from './infrastructure/persistence/typeorm/entities/activity.orm-entity';
import { ACTIVITY_TYPES } from './activity.types';
import { CreateActivityRepositoryImpl } from './infrastructure/persistence/typeorm/repositories/typeorm-create-activity.repository';
import { FindActivityRepositoryImpl } from './infrastructure/persistence/typeorm/repositories/typeorm-find-activity.repository';
import { CreateActivityServiceImpl } from './application/services/create-activity.service';
import { FindActivityServiceImpl } from './application/services/find-activity.service';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Activity]),
    forwardRef(() => IdentityModule),
  ],
  controllers: [ActivityController],
  providers: [
    {
      provide: ACTIVITY_TYPES.services.CreateActivityService,
      useClass: CreateActivityServiceImpl,
    },
    {
      provide: ACTIVITY_TYPES.services.FindActivityService,
      useClass: FindActivityServiceImpl,
    },
    {
      provide: ACTIVITY_TYPES.applications.FindActivityApplication,
      useClass: FindActivityApplicationImpl,
    },

    {
      provide: ACTIVITY_TYPES.repositories.CreateActivityRepository,
      useClass: CreateActivityRepositoryImpl,
    },
    {
      provide: ACTIVITY_TYPES.repositories.FindActivityRepository,
      useClass: FindActivityRepositoryImpl,
    },
  ],
  exports: [
    ACTIVITY_TYPES.services.CreateActivityService,
    ACTIVITY_TYPES.services.FindActivityService,
  ],
})
export class ActivityModule {}
