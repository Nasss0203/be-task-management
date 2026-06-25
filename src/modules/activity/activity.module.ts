import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FindActivityApplicationImpl } from './applications/find-activity.application';
import { ActivityController } from './controller/activity.controller';
import { Activity } from './domain/entities/activity.entity';
import { ACTIVITY_TYPES } from './interfaces/types';
import { CreateActivityRepositoryImpl } from './repositories/create.activity.repository';
import { FindActivityRepositoryImpl } from './repositories/find.activity.repository';
import { CreateActivityServiceImpl } from './services/create.activity.service';
import { FindActivityServiceImpl } from './services/find.activity.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Activity]), UsersModule],
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
