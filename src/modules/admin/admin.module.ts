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
import { AdminFindAllWorkspaceApplicationImpl } from './applications/admin-findAll-workspace.application';
import { AdminUpdateWorkspacePlanApplicationImpl } from './applications/admin-update-workspace-plan.application';
import { AdminDashboardSummaryApplicationImpl } from './applications/dashboard/admin-dashboard-summary.application';
import { AdminWorkspaceOverviewApplicationImpl } from './applications/workspace-overview.application';
import { AdminController } from './controller/admin.controller';
import { ADMIN_TYPES } from './interfaces/types';

import { AdminDashboardSummaryRepositoryImpl } from './repositories/dashboard/admin-dashboard-summary.repository';
import { AdminWorkspaceOverviewRepositoryImpl } from './repositories/dashboard/admin-workspace-overview.repository';
import { AdminDashboardSummaryServiceImpl } from './services/dashboard/admin-dashboard-summary.service';
import { AdminUpdateWorkspacePlanServiceImpl } from './services/dashboard/admin-update-workspace-plan.service';
import { AdminWorkspaceOverviewServiceImpl } from './services/dashboard/admin-workspace-overview.service';

import { ConfigModule } from '@nestjs/config';
import { UserActivity } from '../user_activity/domain/entities/user_activity.entity';
import { AdminUserGrowthApplicationImpl } from './applications/admin-user-growth.application';
import { AdminRecentActivityApplicationImpl } from './applications/dashboard/admin-recent-activity.application';
import { AdminRetentionMetricsApplicationImpl } from './applications/dashboard/admin-retention-metrics.application';
import { AdminSystemHealthApplicationImpl } from './applications/dashboard/admin-system-health.application';
import { AdminWorkspaceGrowthApplicationImpl } from './applications/dashboard/admin-workspace-growth.application';
import { AdminWorkspacePlanApplicationImpl } from './applications/dashboard/admin-workspace-plan.application';
import { AdminRecentActivityRepositoryImpl } from './repositories/dashboard/admin-recent-activity.repository';
import { AdminRetentionMetricsRepositoryImpl } from './repositories/dashboard/admin-retention-metrics.repository';
import { AdminWorkspacePlanRepositoryImpl } from './repositories/dashboard/admin-workspace-plan.repository';
import { AdminRecentActivityServiceImpl } from './services/dashboard/admin-recent-activity.service';
import { AdminRetentionMetricsServiceImpl } from './services/dashboard/admin-retention-metrics.service';
import { AdminSystemHealthServiceImpl } from './services/dashboard/admin-system-health.service';
import { AdminUserGrowthServiceImpl } from './services/dashboard/admin-user-growth.service';
import { AdminWorkspaceGrowthServiceImpl } from './services/dashboard/admin-workspace-growth.service';
import { AdminWorkspacePlanServiceImpl } from './services/dashboard/admin-workspace-plan.service';
import { AdminUpdateWorkspacePlanRepositoryImpl } from './repositories/dashboard/admin-update-workspace-plan.repository';
import { AdminSystemHealthRepositoryImpl } from './repositories/dashboard/admin-system-health.repository';
import { AdminUserGrowthRepositoryImpl } from './repositories/dashboard/admin-user-growth.repository';
import { AdminWorkspaceGrowthRepositoryImpl } from './repositories/dashboard/admin-workspace-growth.repository';
import { AdminUserOverviewApplicationImpl } from './applications/user/admin-user-overview.application';
import { AdminUserOverviewRepositoryImpl } from './repositories/user/admin-user-overview.repository';
import { AdminUserOverviewServiceImpl } from './services/user/admin-user-overview.service';

@Module({
  imports: [
    ConfigModule,
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
      provide: ADMIN_TYPES.applications.AdminSystemHealthApplication,
      useClass: AdminSystemHealthApplicationImpl,
    },
    {
      provide: ADMIN_TYPES.applications.AdminRecentActivityApplication,
      useClass: AdminRecentActivityApplicationImpl,
    },
    {
      provide: ADMIN_TYPES.applications.AdminWorkspaceGrowthApplication,
      useClass: AdminWorkspaceGrowthApplicationImpl,
    },
    {
      provide: ADMIN_TYPES.applications.AdminWorkspacePlanApplication,
      useClass: AdminWorkspacePlanApplicationImpl,
    },
    {
      provide: ADMIN_TYPES.applications.AdminRetentionMetricsApplication,
      useClass: AdminRetentionMetricsApplicationImpl,
    },
    {
      provide: ADMIN_TYPES.repositories.AdminWorkspaceOverviewRepository,
      useClass: AdminWorkspaceOverviewRepositoryImpl,
    },
    {
      provide: ADMIN_TYPES.applications.AdminUserOverviewApplication,
      useClass: AdminUserOverviewApplicationImpl,
    },
    {
      provide: ADMIN_TYPES.repositories.AdminRecentActivityRepository,
      useClass: AdminRecentActivityRepositoryImpl,
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
      provide: ADMIN_TYPES.repositories.AdminUserOverviewRepository,
      useClass: AdminUserOverviewRepositoryImpl,
    },
    {
      provide: ADMIN_TYPES.repositories.AdminWorkspacePlanRepository,
      useClass: AdminWorkspacePlanRepositoryImpl,
    },
    {
      provide: ADMIN_TYPES.repositories.AdminRetentionMetricsRepository,
      useClass: AdminRetentionMetricsRepositoryImpl,
    },
    {
      provide: ADMIN_TYPES.repositories.AdminSystemHealthRepository,
      useClass: AdminSystemHealthRepositoryImpl,
    },
    {
      provide: ADMIN_TYPES.services.AdminUpdateWorkspacePlanService,
      useClass: AdminUpdateWorkspacePlanServiceImpl,
    },
    {
      provide: ADMIN_TYPES.services.AdminUserOverviewService,
      useClass: AdminUserOverviewServiceImpl,
    },
    {
      provide: ADMIN_TYPES.services.AdminRecentActivityService,
      useClass: AdminRecentActivityServiceImpl,
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
      provide: ADMIN_TYPES.repositories.AdminWorkspaceGrowthRepository,
      useClass: AdminWorkspaceGrowthRepositoryImpl,
    },
    {
      provide: ADMIN_TYPES.services.AdminUserGrowthService,
      useClass: AdminUserGrowthServiceImpl,
    },
    {
      provide: ADMIN_TYPES.services.AdminWorkspacePlanService,
      useClass: AdminWorkspacePlanServiceImpl,
    },
    {
      provide: ADMIN_TYPES.services.AdminWorkspaceGrowthService,
      useClass: AdminWorkspaceGrowthServiceImpl,
    },
    {
      provide: ADMIN_TYPES.services.AdminRetentionMetricsService,
      useClass: AdminRetentionMetricsServiceImpl,
    },
    {
      provide: ADMIN_TYPES.services.AdminSystemHealthService,
      useClass: AdminSystemHealthServiceImpl,
    },
  ],
})
export class AdminModule {}
