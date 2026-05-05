import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FindTaskStatusApplicationImpl } from './applications/find.task-status.application';
import { TaskStatusController } from './controller/task_status.controller';
import { TaskStatus } from './domain/entities/task_status.entity';
import { TASK_STATUS_TYPES } from './interfaces/types';
import { CreateTaskStatusRepositoryImpl } from './repositories/create.task_status.repository';
import { FindTaskStatusRepositoryImpl } from './repositories/find.task-status.repository';
import { CreateTaskStatusServiceImpl } from './services/create.task_status.service';
import { FindTaskStatusServiceImpl } from './services/find.task-status.service';
import { TaskStatusService } from './task_status.service';

@Module({
  imports: [TypeOrmModule.forFeature([TaskStatus])],
  controllers: [TaskStatusController],
  providers: [
    TaskStatusService,
    // Repository
    {
      provide: TASK_STATUS_TYPES.repositories.CreateTaskStatusRepository,
      useClass: CreateTaskStatusRepositoryImpl,
    },
    {
      provide: TASK_STATUS_TYPES.repositories.FindTaskStatusRepository,
      useClass: FindTaskStatusRepositoryImpl,
    },
    // Service
    {
      provide: TASK_STATUS_TYPES.services.CreateTaskStatusService,
      useClass: CreateTaskStatusServiceImpl,
    },
    {
      provide: TASK_STATUS_TYPES.services.FindTaskStatusService,
      useClass: FindTaskStatusServiceImpl,
    },
    // Application

    {
      provide: TASK_STATUS_TYPES.applications.FindTaskStatusApplication,
      useClass: FindTaskStatusApplicationImpl,
    },
  ],
  exports: [
    TASK_STATUS_TYPES.services.CreateTaskStatusService,
    TASK_STATUS_TYPES.repositories.FindTaskStatusRepository,
  ],
})
export class TaskStatusModule {}
