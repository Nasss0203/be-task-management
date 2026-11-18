import { BillingFeatureValueType } from 'src/modules/billing/domain/constants/billing-feature-value-type.constant';

import type {
  AdminBillingPlanDetail,
  AdminBillingPlanReader,
} from '../../ports/admin-billing-plan-reader.port';
import type { AdminBillingPlanWriter } from '../../ports/admin-billing-plan-writer.port';
import { UpdateAdminBillingPlanCommand } from './update-admin-billing-plan.command';
import { UpdateAdminBillingPlanHandler } from './update-admin-billing-plan.handler';

const actor = { userId: 'admin-1', ipAddress: '::1', userAgent: 'Chrome' };

const plan: AdminBillingPlanDetail = {
  id: 'plan-1',
  code: 'PRO',
  name: 'Pro',
  description: 'For teams',
  isActive: true,
  isPublic: true,
  prices: [],
  createdAt: new Date('2026-11-01T00:00:00.000Z'),
  updatedAt: new Date('2026-11-01T00:00:00.000Z'),
  features: [
    {
      id: 'feature-members',
      planFeatureId: 'plan-feature-1',
      code: 'MAX_MEMBERS',
      name: 'Members',
      description: null,
      valueType: BillingFeatureValueType.NUMBER,
      value: 10,
      isConfigured: true,
    },
    {
      id: 'feature-sites',
      planFeatureId: 'plan-feature-2',
      code: 'PUBLIC_SITES',
      name: 'Public sites',
      description: null,
      valueType: BillingFeatureValueType.BOOLEAN,
      value: true,
      isConfigured: true,
    },
  ],
};

function createHandler() {
  const reader = {
    getPlanById: jest.fn().mockResolvedValue(plan),
  } as unknown as AdminBillingPlanReader;
  const updatePlan = jest.fn().mockResolvedValue(true);
  const writer = { updatePlan } as unknown as AdminBillingPlanWriter;

  return {
    handler: new UpdateAdminBillingPlanHandler(reader, writer),
    updatePlan,
  };
}

describe('UpdateAdminBillingPlanHandler', () => {
  it('records only the fields that actually change', async () => {
    const { handler, updatePlan } = createHandler();

    await handler.execute(
      new UpdateAdminBillingPlanCommand(
        'plan-1',
        'Pro Plus',
        undefined,
        true,
        undefined,
        [
          { featureId: 'feature-members', value: 25 },
          { featureId: 'feature-sites', value: true },
        ],
        actor,
      ),
    );

    expect(updatePlan).toHaveBeenCalledWith(
      expect.objectContaining({
        actor,
        changes: {
          name: { from: 'Pro', to: 'Pro Plus' },
          features: [{ code: 'MAX_MEMBERS', from: 10, to: 25 }],
        },
      }),
    );
  });
});
