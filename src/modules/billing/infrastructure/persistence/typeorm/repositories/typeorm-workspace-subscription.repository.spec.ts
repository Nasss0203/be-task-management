import { TypeOrmWorkspaceSubscriptionRepository } from './typeorm-workspace-subscription.repository';
import { WorkspaceSubscriptionOrmEntity } from '../entities/workspace-subscription.orm-entity';

describe('TypeOrmWorkspaceSubscriptionRepository', () => {
  it('reads the subscription with a row lock through the transaction manager', async () => {
    const findOne = jest.fn().mockResolvedValue(null);
    const getRepository = jest.fn(() => ({ findOne }));
    const repository = new TypeOrmWorkspaceSubscriptionRepository({} as never);

    await expect(
      repository.findByIdForUpdate('subscription-1', {
        getRepository,
      } as never),
    ).resolves.toBeNull();

    expect(getRepository).toHaveBeenCalledWith(WorkspaceSubscriptionOrmEntity);
    expect(findOne).toHaveBeenCalledWith({
      where: { id: 'subscription-1' },
      lock: { mode: 'pessimistic_write' },
    });
  });
});
