import { Controller, Get, Param, Req } from '@nestjs/common';
import { type Request } from 'express';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { BillingQueryService } from '../services/query/billing-query.service';

type AuthRequest = Request & {
  user?: {
    sub?: string;
    id?: string;
    userId?: string;
  };
};

@Controller('workspaces/:workspaceId/usage-limits')
export class WorkspaceUsageLimitsController {
  constructor(private readonly billingQueryService: BillingQueryService) {}

  @Get()
  @ResponseMessage('Get workspace usage limits')
  async getWorkspaceUsageLimits(
    @Param('workspaceId') workspaceId: string,
    @Req() req: AuthRequest,
  ) {
    const userId = this.getAuthUserId(req);

    return this.billingQueryService.getWorkspaceUsageLimits(
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
