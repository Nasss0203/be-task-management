import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SprintsModule } from '../sprints/sprints.module';
import { TaskPriorityModule } from '../task_priority/task_priority.module';
import { TaskStatusModule } from '../task_status/task_status.module';
import { UserWorkspacesModule } from '../user_workspace/user_workspace.module';
import { CreateTaskApplicationImpl } from './applications/create-task.application';
import { DeleteTaskApplicationImpl } from './applications/delete-task.application';
import { FindTaskApplicationImpl } from './applications/find-task.application';
import { MoveTaskSprintApplicationImpl } from './applications/move-task-sprint.application';
import { RemoveTaskFromSprintApplicationImpl } from './applications/remove-task-sprint.application';
import { UpdateTaskApplicationImpl } from './applications/update-task.application';
import { TasksController } from './controller/tasks.controller';
import { Task } from './domain/entities/task.entity';
import { TASK_TYPES } from './interfaces/types';
import { CreateTaskRepositoryImpl } from './repositories/create.tasks.repository';
import { DeleteTaskRepositoryImpl } from './repositories/delete-task.repository';
import { FindTaskRepositoryImpl } from './repositories/find-task.repository';
import { MarkDoneTasksCompletedAtInSprintRepositoryImpl } from './repositories/mark-done-tasks-completed-at-in-sprint.repository';
import { MoveTaskSprintRepositoryImpl } from './repositories/move-task-sprint.repository';
import { MoveTasksToBacklogBySprintRepositoryImpl } from './repositories/move-tasks-to-backlog-by-sprint.repository';
import { MoveUnfinishedTasksToBacklogRepositoryImpl } from './repositories/move-unfinished-tasks-to-backlog.repository';
import { UpdateTaskRepositoryImpl } from './repositories/update.task.repository';
import { CreateTaskServiceImpl } from './services/create-tasks.service';
import { DeleteTaskServiceImpl } from './services/delete-task.service';
import { FindTaskServiceImpl } from './services/find-task.service';
import { MarkDoneTasksCompletedAtInSprintServiceImpl } from './services/mark-done-tasks-completed-at-in-sprint.service';
import { MoveTaskSprintServiceImpl } from './services/move-task-sprint.service';
import { MoveTasksToBacklogBySprintServiceImpl } from './services/move-tasks-to-backlog-by-sprint.service';
import { MoveUnfinishedTasksToBacklogServiceImpl } from './services/move-unfinished-tasks-to-backlog.service';
import { RemoveTaskFromSprintServiceImpl } from './services/remove-task-sprint.service';
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
    {
      provide: TASK_TYPES.applications.DeleteTaskApplication,
      useClass: DeleteTaskApplicationImpl,
    },
    {
      provide: TASK_TYPES.applications.RemoveTaskFromSprintApplication,
      useClass: RemoveTaskFromSprintApplicationImpl,
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
    {
      provide: TASK_TYPES.repositories.DeleteTaskRepository,
      useClass: DeleteTaskRepositoryImpl,
    },
    {
      provide: TASK_TYPES.repositories.MoveUnfinishedTasksToBacklogRepository,
      useClass: MoveUnfinishedTasksToBacklogRepositoryImpl,
    },
    {
      provide:
        TASK_TYPES.repositories.MarkDoneTasksCompletedAtInSprintRepository,
      useClass: MarkDoneTasksCompletedAtInSprintRepositoryImpl,
    },
    {
      provide: TASK_TYPES.repositories.MoveTasksToBacklogBySprintRepository,
      useClass: MoveTasksToBacklogBySprintRepositoryImpl,
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
    {
      provide: TASK_TYPES.services.DeleteTaskService,
      useClass: DeleteTaskServiceImpl,
    },
    {
      provide: TASK_TYPES.services.RemoveTaskFromSprintService,
      useClass: RemoveTaskFromSprintServiceImpl,
    },
    {
      provide: TASK_TYPES.services.MoveUnfinishedTasksToBacklogService,
      useClass: MoveUnfinishedTasksToBacklogServiceImpl,
    },
    {
      provide: TASK_TYPES.services.MarkDoneTasksCompletedAtInSprintService,
      useClass: MarkDoneTasksCompletedAtInSprintServiceImpl,
    },
    {
      provide: TASK_TYPES.services.MoveTasksToBacklogBySprintService,
      useClass: MoveTasksToBacklogBySprintServiceImpl,
    },
  ],
  exports: [
    TASK_TYPES.services.CreateTaskService,
    TASK_TYPES.services.FindTaskService,
    TASK_TYPES.services.MoveUnfinishedTasksToBacklogService,
    TASK_TYPES.repositories.UpdateTaskRepository,
    TASK_TYPES.services.MarkDoneTasksCompletedAtInSprintService,
    TASK_TYPES.services.MoveTasksToBacklogBySprintService,
  ],
})
export class TasksModule {}
