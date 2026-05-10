import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksModule } from '../tasks/tasks.module';
import { UserWorkspacesModule } from '../user_workspace/user_workspace.module';
import { CreateTaskAssigneeApplicationImpl } from './applications/create.task_assignee.application';
import { DeleteTaskAssigneeApplicationImpl } from './applications/delete.task_assignee.application';
import { TaskAssigneeController } from './controller/task_assignee.controller';
import { TaskAssignee } from './domain/entities/task_assignee.entity';
import { TASK_ASSIGNEE_TYPES } from './interfaces/types';
import { CreateTaskAssigneeRepositoryImpl } from './repositories/create.task_assignee.repository';
import { DeleteTaskAssigneeRepositoryImpl } from './repositories/delete.task_assignee.repository';
import { FindTaskAssigneeRepositoryImpl } from './repositories/find.task_assignee.repository.interface';
import { CreateTaskAssigneeServiceImpl } from './services/create.task_assignee.service';
import { DeleteTaskAssigneeServiceImpl } from './services/delete.task_assignee.service';
import { FindTaskAssigneeServiceImpl } from './services/find.task_assignee.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([TaskAssignee]),
    UserWorkspacesModule,
    forwardRef(() => TasksModule),
  ],
  controllers: [TaskAssigneeController],
  providers: [
    // Application
    {
      provide: TASK_ASSIGNEE_TYPES.applications.CreateTaskAssigneeApplication,
      useClass: CreateTaskAssigneeApplicationImpl,
    },
    {
      provide: TASK_ASSIGNEE_TYPES.applications.DeleteTaskAssigneeApplication,
      useClass: DeleteTaskAssigneeApplicationImpl,
    },
    // Service
    {
      provide: TASK_ASSIGNEE_TYPES.services.CreateTaskAssigneeService,
      useClass: CreateTaskAssigneeServiceImpl,
    },
    {
      provide: TASK_ASSIGNEE_TYPES.services.DeleteTaskAssigneeService,
      useClass: DeleteTaskAssigneeServiceImpl,
    },
    // Service
    {
      provide: TASK_ASSIGNEE_TYPES.services.FindTaskAssigneeService,
      useClass: FindTaskAssigneeServiceImpl,
    },
    // Repository
    {
      provide: TASK_ASSIGNEE_TYPES.repositories.CreateTaskAssigneeRepository,
      useClass: CreateTaskAssigneeRepositoryImpl,
    },
    {
      provide: TASK_ASSIGNEE_TYPES.repositories.DeleteTaskAssigneeRepository,
      useClass: DeleteTaskAssigneeRepositoryImpl,
    },
    {
      provide: TASK_ASSIGNEE_TYPES.repositories.FindTaskAssigneeRepository,
      useClass: FindTaskAssigneeRepositoryImpl,
    },
  ],
  exports: [TASK_ASSIGNEE_TYPES.applications.CreateTaskAssigneeApplication],
})
export class TaskAssigneeModule {}
