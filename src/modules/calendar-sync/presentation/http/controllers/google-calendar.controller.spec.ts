import { GoogleCalendarController } from './google-calendar.controller';

describe('GoogleCalendarController callback', () => {
  const connectHandler = { execute: jest.fn() };
  const controller = new GoogleCalendarController(
    {
      get: (key: string) =>
        key === 'FRONTEND_URL' ? 'http://localhost:3000' : undefined,
    } as never,
    {} as never,
    connectHandler as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  );
  const response = { setHeader: jest.fn(), redirect: jest.fn() };

  beforeEach(() => jest.clearAllMocks());

  const callback = (returnTo: string, status: 'connected' | 'error') => {
    connectHandler.execute.mockResolvedValue({ returnTo, status });
    return controller.callback('code', 'state', undefined, response as never);
  };

  it('sends the user back to the page they started from', async () => {
    await callback('/workspace/page-1?view=calendar', 'connected');

    expect(response.redirect).toHaveBeenCalledWith(
      303,
      'http://localhost:3000/workspace/page-1?view=calendar&googleCalendar=connected',
    );
    expect(response.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'no-store',
    );
  });

  it.each(['//evil.example/x', 'https://evil.example/x'])(
    'never leaves the frontend origin for %s',
    async (returnTo) => {
      await callback(returnTo, 'error');

      expect(response.redirect).toHaveBeenCalledWith(
        303,
        'http://localhost:3000/?googleCalendar=error',
      );
    },
  );

  it('passes only string query values to the handler', async () => {
    connectHandler.execute.mockResolvedValue({
      returnTo: '/',
      status: 'error',
    });

    await controller.callback(['a'], '', 'access_denied', response as never);

    expect(connectHandler.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        code: null,
        state: null,
        error: 'access_denied',
      }),
    );
  });
});
