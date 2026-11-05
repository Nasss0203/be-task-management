import { GoogleCalendarRequestError } from '../../ports/google-calendar-client.port';
import { ConnectGoogleCalendarCommand } from './connect-google-calendar.command';
import { ConnectGoogleCalendarHandler } from './connect-google-calendar.handler';

describe('ConnectGoogleCalendarHandler', () => {
  const client = { exchangeCode: jest.fn() };
  const connectionRepository = {
    findByUserId: jest.fn(),
    save: jest.fn(),
  };
  const stateTokenService = { verify: jest.fn() };
  const tokenCipher = { encrypt: jest.fn((value: string) => `enc(${value})`) };
  const handler = new ConnectGoogleCalendarHandler(
    client as never,
    connectionRepository as never,
    stateTokenService as never,
    tokenCipher as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    stateTokenService.verify.mockReturnValue({
      userId: 'user-1',
      returnTo: '/page-1',
    });
    client.exchangeCode.mockResolvedValue({
      refreshToken: 'refresh-1',
      email: 'me@example.com',
    });
    connectionRepository.findByUserId.mockResolvedValue(null);
  });

  it('stores an encrypted refresh token for the user in the state', async () => {
    await expect(
      handler.execute(
        new ConnectGoogleCalendarCommand('code-1', 'state', null),
      ),
    ).resolves.toEqual({ returnTo: '/page-1', status: 'connected' });

    expect(client.exchangeCode).toHaveBeenCalledWith('code-1');
    expect(connectionRepository.save).toHaveBeenCalledWith({
      id: expect.any(String) as string,
      userId: 'user-1',
      googleEmail: 'me@example.com',
      refreshTokenEncrypted: 'enc(refresh-1)',
      lastError: null,
    });
  });

  it('reuses the existing connection and clears its error on reconnect', async () => {
    connectionRepository.findByUserId.mockResolvedValue({
      id: 'connection-1',
      lastError: 'ACCESS_REVOKED',
    });

    await handler.execute(
      new ConnectGoogleCalendarCommand('code-1', 'state', null),
    );

    expect(connectionRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'connection-1', lastError: null }),
    );
  });

  it('ignores the code when the state is not valid', async () => {
    stateTokenService.verify.mockReturnValue(null);

    await expect(
      handler.execute(new ConnectGoogleCalendarCommand('code-1', 'bad', null)),
    ).resolves.toEqual({ returnTo: '/', status: 'error' });
    expect(client.exchangeCode).not.toHaveBeenCalled();
  });

  it('returns to the page with an error when the user cancelled', async () => {
    await expect(
      handler.execute(
        new ConnectGoogleCalendarCommand(null, 'state', 'access_denied'),
      ),
    ).resolves.toEqual({ returnTo: '/page-1', status: 'error' });
    expect(client.exchangeCode).not.toHaveBeenCalled();
  });

  it('returns an error when Google refuses the code', async () => {
    client.exchangeCode.mockRejectedValue(
      new GoogleCalendarRequestError(400, 'invalid_grant'),
    );

    await expect(
      handler.execute(
        new ConnectGoogleCalendarCommand('code-1', 'state', null),
      ),
    ).resolves.toEqual({ returnTo: '/page-1', status: 'error' });
    expect(connectionRepository.save).not.toHaveBeenCalled();
  });
});
