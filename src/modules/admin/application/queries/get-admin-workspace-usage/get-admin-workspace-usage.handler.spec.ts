import { NotFoundException } from '@nestjs/common';
import type { WorkspaceEntitlementsResponseDto } from 'src/modules/billing/application/dto/response/workspace-entitlements.response.dto';
import type { WorkspaceEntitlementPort } from 'src/modules/billing/application/ports/workspace-entitlement.port';
import { BillingFeatureValueType } from 'src/modules/billing/domain/constants/billing-feature-value-type.constant';
import type {
  AdminWorkspaceDetail,
  AdminWorkspaceReader,
} from '../../ports/admin-workspace-reader.port';
import { GetAdminWorkspaceUsageHandler } from './get-admin-workspace-usage.handler';
import { GetAdminWorkspaceUsageQuery } from './get-admin-workspace-usage.query';

const WORKSPACE_ID = '11111111-1111-4111-8111-111111111111';

const entitlements: WorkspaceEntitlementsResponseDto = {
  workspaceId: WORKSPACE_ID,
  plan: { id: 'plan-free', code: 'FREE', name: 'Free' },
  periodStart: null,
  periodEnd: null,
  usagePeriod: {
    start: new Date('2026-11-01T00:00:00.000Z'),
    end: new Date('2026-12-01T00:00:00.000Z'),
  },
  features: [
    {
      code: 'MAX_STORAGE_MB',
      name: 'Storage',
      valueType: BillingFeatureValueType.NUMBER,
      limit: 100,
      usage: 22.5,
    },
  ],
};

function createHandler(workspace: AdminWorkspaceDetail | null) {
  const reader = {
    findWorkspaceById: jest.fn().mockResolvedValue(workspace),
  } as unknown as AdminWorkspaceReader;
  const getEntitlements = jest.fn().mockResolvedValue(entitlements);
  const port = {
    getEntitlements,
    assertWithinLimit: jest.fn(),
  } as unknown as WorkspaceEntitlementPort;

  return {
    handler: new GetAdminWorkspaceUsageHandler(reader, port),
    getEntitlements,
  };
}

describe('GetAdminWorkspaceUsageHandler', () => {
  it('returns the billing entitlements of an existing workspace', async () => {
    const { handler, getEntitlements } = createHandler({
      id: WORKSPACE_ID,
    } as AdminWorkspaceDetail);

    await expect(
      handler.execute(new GetAdminWorkspaceUsageQuery(WORKSPACE_ID)),
    ).resolves.toBe(entitlements);
    expect(getEntitlements).toHaveBeenCalledWith(WORKSPACE_ID);
  });

  it('throws not found without asking billing when the workspace is missing or archived', async () => {
    const { handler, getEntitlements } = createHandler(null);

    await expect(
      handler.execute(new GetAdminWorkspaceUsageQuery(WORKSPACE_ID)),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(getEntitlements).not.toHaveBeenCalled();
  });
});
