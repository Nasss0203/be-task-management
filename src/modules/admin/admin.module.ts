import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsModule } from '../projects/projects.module';
import { TasksModule } from '../tasks/tasks.module';
import { UserWorkspacesModule } from '../user_workspace/user_workspace.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { AdminService } from './admin.service';
import { AdminFindAllWorkspaceApplicationImpl } from './applications/admin-findAll-workspace.application';
import { AdminWorkspaceOverviewApplicationImpl } from './applications/workspace-overview.application';
import { AdminController } from './controller/admin.controller';
import { ADMIN_TYPES } from './interfaces/types';

@Module({
  imports: [
    TypeOrmModule.forFeature([]),
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
  ],
})
export class AdminModule {}
