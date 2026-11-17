import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { BILLING_TYPES } from 'src/modules/billing/billing.types';
import type { WorkspaceEntitlementsResponseDto } from 'src/modules/billing/application/dto/response/workspace-entitlements.response.dto';
import type { WorkspaceEntitlementPort } from 'src/modules/billing/application/ports/workspace-entitlement.port';
import { ADMIN_TYPES } from '../../../admin.types';
import type { AdminWorkspaceReader } from '../../ports/admin-workspace-reader.port';
import { GetAdminWorkspaceUsageQuery } from './get-admin-workspace-usage.query';

@Injectable()
export class GetAdminWorkspaceUsageHandler {
  constructor(
    @Inject(ADMIN_TYPES.ports.WorkspaceReader)
    private readonly adminWorkspaceReader: AdminWorkspaceReader,

    @Inject(BILLING_TYPES.services.WorkspaceEntitlementPort)
    private readonly entitlements: WorkspaceEntitlementPort,
  ) {}

  async execute(
    query: GetAdminWorkspaceUsageQuery,
  ): Promise<WorkspaceEntitlementsResponseDto> {
    const workspace = await this.adminWorkspaceReader.findWorkspaceById(
      query.workspaceId,
    );

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return this.entitlements.getEntitlements(query.workspaceId);
  }
}
