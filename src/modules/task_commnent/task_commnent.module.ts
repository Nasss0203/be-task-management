import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityModule } from '../activity/activity.module';
import { TasksModule } from '../tasks/tasks.module';
import { UserWorkspacesModule } from '../user_workspace/user_workspace.module';
import { CreateTaskCommentApplicationImpl } from './applications/create.task-comment.application';
import { FindTaskCommentApplicationImpl } from './applications/find.task-comment.application';
import { TaskCommnentController } from './controller/task_commnent.controller';
import { TaskComment } from './domain/entities/task_commnent.entity';
import { TASK_COMMENT_TYPES } from './interfaces/types';
import { CreateTaskCommentRepositoryImpl } from './repositories/create.task_commnent.repository';
import { FindTaskCommentReposirotyImpl } from './repositories/find.task_comment.reposiroty';
import { UpdateTaskCommentRepositoryImpl } from './repositories/update.task-comment.repository';
import { DeleteTaskCommentRepositoryImpl } from './repositories/delete.task-comment.repository';
import { CreateTaskCommentServiceImpl } from './services/create.task_commnent.service';
import { FindTaskCommentServiceImpl } from './services/find.task_commnent.service';
import { UpdateTaskCommentServiceImpl } from './services/update.task-comment.service';
import { DeleteTaskCommentServiceImpl } from './services/delete.task-comment.service';
import { UpdateTaskCommentApplicationImpl } from './applications/update.task-comment.application';
import { DeleteTaskCommentApplicationImpl } from './applications/delete.task-comment.application';

@Module({
  imports: [
    TypeOrmModule.forFeature([TaskComment]),
    ActivityModule,
    forwardRef(() => TasksModule),
    UserWorkspacesModule,
  ],
  controllers: [TaskCommnentController],
  providers: [
    // Application
    {
      provide: TASK_COMMENT_TYPES.applications.CreateTaskCommentApplication,
      useClass: CreateTaskCommentApplicationImpl,
    },
    {
      provide: TASK_COMMENT_TYPES.applications.FindTaskCommentApplication,
      useClass: FindTaskCommentApplicationImpl,
    },
    {
      provide: TASK_COMMENT_TYPES.applications.UpdateTaskCommentApplication,
      useClass: UpdateTaskCommentApplicationImpl,
    },
    {
      provide: TASK_COMMENT_TYPES.applications.DeleteTaskCommentApplication,
      useClass: DeleteTaskCommentApplicationImpl,
    },
    // Repository
    {
      provide: TASK_COMMENT_TYPES.repositories.CreateTaskCommentRepository,
      useClass: CreateTaskCommentRepositoryImpl,
    },
    {
      provide: TASK_COMMENT_TYPES.repositories.FindTaskCommentReposiroty,
      useClass: FindTaskCommentReposirotyImpl,
    },
    {
      provide: TASK_COMMENT_TYPES.repositories.UpdateTaskCommentRepository,
      useClass: UpdateTaskCommentRepositoryImpl,
    },
    {
      provide: TASK_COMMENT_TYPES.repositories.DeleteTaskCommentRepository,
      useClass: DeleteTaskCommentRepositoryImpl,
    },
    // Service
    {
      provide: TASK_COMMENT_TYPES.services.CreateTaskCommentService,
      useClass: CreateTaskCommentServiceImpl,
    },
    {
      provide: TASK_COMMENT_TYPES.services.FindTaskCommentService,
      useClass: FindTaskCommentServiceImpl,
    },
    {
      provide: TASK_COMMENT_TYPES.services.UpdateTaskCommentService,
      useClass: UpdateTaskCommentServiceImpl,
    },
    {
      provide: TASK_COMMENT_TYPES.services.DeleteTaskCommentService,
      useClass: DeleteTaskCommentServiceImpl,
    },
  ],
  exports: [TASK_COMMENT_TYPES.services.CreateTaskCommentService],
})
export class TaskCommnentModule {}
