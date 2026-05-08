import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmUnitOfWork } from 'src/common/helper/unit-work.typeorm';
import { BoardsModule } from '../boards/boards.module';
import { PageModule } from '../page/page.module';
import { PageBlockModule } from '../page_block/page_block.module';
import { PermissionModule } from '../permission/permission.module';
import { Project } from '../projects/domain/entities/project.entity';
import { ProjectsModule } from '../projects/projects.module';
import { Role } from '../role/domain/entities/role.entity';
import { RoleModule } from '../role/role.module';
import { RolePermissionModule } from '../role_permission/role_permission.module';
import { TaskPriorityModule } from '../task_priority/task_priority.module';
import { TaskStatusModule } from '../task_status/task_status.module';
import { TasksModule } from '../tasks/tasks.module';
import { UserRolesModule } from '../user_roles/user_roles.module';
import { UserWorkspace } from '../user_workspace/domain/entities/user_workspace.entity';
import { UserWorkspacesModule } from '../user_workspace/user_workspace.module';
import { AccessWorkspaceApplicationImpl } from './applications/access-workspace.application';
import { AdminFindAllWorkspaceApplicationImpl } from './applications/admin-findAll-workspace.application';
import { CreateWorkspaceTemplateApplicationImpl } from './applications/create-workspace-template.application';
import { CreateWorkspaceApplicationImpl } from './applications/create-workspace.application';
import { FindWorkspaceApplicationImpl } from './applications/find.workspace.application';
import { WorkspaceTrashApplicationImpl } from './applications/workspace-trash.application';
import { WorkspacesController } from './controller/workspaces.controller';
import { Workspace } from './domain/entities/workspace.entity';
import { WORKSPACE_TYPES } from './interfaces/types';
import { AccessWorkspaceRepositoryImpl } from './repositories/access-workspace.repository';
import { AdminFindAllWorkspaceRepositoryImpl } from './repositories/admin-findAll-workspace.repository';
import { CreateWorkspaceTemplateRepositoryImpl } from './repositories/create-workspace-template.repository';
import { WorkspaceRepositoryImpl } from './repositories/create-workspace.repository';
import { FindWorkspaceRepositoryImpl } from './repositories/find.workspace.repository';
import { WorkspaceTrashRepositoryImpl } from './repositories/workspace-trash.repository';
import { AccessWorkspaceServiceImpl } from './services/access-workspace.service';
import { AdminFindAllWorkspaceServiceImpl } from './services/admin-findAll-workspace.service.interface';
import { CreateWorkspaceTemplateServiceImpl } from './services/create-workspace-template.service';
import { CreateWorkspaceServiceImpl } from './services/create-workspace.service';
import { FindWorkspaceServiceImpl } from './services/find.workspace.service';
import { WorkspaceTrashServiceImpl } from './services/workspace-trash.service';

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
    PermissionModule,
    RolePermissionModule,
  ],
  controllers: [WorkspacesController],
  providers: [
    //Application
    {
      provide: WORKSPACE_TYPES.applications.CreateWorkspaceApplication,
      useClass: CreateWorkspaceApplicationImpl,
    },
    {
      provide: WORKSPACE_TYPES.applications.CreateWorkspaceTemplateApplication,
      useClass: CreateWorkspaceTemplateApplicationImpl,
    },
    {
      provide: WORKSPACE_TYPES.applications.FindWorkspaceApplication,
      useClass: FindWorkspaceApplicationImpl,
    },
    {
      provide: WORKSPACE_TYPES.applications.AccessWorkspaceApplication,
      useClass: AccessWorkspaceApplicationImpl,
    },
    {
      provide: WORKSPACE_TYPES.applications.WorkspaceTrashApplication,
      useClass: WorkspaceTrashApplicationImpl,
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
    {
      provide: WORKSPACE_TYPES.services.AccessWorkspaceService,
      useClass: AccessWorkspaceServiceImpl,
    },
    {
      provide: WORKSPACE_TYPES.services.AdminFindAllWorkspaceService,
      useClass: AdminFindAllWorkspaceServiceImpl,
    },
    {
      provide: WORKSPACE_TYPES.services.CreateWorkspaceTemplateService,
      useClass: CreateWorkspaceTemplateServiceImpl,
    },
    {
      provide: WORKSPACE_TYPES.services.WorkspaceTrashService,
      useClass: WorkspaceTrashServiceImpl,
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
      provide: WORKSPACE_TYPES.repositories.AccessWorkspaceRepository,
      useClass: AccessWorkspaceRepositoryImpl,
    },
    {
      provide: WORKSPACE_TYPES.repositories.AdminFindAllWorkspaceRepository,
      useClass: AdminFindAllWorkspaceRepositoryImpl,
    },
    {
      provide: WORKSPACE_TYPES.repositories.CreateWorkspaceTemplateRepository,
      useClass: CreateWorkspaceTemplateRepositoryImpl,
    },
    {
      provide: WORKSPACE_TYPES.repositories.WorkspaceTrashRepository,
      useClass: WorkspaceTrashRepositoryImpl,
    },
    // Manager
    {
      provide: WORKSPACE_TYPES.uow.UnitOfWork,
      useClass: TypeOrmUnitOfWork,
    },
    {
      provide: WORKSPACE_TYPES.applications.AdminFindAllWorkspaceApplication,
      useClass: AdminFindAllWorkspaceApplicationImpl,
    },
  ],
  exports: [
    WORKSPACE_TYPES.repositories.WorkspaceRepository,
    WORKSPACE_TYPES.services.CreateWorkspaceService,
    WORKSPACE_TYPES.services.AdminFindAllWorkspaceService,
    WORKSPACE_TYPES.services.FindWorkspaceService,
  ],
})
export class WorkspacesModule {}
