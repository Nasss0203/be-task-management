import { SlackAuthError } from '../../ports/slack-client.port';
import { ConnectSlackCommand } from './connect-slack.command';
import { ConnectSlackHandler } from './connect-slack.handler';

describe('ConnectSlackHandler', () => {
  const client = { exchangeCode: jest.fn() };
  const connectionRepository = { findByUserId: jest.fn(), save: jest.fn() };
  const stateTokenService = { verify: jest.fn() };
  const tokenCipher = { encrypt: jest.fn((value: string) => `enc(${value})`) };
  const handler = new ConnectSlackHandler(
    client as never,
    connectionRepository as never,
    stateTokenService as never,
    tokenCipher as never,
  );
  const connect = (
    code: string | null = 'code-1',
    error: string | null = null,
  ) => handler.execute(new ConnectSlackCommand(code, 'state', error));

  beforeEach(() => {
    jest.clearAllMocks();
    stateTokenService.verify.mockReturnValue({
      userId: 'user-1',
      returnTo: '/page-1',
    });
    client.exchangeCode.mockResolvedValue({
      botToken: 'xoxb-1',
      teamId: 'T1',
      teamName: 'Acme',
      slackUserId: 'U1',
    });
    connectionRepository.findByUserId.mockResolvedValue(null);
  });

  it('stores the encrypted bot token for the user in the state', async () => {
    await expect(connect()).resolves.toEqual({
      returnTo: '/page-1',
      status: 'connected',
    });

    expect(client.exchangeCode).toHaveBeenCalledWith('code-1');
    expect(connectionRepository.save).toHaveBeenCalledWith({
      id: expect.any(String) as string,
      userId: 'user-1',
      slackTeamId: 'T1',
      slackTeamName: 'Acme',
      slackUserId: 'U1',
      botTokenEncrypted: 'enc(xoxb-1)',
      lastError: null,
    });
  });

  it('reuses the existing connection and clears its error on reconnect', async () => {
    connectionRepository.findByUserId.mockResolvedValue({
      id: 'connection-1',
      lastError: 'ACCESS_REVOKED',
    });

    await connect();

    expect(connectionRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'connection-1', lastError: null }),
    );
  });

  it('ignores the code when the state is not valid', async () => {
    stateTokenService.verify.mockReturnValue(null);

    await expect(connect()).resolves.toEqual({
      returnTo: '/',
      status: 'error',
    });
    expect(client.exchangeCode).not.toHaveBeenCalled();
  });

  it('returns to the page with an error when the user cancelled', async () => {
    await expect(connect(null, 'access_denied')).resolves.toEqual({
      returnTo: '/page-1',
      status: 'error',
    });
    expect(client.exchangeCode).not.toHaveBeenCalled();
  });

  it('returns an error when Slack refuses the code', async () => {
    client.exchangeCode.mockRejectedValue(new SlackAuthError('invalid_code'));

    await expect(connect()).resolves.toEqual({
      returnTo: '/page-1',
      status: 'error',
    });
    expect(connectionRepository.save).not.toHaveBeenCalled();
  });
});
