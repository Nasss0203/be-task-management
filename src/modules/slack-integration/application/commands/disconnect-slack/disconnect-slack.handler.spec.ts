import { DisconnectSlackCommand } from './disconnect-slack.command';
import { DisconnectSlackHandler } from './disconnect-slack.handler';

describe('DisconnectSlackHandler', () => {
  it('clears the delivery log together with the connection', async () => {
    const calls: string[] = [];
    const connections = {
      deleteByUserId: jest.fn(() => {
        calls.push('connection');
        return Promise.resolve();
      }),
    };
    const deliveryLog = {
      deleteByUser: jest.fn(() => {
        calls.push('log');
        return Promise.resolve();
      }),
    };
    const handler = new DisconnectSlackHandler(
      connections as never,
      deliveryLog as never,
    );

    await handler.execute(new DisconnectSlackCommand('user-1'));

    expect(deliveryLog.deleteByUser).toHaveBeenCalledWith('user-1');
    expect(connections.deleteByUserId).toHaveBeenCalledWith('user-1');
    expect(calls).toEqual(['log', 'connection']);
  });
});
