import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityController } from './controller/activity.controller';
import { Activity } from './domain/entities/activity.entity';
import { ACTIVITY_TYPES } from './interfaces/types';
import { CreateActivityRepositoryImpl } from './repositories/create.activity.repository';
import { CreateActivityServiceImpl } from './services/create.activity.service';

@Module({
  imports: [TypeOrmModule.forFeature([Activity])],
  controllers: [ActivityController],
  providers: [
    {
      provide: ACTIVITY_TYPES.services.CreateActivityService,
      useClass: CreateActivityServiceImpl,
    },

    {
      provide: ACTIVITY_TYPES.repositories.CreateActivityRepository,
      useClass: CreateActivityRepositoryImpl,
    },
  ],
  exports: [ACTIVITY_TYPES.services.CreateActivityService],
})
export class ActivityModule {}
