import { Inject, Injectable } from '@nestjs/common';
import { DashboardSummaryResponseDto } from '../../dto/response/dashboard/dashboard-summary.response.dto';
import { AdminDashboardSummaryApplication } from '../../interfaces/applications/dashboard/admin-dashboard-summary.application.interface';
import { type AdminDashboardSummaryService } from '../../interfaces/services/dashboard/admin-dashboard-summary.service.interface';
import { ADMIN_TYPES } from '../../interfaces/types';

@Injectable()
export class AdminDashboardSummaryApplicationImpl implements AdminDashboardSummaryApplication {
  constructor(
    @Inject(ADMIN_TYPES.services.AdminDashboardSummaryService)
    private readonly service: AdminDashboardSummaryService,
  ) {}

  async getSummary(): Promise<DashboardSummaryResponseDto> {
    // #region agent log
    fetch('http://127.0.0.1:7422/ingest/858f5ea4-3f7e-414d-bca0-e06f390439e6', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': '408fe4',
      },
      body: JSON.stringify({
        sessionId: '408fe4',
        runId: 'pre-fix',
        hypothesisId: 'H2',
        location: 'admin-dashboard-summary.application.ts:getSummary',
        message: 'entry',
        data: {},
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    try {
      const summary = await this.service.getSummary();

      // #region agent log
      fetch(
        'http://127.0.0.1:7422/ingest/858f5ea4-3f7e-414d-bca0-e06f390439e6',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Debug-Session-Id': '408fe4',
          },
          body: JSON.stringify({
            sessionId: '408fe4',
            runId: 'pre-fix',
            hypothesisId: 'H2',
            location: 'admin-dashboard-summary.application.ts:getSummary',
            message: 'service_ok',
            data: { totalUsers: summary?.totalUsers },
            timestamp: Date.now(),
          }),
        },
      ).catch(() => {});
      // #endregion

      return {
        totalUsers: summary.totalUsers,
        totalWorkspaces: summary.totalWorkspaces,
        totalProjects: summary.totalProjects,
        totalTasks: summary.totalTasks,
        paidWorkspaces: summary.paidWorkspaces,
        activeUsersLast30Days: summary.activeUsersLast30Days,
      };
    } catch (e: unknown) {
      const err = e as { message?: string; name?: string };
      // #region agent log
      fetch(
        'http://127.0.0.1:7422/ingest/858f5ea4-3f7e-414d-bca0-e06f390439e6',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Debug-Session-Id': '408fe4',
          },
          body: JSON.stringify({
            sessionId: '408fe4',
            runId: 'pre-fix',
            hypothesisId: 'H2',
            location: 'admin-dashboard-summary.application.ts:getSummary',
            message: 'catch',
            data: { name: err?.name, msg: String(err?.message) },
            timestamp: Date.now(),
          }),
        },
      ).catch(() => {});
      // #endregion
      throw e;
    }
  }
}
