import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FindTaskApplicationImpl } from './applications/find-task.application';
import { TasksController } from './controller/tasks.controller';
import { Task } from './domain/entities/task.entity';
import { TASK_TYPES } from './interfaces/types';
import { CreateTaskRepositoryImpl } from './repositories/create.tasks.repository';
import { FindTaskRepositoryImpl } from './repositories/find-task.repository';
import { CreateTaskServiceImpl } from './services/create.tasks.service';
import { FindTaskServiceImpl } from './services/find-task.service';
import { TasksService } from './tasks.service';

@Module({
  imports: [TypeOrmModule.forFeature([Task])],
  controllers: [TasksController],
  providers: [
    TasksService,
    //Application
    {
      provide: TASK_TYPES.applications.FindTaskApplication,
      useClass: FindTaskApplicationImpl,
    },
    // Repo
    {
      provide: TASK_TYPES.repositories.CreateTaskRepository,
      useClass: CreateTaskRepositoryImpl,
    },
    {
      provide: TASK_TYPES.repositories.FindTaskRepository,
      useClass: FindTaskRepositoryImpl,
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
  ],
  exports: [TASK_TYPES.services.CreateTaskService],
})
export class TasksModule {}
