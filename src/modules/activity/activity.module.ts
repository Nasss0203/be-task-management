import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GetActivitiesHandler } from './application/queries/get-activities/get-activities.handler';
import { ActivityController } from './presentation/http/controllers/activity.controller';
import { Activity } from './infrastructure/persistence/typeorm/entities/activity.orm-entity';
import { ACTIVITY_TYPES } from './activity.types';
import { TypeOrmActivityRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-activity.repository';
import { CreateActivityServiceImpl } from './application/services/create-activity.service';
import { IdentityModule } from '../identity/identity.module';
import { PermissionModule } from '../permission/permission.module';
import { GetPageActivitiesHandler } from './application/queries/get-page-activities/get-page-activities.handler';
import { GetPageActivitySummaryHandler } from './application/queries/get-page-activity-summary/get-page-activity-summary.handler';
import { TypeOrmPageActivityDetailsReader } from './infrastructure/persistence/typeorm/readers/typeorm-page-activity-details.reader';
import { GetWorkspaceActivitiesHandler } from './application/queries/get-workspace-activities/get-workspace-activities.handler';

@Module({
  imports: [
    TypeOrmModule.forFeature([Activity]),
    forwardRef(() => IdentityModule),
    PermissionModule,
  ],
  controllers: [ActivityController],
  providers: [
    {
      provide: ACTIVITY_TYPES.services.CreateActivityService,
      useClass: CreateActivityServiceImpl,
    },
    GetActivitiesHandler,
    GetPageActivitiesHandler,
    GetPageActivitySummaryHandler,
    GetWorkspaceActivitiesHandler,
    {
      provide: ACTIVITY_TYPES.ports.PageActivityDetailsReader,
      useClass: TypeOrmPageActivityDetailsReader,
    },
    {
      provide: ACTIVITY_TYPES.repositories.ActivityRepository,
      useClass: TypeOrmActivityRepository,
    },
  ],
  exports: [
    ACTIVITY_TYPES.services.CreateActivityService,
    // Content records Page edits through it (merged per burst).
    ACTIVITY_TYPES.repositories.ActivityRepository,
  ],
})
export class ActivityModule {}
