import { GoogleCalendarStateTokenService } from './google-calendar-state-token.service';

describe('GoogleCalendarStateTokenService', () => {
  const originalSecret = process.env.SHARE_LINK_SECRET;
  const service = new GoogleCalendarStateTokenService();
  const now = Date.UTC(2026, 10, 5, 8, 0, 0);
  const state = { userId: 'user-1', returnTo: '/workspace/page-1' };

  beforeAll(() => {
    process.env.SHARE_LINK_SECRET = 'test-secret';
    service.onModuleInit();
  });

  afterAll(() => {
    process.env.SHARE_LINK_SECRET = originalSecret;
  });

  it('reads back the user and return path it signed', () => {
    const token = service.generate(state, now);

    expect(service.verify(token, now + 60_000)).toEqual(state);
  });

  it('rejects a state older than ten minutes', () => {
    const token = service.generate(state, now);

    expect(service.verify(token, now + 10 * 60_000)).toBeNull();
  });

  it('rejects a state whose user was swapped', () => {
    const [, signature] = service.generate(state, now).split('.');
    const forged = Buffer.from(
      JSON.stringify({ ...state, userId: 'user-2', exp: now + 60_000 }),
    ).toString('base64url');

    expect(service.verify(`${forged}.${signature}`, now)).toBeNull();
  });

  it.each([undefined, null, '', 'abc', 'a.b.c'])(
    'rejects malformed state %p',
    (token) => {
      expect(service.verify(token, now)).toBeNull();
    },
  );
});
