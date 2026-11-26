import { SlackDeliveryStatus } from '../../../domain/repositories/slack-delivery-log.repository';
import { ListSlackDeliveriesHandler } from './list-slack-deliveries.handler';
import { ListSlackDeliveriesQuery } from './list-slack-deliveries.query';

describe('ListSlackDeliveriesHandler', () => {
  const log = { listByUser: jest.fn() };
  const handler = new ListSlackDeliveriesHandler(log as never);
  const delivery = (id: string) => ({
    id,
    notificationType: 'comment.mentioned',
    title: `Message ${id}`,
    status: SlackDeliveryStatus.SENT,
    error: null,
    attempts: 1,
    createdAt: new Date('2026-11-26T10:00:00.000Z'),
    updatedAt: new Date('2026-11-26T10:00:00.000Z'),
  });

  beforeEach(() => jest.clearAllMocks());

  it('reads only the signed-in user log and asks for one extra row', async () => {
    log.listByUser.mockResolvedValue([delivery('d-1')]);

    await handler.execute(new ListSlackDeliveriesQuery('user-1', 'd-0', 20));

    expect(log.listByUser).toHaveBeenCalledWith('user-1', 'd-0', 21);
  });

  it('returns the last item id as the next cursor when more rows exist', async () => {
    log.listByUser.mockResolvedValue([
      delivery('d-1'),
      delivery('d-2'),
      delivery('d-3'),
    ]);

    const page = await handler.execute(
      new ListSlackDeliveriesQuery('user-1', null, 2),
    );

    expect(page.items.map((item) => item.id)).toEqual(['d-1', 'd-2']);
    expect(page.nextCursor).toBe('d-2');
  });

  it('has no next cursor on the last page', async () => {
    log.listByUser.mockResolvedValue([delivery('d-1')]);

    const page = await handler.execute(
      new ListSlackDeliveriesQuery('user-1', null, 2),
    );

    expect(page.nextCursor).toBeNull();
  });
});
