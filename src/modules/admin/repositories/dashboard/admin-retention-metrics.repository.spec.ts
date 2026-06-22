/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Repository } from 'typeorm';

import { Subscription } from '../../../billing/domain/entities/subscription.entity';
import { UserActivity } from '../../../user_activity/domain/entities/user_activity.entity';
import { User } from '../../../users/domain/entities/user.entity';
import { Workspace } from '../../../workspaces/domain/entities/workspace.entity';
import { AdminRetentionMetricsRepositoryImpl } from './admin-retention-metrics.repository';

const createCountRepository = (count: number) => {
  const query = jest.fn().mockResolvedValue([{ count: String(count) }]);
  const builder = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    setParameters: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue({ count: String(count) }),
  };

  return {
    repository: {
      createQueryBuilder: jest.fn().mockReturnValue(builder),
      query,
    } as unknown as Repository<never>,
    builder,
    query,
  };
};

describe('AdminRetentionMetricsRepositoryImpl', () => {
  it('calculates retention and subscription churn with Vietnamese content', async () => {
    const users = createCountRepository(10);
    const activities = createCountRepository(4);
    const workspaces = createCountRepository(8);
    const subscriptions = createCountRepository(2);
    const repository = new AdminRetentionMetricsRepositoryImpl(
      users.repository as Repository<User>,
      activities.repository as Repository<UserActivity>,
      workspaces.repository as Repository<Workspace>,
      subscriptions.repository as Repository<Subscription>,
    );

    const metrics = await repository.getRetentionMetrics();

    expect(metrics).toEqual([
      expect.objectContaining({
        key: 'retention-30d',
        label: 'Giữ chân 30 ngày',
        value: 40,
        description: expect.stringContaining('hoạt động trở lại'),
      }),
      expect.objectContaining({
        key: 'monthly-churn',
        label: 'Rời bỏ hàng tháng',
        value: 20,
        description: 'Tỷ lệ workspace đã mất gói Pro trong tháng này.',
      }),
    ]);
    expect(subscriptions.query).toHaveBeenCalledWith(
      expect.stringContaining('CROSS JOIN LATERAL'),
      expect.arrayContaining(['EXPIRED', 'CANCELLED']),
    );
  });
});
