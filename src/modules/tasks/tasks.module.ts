import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskPriorityModule } from '../task_priority/task_priority.module';
import { TaskStatusModule } from '../task_status/task_status.module';
import { CreateTaskApplicationImpl } from './applications/create-task.application';
import { FindTaskApplicationImpl } from './applications/find-task.application';
import { UpdateTaskApplicationImpl } from './applications/update-task.application';
import { TasksController } from './controller/tasks.controller';
import { Task } from './domain/entities/task.entity';
import { TASK_TYPES } from './interfaces/types';
import { CreateTaskRepositoryImpl } from './repositories/create.tasks.repository';
import { FindTaskRepositoryImpl } from './repositories/find-task.repository';
import { UpdateTaskRepositoryImpl } from './repositories/update.task.repository';
import { CreateTaskServiceImpl } from './services/create-tasks.service';
import { FindTaskServiceImpl } from './services/find-task.service';
import { UpdateTaskServiceImpl } from './services/update-task.service';
import { TasksService } from './tasks.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task]),
    TaskStatusModule,
    TaskPriorityModule,
  ],
  controllers: [TasksController],
  providers: [
    TasksService,
    //Application
    {
      provide: TASK_TYPES.applications.FindTaskApplication,
      useClass: FindTaskApplicationImpl,
    },
    {
      provide: TASK_TYPES.applications.CreateTaskApplication,
      useClass: CreateTaskApplicationImpl,
    },
    {
      provide: TASK_TYPES.applications.UpdateTaskApplication,
      useClass: UpdateTaskApplicationImpl,
    },
    // Repository
    {
      provide: TASK_TYPES.repositories.CreateTaskRepository,
      useClass: CreateTaskRepositoryImpl,
    },
    {
      provide: TASK_TYPES.repositories.FindTaskRepository,
      useClass: FindTaskRepositoryImpl,
    },
    {
      provide: TASK_TYPES.repositories.UpdateTaskRepository,
      useClass: UpdateTaskRepositoryImpl,
    },
    // Service
    {
      provide: TASK_TYPES.services.CreateTaskService,
      useClass: CreateTaskServiceImpl,
    },
    {
      provide: TASK_TYPES.services.FindTaskService,
      useClass: FindTaskServiceImpl,
    },
    {
      provide: TASK_TYPES.services.UpdateTaskService,
      useClass: UpdateTaskServiceImpl,
    },
  ],
  exports: [TASK_TYPES.services.CreateTaskService],
})
export class TasksModule {}
