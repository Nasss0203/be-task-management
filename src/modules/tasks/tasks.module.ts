import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SprintsModule } from '../sprints/sprints.module';
import { TaskPriorityModule } from '../task_priority/task_priority.module';
import { TaskStatusModule } from '../task_status/task_status.module';
import { UserWorkspacesModule } from '../user_workspace/user_workspace.module';
import { CreateTaskApplicationImpl } from './applications/create-task.application';
import { FindTaskApplicationImpl } from './applications/find-task.application';
import { MoveTaskSprintApplicationImpl } from './applications/move-task-sprint.application';
import { UpdateTaskApplicationImpl } from './applications/update-task.application';
import { TasksController } from './controller/tasks.controller';
import { Task } from './domain/entities/task.entity';
import { TASK_TYPES } from './interfaces/types';
import { CreateTaskRepositoryImpl } from './repositories/create.tasks.repository';
import { FindTaskRepositoryImpl } from './repositories/find-task.repository';
import { MoveTaskSprintRepositoryImpl } from './repositories/move-task-sprint.repository';
import { UpdateTaskRepositoryImpl } from './repositories/update.task.repository';
import { CreateTaskServiceImpl } from './services/create-tasks.service';
import { FindTaskServiceImpl } from './services/find-task.service';
import { MoveTaskSprintServiceImpl } from './services/move-task-sprint.service';
import { UpdateTaskServiceImpl } from './services/update-task.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task]),
    TaskStatusModule,
    TaskPriorityModule,
    SprintsModule,
    UserWorkspacesModule,
  ],
  controllers: [TasksController],
  providers: [
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
    {
      provide: TASK_TYPES.applications.MoveTaskSprintApplication,
      useClass: MoveTaskSprintApplicationImpl,
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
    {
      provide: TASK_TYPES.repositories.MoveTaskSprintRepository,
      useClass: MoveTaskSprintRepositoryImpl,
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
    {
      provide: TASK_TYPES.services.MoveTaskSprintService,
      useClass: MoveTaskSprintServiceImpl,
    },
  ],
  exports: [
    TASK_TYPES.services.CreateTaskService,
    TASK_TYPES.services.FindTaskService,
  ],
})
export class TasksModule {}
