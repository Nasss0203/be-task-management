import { Inject, Injectable } from '@nestjs/common';

import { BILLING_TYPES } from '../../../../billing.types';
import type { WorkspaceEntitlementsResponseDto } from '../../../dto/response/workspace-entitlements.response.dto';
import { BillingEntitlementService } from '../../../services/billing-entitlement.service';
import { GetWorkspaceEntitlementsQuery } from './get-workspace-entitlements.query';

@Injectable()
export class GetWorkspaceEntitlementsHandler {
  constructor(
    @Inject(BILLING_TYPES.services.BillingEntitlementService)
    private readonly entitlementService: BillingEntitlementService,
  ) {}

  execute(
    query: GetWorkspaceEntitlementsQuery,
  ): Promise<WorkspaceEntitlementsResponseDto> {
    return this.entitlementService.getEntitlements(query.workspaceId);
  }
}
