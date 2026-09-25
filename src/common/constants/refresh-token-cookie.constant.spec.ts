import { ConfigService } from '@nestjs/config';
import { type Response } from 'express';
import {
  clearRefreshTokenCookie,
  REFRESH_TOKEN_COOKIE_MAX_AGE_MS,
  REFRESH_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_PATH,
  setRefreshTokenCookie,
} from './refresh-token-cookie.constant';

describe('refresh token cookie helpers', () => {
  it.each([
    ['production', true],
    ['development', false],
  ])('sets the cookie with the centralized policy in %s', (nodeEnv, secure) => {
    const cookie = jest.fn();
    const response = { cookie } as unknown as Response;

    setRefreshTokenCookie(
      response,
      'refresh-token',
      new ConfigService({ NODE_ENV: nodeEnv }),
    );

    expect(cookie).toHaveBeenCalledWith(
      REFRESH_TOKEN_COOKIE_NAME,
      'refresh-token',
      {
        httpOnly: true,
        secure,
        sameSite: 'lax',
        path: REFRESH_TOKEN_COOKIE_PATH,
        maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE_MS,
      },
    );
  });

  it('clears the cookie with matching attributes and no maxAge', () => {
    const clearCookie = jest.fn();
    const response = { clearCookie } as unknown as Response;

    clearRefreshTokenCookie(
      response,
      new ConfigService({ NODE_ENV: 'production' }),
    );

    expect(clearCookie).toHaveBeenCalledWith(REFRESH_TOKEN_COOKIE_NAME, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: REFRESH_TOKEN_COOKIE_PATH,
    });
  });
});
