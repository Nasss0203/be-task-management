import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GetActivitiesHandler } from './application/queries/get-activities/get-activities.handler';
import { ActivityController } from './presentation/http/controllers/activity.controller';
import { Activity } from './infrastructure/persistence/typeorm/entities/activity.orm-entity';
import { ACTIVITY_TYPES } from './activity.types';
import { TypeOrmActivityRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-activity.repository';
import { CreateActivityServiceImpl } from './application/services/create-activity.service';
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
    GetActivitiesHandler,
    {
      provide: ACTIVITY_TYPES.repositories.ActivityRepository,
      useClass: TypeOrmActivityRepository,
    },
  ],
  exports: [ACTIVITY_TYPES.services.CreateActivityService],
})
export class ActivityModule {}
