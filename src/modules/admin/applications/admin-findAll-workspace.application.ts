import { Inject, Injectable } from '@nestjs/common';
import { AdminWorkspaceItemResponseDto } from 'src/modules/admin/dto/response/dashboard/workspace-overview.response.dto';
import { type AdminFindAllWorkspaceService } from 'src/modules/workspaces/interfaces/services/admin-findAll-workspace.service.interface';
import { WORKSPACE_TYPES } from 'src/modules/workspaces/interfaces/types';
import { AdminFindAllWorkspaceFilter } from 'src/modules/workspaces/interfaces/workspace-filter.type';
import { AdminFindAllWorkspaceApplication } from '../interfaces/applications/admin-findAll-workspace.application.interface';

@Injectable()
export class AdminFindAllWorkspaceApplicationImpl implements AdminFindAllWorkspaceApplication {
  constructor(
    @Inject(WORKSPACE_TYPES.services.AdminFindAllWorkspaceService)
    private readonly adminFindAllWorkspaceService: AdminFindAllWorkspaceService,
  ) {}

  findAllWorkspace(
    filter: AdminFindAllWorkspaceFilter,
  ): Promise<AdminWorkspaceItemResponseDto[]> {
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
        hypothesisId: 'H4',
        location: 'admin-findAll-workspace.application.ts:findAllWorkspace',
        message: 'entry',
        data: { hasSearch: !!filter?.search, hasPlan: !!filter?.plan },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    console.log('APPLICATION ADMIN FIND ALL WORKSPACE');
    return this.adminFindAllWorkspaceService
      .findAllWorkspace(filter)
      .catch((e: unknown) => {
        const err = e as { message?: string };
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
              hypothesisId: 'H4',
              location:
                'admin-findAll-workspace.application.ts:findAllWorkspace',
              message: 'catch',
              data: { msg: String(err?.message) },
              timestamp: Date.now(),
            }),
          },
        ).catch(() => {});
        // #endregion
        throw e;
      });
  }
}
