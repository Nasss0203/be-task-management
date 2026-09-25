import { ConfigService } from '@nestjs/config';
import { type CookieOptions, type Response } from 'express';

export const REFRESH_TOKEN_COOKIE_NAME = 'refresh_token';
export const REFRESH_TOKEN_COOKIE_PATH = '/api/v1/auth';
export const REFRESH_TOKEN_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const createRefreshTokenCookieBaseOptions = (
  configService: ConfigService,
): CookieOptions => ({
  httpOnly: true,
  secure: configService.get<string>('NODE_ENV') === 'production',
  sameSite: 'lax',
  path: REFRESH_TOKEN_COOKIE_PATH,
});

export const createRefreshTokenCookieOptions = (
  configService: ConfigService,
): CookieOptions => ({
  ...createRefreshTokenCookieBaseOptions(configService),
  maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE_MS,
});

export const createRefreshTokenCookieClearOptions = (
  configService: ConfigService,
): CookieOptions => createRefreshTokenCookieBaseOptions(configService);

export const setRefreshTokenCookie = (
  response: Response,
  refreshToken: string,
  configService: ConfigService,
): void => {
  response.cookie(
    REFRESH_TOKEN_COOKIE_NAME,
    refreshToken,
    createRefreshTokenCookieOptions(configService),
  );
};

export const clearRefreshTokenCookie = (
  response: Response,
  configService: ConfigService,
): void => {
  response.clearCookie(
    REFRESH_TOKEN_COOKIE_NAME,
    createRefreshTokenCookieClearOptions(configService),
  );
};
