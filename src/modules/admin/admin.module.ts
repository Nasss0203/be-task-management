import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmUnitOfWork } from 'src/common/helper/unit-work.typeorm';
import { Board } from '../boards/domain/entities/board.entity';
import { Project } from '../projects/domain/entities/project.entity';
import { ProjectsModule } from '../projects/projects.module';
import { Task } from '../tasks/domain/entities/task.entity';
import { TasksModule } from '../tasks/tasks.module';
import { UserWorkspace } from '../user_workspace/domain/entities/user_workspace.entity';
import { UserWorkspacesModule } from '../user_workspace/user_workspace.module';
import { User } from '../users/domain/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { Workspace } from '../workspaces/domain/entities/workspace.entity';
import { WORKSPACE_TYPES } from '../workspaces/interfaces/types';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { AdminService } from './admin.service';
import { AdminDashboardSummaryApplicationImpl } from './applications/admin-dashboard-summary.application';
import { AdminFindAllWorkspaceApplicationImpl } from './applications/admin-findAll-workspace.application';
import { AdminUpdateWorkspacePlanApplicationImpl } from './applications/admin-update-workspace-plan.application';
import { AdminWorkspaceOverviewApplicationImpl } from './applications/workspace-overview.application';
import { AdminController } from './controller/admin.controller';
import { ADMIN_TYPES } from './interfaces/types';
import { AdminDashboardSummaryRepositoryImpl } from './repositories/admin-dashboard-summary.repository';
import { AdminUpdateWorkspacePlanRepositoryImpl } from './repositories/admin-update-workspace-plan.repository';
import { AdminWorkspaceOverviewRepositoryImpl } from './repositories/admin-workspace-overview.repository';
import { AdminDashboardSummaryServiceImpl } from './services/admin-dashboard-summary.service';
import { AdminUpdateWorkspacePlanServiceImpl } from './services/admin-update-workspace-plan.service';
import { AdminWorkspaceOverviewServiceImpl } from './services/admin-workspace-overview.service';

import { AdminUserGrowthApplicationImpl } from './applications/admin-user-growth.application';
import { AdminUserGrowthRepositoryImpl } from './repositories/admin-user-growth.repository';
import { AdminUserGrowthServiceImpl } from './services/admin-user-growth.service';
import { UserActivity } from '../user_activity/domain/entities/user_activity.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Workspace,
      UserWorkspace,
      Project,
      Board,
      Task,
      User,
      UserActivity,
    ]),
    WorkspacesModule,
    TasksModule,
    ProjectsModule,
    UserWorkspacesModule,
    UsersModule,
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
    {
      provide: ADMIN_TYPES.applications.AdminUpdateWorkspacePlanApplication,
      useClass: AdminUpdateWorkspacePlanApplicationImpl,
    },
    {
      provide: ADMIN_TYPES.repositories.AdminUpdateWorkspacePlanRepository,
      useClass: AdminUpdateWorkspacePlanRepositoryImpl,
    },
    {
      provide: ADMIN_TYPES.services.AdminUpdateWorkspacePlanService,
      useClass: AdminUpdateWorkspacePlanServiceImpl,
    },
    {
      provide: WORKSPACE_TYPES.uow.UnitOfWork,
      useClass: TypeOrmUnitOfWork,
    },
    {
      provide: ADMIN_TYPES.applications.AdminDashboardSummaryApplication,
      useClass: AdminDashboardSummaryApplicationImpl,
    },
    {
      provide: ADMIN_TYPES.repositories.AdminDashboardSummaryRepository,
      useClass: AdminDashboardSummaryRepositoryImpl,
    },
    {
      provide: ADMIN_TYPES.services.AdminDashboardSummaryService,
      useClass: AdminDashboardSummaryServiceImpl,
    },
    {
      provide: ADMIN_TYPES.applications.AdminUserGrowthApplication,
      useClass: AdminUserGrowthApplicationImpl,
    },
    {
      provide: ADMIN_TYPES.repositories.AdminUserGrowthRepository,
      useClass: AdminUserGrowthRepositoryImpl,
    },
    {
      provide: ADMIN_TYPES.services.AdminUserGrowthService,
      useClass: AdminUserGrowthServiceImpl,
    },
  ],
})
export class AdminModule {}
