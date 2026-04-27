import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Board } from '../boards/domain/entities/board.entity';
import { Project } from '../projects/domain/entities/project.entity';
import { ProjectsModule } from '../projects/projects.module';
import { Task } from '../tasks/domain/entities/task.entity';
import { TasksModule } from '../tasks/tasks.module';
import { UserWorkspace } from '../user_workspace/domain/entities/user_workspace.entity';
import { UserWorkspacesModule } from '../user_workspace/user_workspace.module';
import { Workspace } from '../workspaces/domain/entities/workspace.entity';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { AdminService } from './admin.service';
import { AdminFindAllWorkspaceApplicationImpl } from './applications/admin-findAll-workspace.application';
import { AdminWorkspaceOverviewApplicationImpl } from './applications/workspace-overview.application';
import { AdminController } from './controller/admin.controller';
import { ADMIN_TYPES } from './interfaces/types';
import { AdminWorkspaceOverviewRepositoryImpl } from './repositories/admin-workspace-overview.repository';
import { AdminWorkspaceOverviewServiceImpl } from './services/admin-workspace-overview.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Workspace, UserWorkspace, Project, Board, Task]),
    WorkspacesModule,
    TasksModule,
    ProjectsModule,
    UserWorkspacesModule,
  ],
  controllers: [AdminController],
  providers: [
    AdminService,
    {
      provide: ADMIN_TYPES.applications.AdminFindAllWorkspaceApplication,
      useClass: AdminFindAllWorkspaceApplicationImpl,
    },
    {
      provide: ADMIN_TYPES.applications.AdminWorkspaceOverviewApplication,
      useClass: AdminWorkspaceOverviewApplicationImpl,
    },
    {
      provide: ADMIN_TYPES.repositories.AdminWorkspaceOverviewRepository,
      useClass: AdminWorkspaceOverviewRepositoryImpl,
    },
    {
      provide: ADMIN_TYPES.services.AdminWorkspaceOverviewService,
      useClass: AdminWorkspaceOverviewServiceImpl,
    },
  ],
})
export class AdminModule {}
