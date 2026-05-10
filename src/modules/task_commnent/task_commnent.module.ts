import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksModule } from '../tasks/tasks.module';
import { UserWorkspacesModule } from '../user_workspace/user_workspace.module';
import { CreateTaskCommentApplicationImpl } from './applications/create.task-comment.application';
import { FindTaskCommentApplicationImpl } from './applications/find.task-comment.application';
import { TaskCommnentController } from './controller/task_commnent.controller';
import { TaskComment } from './domain/entities/task_commnent.entity';
import { TASK_COMMENT_TYPES } from './interfaces/types';
import { CreateTaskCommentRepositoryImpl } from './repositories/create.task_commnent.repository';
import { FindTaskCommentReposirotyImpl } from './repositories/find.task_comment.reposiroty';
import { CreateTaskCommentServiceImpl } from './services/create.task_commnent.service';
import { FindTaskCommentServiceImpl } from './services/find.task_commnent.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([TaskComment]),
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
    // Repository
    {
      provide: TASK_COMMENT_TYPES.repositories.CreateTaskCommentRepository,
      useClass: CreateTaskCommentRepositoryImpl,
    },
    {
      provide: TASK_COMMENT_TYPES.repositories.FindTaskCommentReposiroty,
      useClass: FindTaskCommentReposirotyImpl,
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
  ],
  exports: [TASK_COMMENT_TYPES.services.CreateTaskCommentService],
})
export class TaskCommnentModule {}
