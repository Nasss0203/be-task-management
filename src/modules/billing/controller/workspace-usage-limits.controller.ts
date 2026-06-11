import { Controller, Get, Inject, Param, Req } from '@nestjs/common';
import { type Request } from 'express';
import { RequirePermissions } from 'src/common/decorator/require-permissions.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { type BillingQueryApplication } from '../interfaces/applications/billing-query.application.interface';
import { BILLING_TYPES } from '../interfaces/types';
import { WorkspaceContext } from 'src/common/decorator/workspace-context.decorator';

type AuthRequest = Request & {
  user?: {
    sub?: string;
    id?: string;
    userId?: string;
  };
};

@Controller('workspaces/:workspaceId/usage-limits')
export class WorkspaceUsageLimitsController {
  constructor(
    @Inject(BILLING_TYPES.applications.BillingQueryApplication)
    private readonly billingQueryApplication: BillingQueryApplication,
  ) {}

  @Get()
  @WorkspaceContext({ source: 'param', key: 'workspaceId' })
  @RequirePermissions(PERMISSIONS.WORKSPACE_USAGE_READ)
  @ResponseMessage('Get workspace usage limits')
  async getWorkspaceUsageLimits(
    @Param('workspaceId') workspaceId: string,
    @Req() req: AuthRequest,
  ) {
    const userId = this.getAuthUserId(req);

    return this.billingQueryApplication.getWorkspaceUsageLimits(
      userId,
      workspaceId,
    );
  }

  private getAuthUserId(req: AuthRequest): string {
    const userId = req.user?.sub || req.user?.id || req.user?.userId;

    if (!userId) {
      throw new Error('User id not found');
    }

    return userId;
  }
}
