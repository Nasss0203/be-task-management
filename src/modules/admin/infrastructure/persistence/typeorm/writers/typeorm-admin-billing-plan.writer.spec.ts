import { DataSource, EntityManager } from 'typeorm';
import type { UpdateAdminBillingPlanInput } from '../../../../application/ports/admin-billing-plan-writer.port';
import { TypeOrmAdminBillingPlanWriter } from './typeorm-admin-billing-plan.writer';

const PLAN_ID = '4f0f7a49-1a5b-4a3e-9d38-3a3c9f6c1b2e';

function buildInput(
  overrides: Partial<UpdateAdminBillingPlanInput> = {},
): UpdateAdminBillingPlanInput {
  return {
    planId: PLAN_ID,
    name: 'Pro',
    description: null,
    isActive: true,
    isPublic: true,
    features: [
      { featureId: 'feature-1', value: true },
      { featureId: 'feature-2', value: 10 },
    ],
    ...overrides,
  };
}

function createWriter(updateResult: unknown) {
  const query = jest
    .fn()
    .mockResolvedValueOnce(updateResult)
    .mockResolvedValue([]);
  const manager = { query } as unknown as EntityManager;
  const transaction = jest.fn(
    (work: (entityManager: EntityManager) => Promise<unknown>) => work(manager),
  );
  const writer = new TypeOrmAdminBillingPlanWriter({
    transaction,
  } as unknown as DataSource);

  return { writer, query };
}

describe('TypeOrmAdminBillingPlanWriter.updatePlan', () => {
  it('updates the plan and upserts each feature for the postgres [rows, affectedCount] result', async () => {
    const { writer, query } = createWriter([[{ id: PLAN_ID }], 1]);

    await expect(writer.updatePlan(buildInput())).resolves.toBe(true);

    expect(query).toHaveBeenCalledTimes(3);
    expect(query).toHaveBeenNthCalledWith(1, expect.any(String), [
      PLAN_ID,
      'Pro',
      null,
      true,
      true,
    ]);
    expect(query).toHaveBeenNthCalledWith(2, expect.any(String), [
      PLAN_ID,
      'feature-1',
      'true',
    ]);
    expect(query).toHaveBeenNthCalledWith(3, expect.any(String), [
      PLAN_ID,
      'feature-2',
      '10',
    ]);
  });

  it('returns false without upserting features when no plan was updated', async () => {
    const { writer, query } = createWriter([[], 0]);

    await expect(writer.updatePlan(buildInput())).resolves.toBe(false);

    expect(query).toHaveBeenCalledTimes(1);
  });

  it('reads a plain array of rows', async () => {
    const { writer, query } = createWriter([{ id: PLAN_ID }]);

    await expect(writer.updatePlan(buildInput())).resolves.toBe(true);

    expect(query).toHaveBeenCalledTimes(3);
  });

  it('returns true with no feature upserts when the feature list is empty', async () => {
    const { writer, query } = createWriter([[{ id: PLAN_ID }], 1]);

    await expect(writer.updatePlan(buildInput({ features: [] }))).resolves.toBe(
      true,
    );

    expect(query).toHaveBeenCalledTimes(1);
  });
});
