import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { REFRESH_TOKEN_COOKIE_NAME } from 'src/common/constants/refresh-token-cookie.constant';
import { RefreshTokenOriginGuard } from './refresh-token-origin.guard';

type RequestFixture = {
  cookies?: Record<string, unknown>;
  headers: { origin?: string };
};

const createExecutionContext = (request: RequestFixture): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  }) as unknown as ExecutionContext;

describe('RefreshTokenOriginGuard', () => {
  const guard = new RefreshTokenOriginGuard(
    new ConfigService({
      NODE_ENV: 'production',
      CLIENT_URL: 'https://app.example.com',
      FRONTEND_URL: 'https://app.example.com/dashboard',
      ADMIN_CLIENT_URL: 'https://admin.example.com',
    }),
  );

  const cookieRequest = (origin?: string): RequestFixture => ({
    cookies: { [REFRESH_TOKEN_COOKIE_NAME]: 'refresh-token' },
    headers: { origin },
  });

  it.each(['https://app.example.com', 'https://admin.example.com'])(
    'allows a cookie request from configured origin %s',
    (origin) => {
      expect(
        guard.canActivate(createExecutionContext(cookieRequest(origin))),
      ).toBe(true);
    },
  );

  it.each([
    ['missing Origin', undefined],
    ['null Origin', 'null'],
    ['malformed Origin', 'not-a-url'],
    ['untrusted Origin', 'https://evil.example.com'],
    ['prefix spoof', 'https://app.example.com.evil.test'],
    ['suffix spoof', 'https://evil-app.example.com'],
  ])('rejects a cookie request with %s', (_caseName, origin) => {
    expect(() =>
      guard.canActivate(createExecutionContext(cookieRequest(origin))),
    ).toThrow(ForbiddenException);
  });

  it('allows body-token compatibility without Origin when no cookie exists', () => {
    expect(
      guard.canActivate(createExecutionContext({ cookies: {}, headers: {} })),
    ).toBe(true);
  });

  it('validates Origin even when the compatibility request has no cookie', () => {
    expect(() =>
      guard.canActivate(
        createExecutionContext({
          cookies: {},
          headers: { origin: 'https://evil.example.com' },
        }),
      ),
    ).toThrow(ForbiddenException);
  });
});
