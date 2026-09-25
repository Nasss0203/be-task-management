import {
  type CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type Response } from 'express';
import {
  GOOGLE_OAUTH_STATE_COOKIE_NAME,
  GOOGLE_OAUTH_STATE_COOKIE_PATH,
} from 'src/common/constants/google-oauth-state.constant';
import { GoogleOAuthStateService } from 'src/common/services/google-oauth-state.service';
import { GoogleAuthCallbackGuard } from './google-auth-callback.guard';

type CallbackRequestFixture = {
  query: Record<string, unknown>;
  cookies?: Record<string, unknown>;
};

class TestGoogleAuthCallbackGuard extends GoogleAuthCallbackGuard {
  passportAuthenticationCalls = 0;
  events: string[] = [];

  protected continueWithPassport(
    _context: ExecutionContext,
  ): ReturnType<CanActivate['canActivate']> {
    this.passportAuthenticationCalls += 1;
    this.events.push('passport');
    return true;
  }
}

const createExecutionContext = (
  request: CallbackRequestFixture,
  response: Response,
): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  }) as unknown as ExecutionContext;

describe('GoogleAuthCallbackGuard', () => {
  const stateService = new GoogleOAuthStateService();

  const createFixture = (
    request: CallbackRequestFixture,
    nodeEnv = 'development',
  ) => {
    const guard = new TestGoogleAuthCallbackGuard(
      stateService,
      new ConfigService({ NODE_ENV: nodeEnv }),
    );
    const clearCookie = jest.fn(() => {
      guard.events.push('clear-cookie');
    });
    const response = { clearCookie } as unknown as Response;

    return {
      clearCookie,
      context: createExecutionContext(request, response),
      guard,
    };
  };

  const expectStateCookieCleared = (
    clearCookie: ReturnType<typeof jest.fn>,
    secure = false,
  ) => {
    expect(clearCookie).toHaveBeenCalledWith(GOOGLE_OAUTH_STATE_COOKIE_NAME, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: GOOGLE_OAUTH_STATE_COOKIE_PATH,
    });
  };

  it('clears a valid state cookie before continuing Passport authentication', () => {
    const state = stateService.generateState();
    const { clearCookie, context, guard } = createFixture({
      query: { state },
      cookies: { [GOOGLE_OAUTH_STATE_COOKIE_NAME]: state },
    });

    expect(guard.canActivate(context)).toBe(true);
    expectStateCookieCleared(clearCookie);
    expect(guard.passportAuthenticationCalls).toBe(1);
    expect(guard.events).toEqual(['clear-cookie', 'passport']);
  });

  it.each([
    [
      'missing query state',
      (state: string): CallbackRequestFixture => ({
        query: {},
        cookies: { [GOOGLE_OAUTH_STATE_COOKIE_NAME]: state },
      }),
    ],
    [
      'missing cookie state',
      (state: string): CallbackRequestFixture => ({
        query: { state },
        cookies: {},
      }),
    ],
    [
      'array query state',
      (state: string): CallbackRequestFixture => ({
        query: { state: [state] },
        cookies: { [GOOGLE_OAUTH_STATE_COOKIE_NAME]: state },
      }),
    ],
    [
      'empty query state',
      (state: string): CallbackRequestFixture => ({
        query: { state: '' },
        cookies: { [GOOGLE_OAUTH_STATE_COOKIE_NAME]: state },
      }),
    ],
  ])('rejects %s before Passport authentication', (_caseName, buildRequest) => {
    const state = stateService.generateState();
    const { clearCookie, context, guard } = createFixture(buildRequest(state));

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    expectStateCookieCleared(clearCookie);
    expect(guard.passportAuthenticationCalls).toBe(0);
  });

  it.each([
    [
      'same length but different content',
      Buffer.alloc(32, 1).toString('base64url'),
      Buffer.alloc(32, 2).toString('base64url'),
    ],
    [
      'different length',
      Buffer.alloc(31, 1).toString('base64url'),
      Buffer.alloc(32, 1).toString('base64url'),
    ],
    [
      'invalid format',
      '!'.repeat(43),
      Buffer.alloc(32, 1).toString('base64url'),
    ],
  ])(
    'rejects %s before Passport authentication',
    (_caseName, receivedState, storedState) => {
      const { clearCookie, context, guard } = createFixture({
        query: { state: receivedState },
        cookies: { [GOOGLE_OAUTH_STATE_COOKIE_NAME]: storedState },
      });

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expectStateCookieCleared(clearCookie);
      expect(guard.passportAuthenticationCalls).toBe(0);
    },
  );

  it('rejects a replay after the state cookie has been consumed', () => {
    const state = stateService.generateState();
    const firstRequest = {
      query: { state },
      cookies: { [GOOGLE_OAUTH_STATE_COOKIE_NAME]: state },
    };
    const firstFixture = createFixture(firstRequest);

    expect(firstFixture.guard.canActivate(firstFixture.context)).toBe(true);
    expectStateCookieCleared(firstFixture.clearCookie);

    const replayFixture = createFixture({
      query: { state },
      cookies: {},
    });

    expect(() =>
      replayFixture.guard.canActivate(replayFixture.context),
    ).toThrow(UnauthorizedException);
    expectStateCookieCleared(replayFixture.clearCookie);
    expect(replayFixture.guard.passportAuthenticationCalls).toBe(0);
  });

  it('validates and clears state before letting Passport handle an OAuth error', () => {
    const state = stateService.generateState();
    const { clearCookie, context, guard } = createFixture(
      {
        query: { error: 'access_denied', state },
        cookies: { [GOOGLE_OAUTH_STATE_COOKIE_NAME]: state },
      },
      'production',
    );

    expect(guard.canActivate(context)).toBe(true);
    expectStateCookieCleared(clearCookie, true);
    expect(guard.passportAuthenticationCalls).toBe(1);
  });
});
