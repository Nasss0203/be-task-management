import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activity } from '../activity/domain/entities/activity.entity';
import { Task } from '../tasks/domain/entities/task.entity';
import { UserWorkspace } from '../user_workspace/domain/entities/user_workspace.entity';
import { GetMyDashboardApplicationImpl } from './applications/get-my-dashboard.application';
import { DashboardController } from './controller/dashboard.controller';
import { DASHBOARD_TYPES } from './interfaces/types';
import { DashboardRepositoryImpl } from './repositories/dashboard.repository';
import { DashboardActivityServiceImpl } from './services/dashboard-activity.service';
import { DashboardStatsServiceImpl } from './services/dashboard-stats.service';
import { DashboardSuggestionsServiceImpl } from './services/dashboard-suggestions.service';
import { DashboardTasksServiceImpl } from './services/dashboard-tasks.service';
import { DashboardWorkspacesServiceImpl } from './services/dashboard-workspaces.service';

@Module({
  imports: [TypeOrmModule.forFeature([Task, UserWorkspace, Activity])],
  controllers: [DashboardController],
  providers: [
    {
      provide: DASHBOARD_TYPES.applications.GetMyDashboardApplication,
      useClass: GetMyDashboardApplicationImpl,
    },
    {
      provide: DASHBOARD_TYPES.repositories.DashboardRepository,
      useClass: DashboardRepositoryImpl,
    },
    {
      provide: DASHBOARD_TYPES.services.DashboardStatsService,
      useClass: DashboardStatsServiceImpl,
    },
    {
      provide: DASHBOARD_TYPES.services.DashboardTasksService,
      useClass: DashboardTasksServiceImpl,
    },
    {
      provide: DASHBOARD_TYPES.services.DashboardWorkspacesService,
      useClass: DashboardWorkspacesServiceImpl,
    },
    {
      provide: DASHBOARD_TYPES.services.DashboardActivityService,
      useClass: DashboardActivityServiceImpl,
    },
    {
      provide: DASHBOARD_TYPES.services.DashboardSuggestionsService,
      useClass: DashboardSuggestionsServiceImpl,
    },
  ],
})
export class DashboardModule {}
