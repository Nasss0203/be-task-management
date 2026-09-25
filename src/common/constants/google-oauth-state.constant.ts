import { ConfigService } from '@nestjs/config';
import { type CookieOptions } from 'express';

export const GOOGLE_OAUTH_STATE_COOKIE_NAME = 'google_oauth_state';
export const GOOGLE_OAUTH_STATE_COOKIE_PATH = '/api/v1/auth/google/callback';
export const GOOGLE_OAUTH_STATE_COOKIE_MAX_AGE_MS = 10 * 60 * 1000;
export const GOOGLE_OAUTH_STATE_BYTE_LENGTH = 32;
export const GOOGLE_OAUTH_STATE_ENCODED_LENGTH = 43;

const createGoogleOAuthStateCookieBaseOptions = (
  configService: ConfigService,
): CookieOptions => ({
  httpOnly: true,
  secure: configService.get<string>('NODE_ENV') === 'production',
  sameSite: 'lax',
  path: GOOGLE_OAUTH_STATE_COOKIE_PATH,
});

export const createGoogleOAuthStateCookieOptions = (
  configService: ConfigService,
): CookieOptions => ({
  ...createGoogleOAuthStateCookieBaseOptions(configService),
  maxAge: GOOGLE_OAUTH_STATE_COOKIE_MAX_AGE_MS,
});

export const createGoogleOAuthStateCookieClearOptions = (
  configService: ConfigService,
): CookieOptions => createGoogleOAuthStateCookieBaseOptions(configService);
