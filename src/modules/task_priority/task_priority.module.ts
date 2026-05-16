import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FindTaskPriorityApplicationImpl } from './applications/find.task-priority.application';
import { TaskPriorityController } from './controller/task_priority.controller';
import { TaskPriority } from './domain/entities/task_priority.entity';
import { TASK_PRIORITY_TYPES } from './interfaces/types';
import { CreateTaskPriorityRepositoryImpl } from './repositories/create.task_priority.repository';
import { FindTaskPriorityRepositoryImpl } from './repositories/find.task-priority.repository';
import { CreateTaskPriorityServiceImpl } from './services/create.task_priority.service';
import { FindTaskPriorityServiceImpl } from './services/find.task-priority.service';

@Module({
  imports: [TypeOrmModule.forFeature([TaskPriority])],
  controllers: [TaskPriorityController],
  providers: [
    // Application
    {
      provide: TASK_PRIORITY_TYPES.applications.FindTaskPriorityApplication,
      useClass: FindTaskPriorityApplicationImpl,
    },
    // Repository
    {
      provide: TASK_PRIORITY_TYPES.repositories.CreateTaskPriorityRepository,
      useClass: CreateTaskPriorityRepositoryImpl,
    },
    {
      provide: TASK_PRIORITY_TYPES.repositories.FindTaskPriorityRepository,
      useClass: FindTaskPriorityRepositoryImpl,
    },
    // Service
    {
      provide: TASK_PRIORITY_TYPES.services.CreateTaskPriorityService,
      useClass: CreateTaskPriorityServiceImpl,
    },
    {
      provide: TASK_PRIORITY_TYPES.services.FindTaskPriorityService,
      useClass: FindTaskPriorityServiceImpl,
    },
  ],
  exports: [TASK_PRIORITY_TYPES.services.CreateTaskPriorityService],
})
export class TaskPriorityModule {}
