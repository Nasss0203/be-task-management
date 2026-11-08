import { DisconnectGoogleCalendarCommand } from './disconnect-google-calendar.command';
import { DisconnectGoogleCalendarHandler } from './disconnect-google-calendar.handler';

describe('DisconnectGoogleCalendarHandler', () => {
  const calls: string[] = [];
  const client = {
    deleteCalendar: jest.fn((_token: string, calendarId: string) => {
      calls.push(`deleteCalendar:${calendarId}`);
      return Promise.resolve();
    }),
    revoke: jest.fn(() => {
      calls.push('revoke');
      return Promise.resolve();
    }),
  };
  const connectionRepository = {
    findByUserId: jest.fn(),
    deleteByUserId: jest.fn(() => {
      calls.push('deleteConnection');
      return Promise.resolve();
    }),
  };
  const syncRepository = { findByConnectionId: jest.fn() };
  const accessTokenService = { issue: jest.fn() };
  const tokenCipher = { decrypt: jest.fn((value: string) => `dec(${value})`) };
  const handler = new DisconnectGoogleCalendarHandler(
    client as never,
    connectionRepository as never,
    syncRepository as never,
    accessTokenService as never,
    tokenCipher as never,
  );
  const connection = {
    id: 'connection-1',
    userId: 'user-1',
    refreshTokenEncrypted: 'enc-refresh',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    calls.length = 0;
    connectionRepository.findByUserId.mockResolvedValue(connection);
    syncRepository.findByConnectionId.mockResolvedValue([
      { googleCalendarId: 'calendar-a' },
      { googleCalendarId: 'calendar-b' },
    ]);
    accessTokenService.issue.mockResolvedValue('access-1');
  });

  const disconnect = () =>
    handler.execute(new DisconnectGoogleCalendarCommand('user-1'));

  it('deletes every synced calendar before removing the connection and revoking', async () => {
    await disconnect();

    expect(syncRepository.findByConnectionId).toHaveBeenCalledWith(
      'connection-1',
    );
    expect(client.deleteCalendar).toHaveBeenCalledWith(
      'access-1',
      'calendar-a',
    );
    expect(client.deleteCalendar).toHaveBeenCalledWith(
      'access-1',
      'calendar-b',
    );
    expect(client.revoke).toHaveBeenCalledWith('dec(enc-refresh)');
    expect(calls).toEqual([
      'deleteCalendar:calendar-a',
      'deleteCalendar:calendar-b',
      'deleteConnection',
      'revoke',
    ]);
  });

  it('still disconnects when Google access was already revoked', async () => {
    accessTokenService.issue.mockResolvedValue(null);

    await expect(disconnect()).resolves.toBeUndefined();

    expect(client.deleteCalendar).not.toHaveBeenCalled();
    expect(calls).toEqual(['deleteConnection', 'revoke']);
  });

  it('still disconnects when issuing the access token fails', async () => {
    accessTokenService.issue.mockRejectedValue(new Error('Google down'));

    await expect(disconnect()).resolves.toBeUndefined();

    expect(client.deleteCalendar).not.toHaveBeenCalled();
    expect(calls).toEqual(['deleteConnection', 'revoke']);
  });

  it('keeps deleting the other calendars when one deletion fails', async () => {
    client.deleteCalendar.mockImplementationOnce(() =>
      Promise.reject(new Error('Google error')),
    );

    await expect(disconnect()).resolves.toBeUndefined();

    expect(client.deleteCalendar).toHaveBeenCalledTimes(2);
    expect(calls).toEqual([
      'deleteCalendar:calendar-b',
      'deleteConnection',
      'revoke',
    ]);
  });

  it('skips Google cleanup when nothing was synced', async () => {
    syncRepository.findByConnectionId.mockResolvedValue([]);

    await disconnect();

    expect(accessTokenService.issue).not.toHaveBeenCalled();
    expect(client.deleteCalendar).not.toHaveBeenCalled();
    expect(calls).toEqual(['deleteConnection', 'revoke']);
  });

  it('does nothing without a connection', async () => {
    connectionRepository.findByUserId.mockResolvedValue(null);

    await disconnect();

    expect(syncRepository.findByConnectionId).not.toHaveBeenCalled();
    expect(connectionRepository.deleteByUserId).not.toHaveBeenCalled();
    expect(client.revoke).not.toHaveBeenCalled();
  });
});
