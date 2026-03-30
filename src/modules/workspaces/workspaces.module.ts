import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmUnitOfWork } from 'src/common/helper/unit-work.typeorm';
import { BoardsModule } from '../boards/boards.module';
import { PageModule } from '../page/page.module';
import { PageBlockModule } from '../page_block/page_block.module';
import { Project } from '../projects/domain/entities/project.entity';
import { ProjectsModule } from '../projects/projects.module';
import { Role } from '../role/domain/entities/role.entity';
import { RoleModule } from '../role/role.module';
import { TaskPriorityModule } from '../task_priority/task_priority.module';
import { TaskStatusModule } from '../task_status/task_status.module';
import { TasksModule } from '../tasks/tasks.module';
import { UserRolesModule } from '../user_roles/user_roles.module';
import { UserWorkspace } from '../user_workspace/domain/entities/user_workspace.entity';
import { UserWorkspacesModule } from '../user_workspace/user_workspace.module';
import { CreateWorkspaceApplicationImpl } from './applications/create-workspace.application';
import { FindWorkspaceApplicationImpl } from './applications/find.workspace.application';
import { WorkspacesController } from './controller/workspaces.controller';
import { Workspace } from './domain/entities/workspace.entity';
import { WORKSPACE_TYPES } from './interfaces/types';
import { WorkspaceRepositoryImpl } from './repositories/create-workspace.repository';
import { FindWorkspaceRepositoryImpl } from './repositories/find.workspace.repository';
import { CreateWorkspaceServiceImpl } from './services/create-workspace-multi.service';
import { FindWorkspaceServiceImpl } from './services/find.workspace.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Workspace, Role, UserWorkspace, Project]),
    UserWorkspacesModule,
    RoleModule,
    UserRolesModule,
    PageModule,
    ProjectsModule,
    PageBlockModule,
    BoardsModule,
    TaskStatusModule,
    TaskPriorityModule,
    TasksModule,
  ],

  controllers: [WorkspacesController],
  providers: [
    //Application
    {
      provide: WORKSPACE_TYPES.applications.CreateWorkspaceApplication,
      useClass: CreateWorkspaceApplicationImpl,
    },
    {
      provide: WORKSPACE_TYPES.applications.FindWorkspaceApplication,
      useClass: FindWorkspaceApplicationImpl,
    },

    //Service
    {
      provide: WORKSPACE_TYPES.services.CreateWorkspaceService,
      useClass: CreateWorkspaceServiceImpl,
    },
    {
      provide: WORKSPACE_TYPES.services.FindWorkspaceService,
      useClass: FindWorkspaceServiceImpl,
    },

    //Repository
    {
      provide: WORKSPACE_TYPES.repositories.WorkspaceRepository,
      useClass: WorkspaceRepositoryImpl,
    },
    {
      provide: WORKSPACE_TYPES.repositories.FindWorkspaceRepository,
      useClass: FindWorkspaceRepositoryImpl,
    },

    {
      provide: WORKSPACE_TYPES.uow.UnitOfWork,
      useClass: TypeOrmUnitOfWork,
    },
  ],
  exports: [
    WORKSPACE_TYPES.repositories.WorkspaceRepository,
    WORKSPACE_TYPES.services.CreateWorkspaceService,
  ],
})
export class WorkspacesModule {}
