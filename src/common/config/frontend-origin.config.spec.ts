import { ConfigService } from '@nestjs/config';
import {
  createFrontendCallbackUrl,
  resolveAllowedFrontendOrigins,
  resolveFrontendOrigin,
} from './frontend-origin.config';

describe('frontend origin config', () => {
  it('prefers FRONTEND_URL and creates a clean callback URL', () => {
    const configService = new ConfigService({
      NODE_ENV: 'production',
      FRONTEND_URL: 'https://app.example.com/some-path',
      CLIENT_URL: 'https://client.example.com',
    });

    expect(resolveFrontendOrigin(configService)).toBe(
      'https://app.example.com',
    );
    expect(createFrontendCallbackUrl(configService)).toBe(
      'https://app.example.com/callback',
    );
  });

  it('falls back to CLIENT_URL and creates a generic error callback', () => {
    const configService = new ConfigService({
      NODE_ENV: 'production',
      CLIENT_URL: 'https://app.example.com',
    });

    expect(createFrontendCallbackUrl(configService, 'google_auth_failed')).toBe(
      'https://app.example.com/callback?error=google_auth_failed',
    );
  });

  it('uses localhost only outside production', () => {
    expect(resolveFrontendOrigin(new ConfigService())).toBe(
      'http://localhost:3000',
    );
  });

  it('rejects a missing or non-HTTPS production frontend URL', () => {
    expect(() =>
      resolveFrontendOrigin(new ConfigService({ NODE_ENV: 'production' })),
    ).toThrow('FRONTEND_URL or CLIENT_URL is required in production');
    expect(() =>
      resolveFrontendOrigin(
        new ConfigService({
          NODE_ENV: 'production',
          FRONTEND_URL: 'http://app.example.com',
        }),
      ),
    ).toThrow('Frontend URL must use HTTPS in production');
  });

  it('normalizes and deduplicates every configured CORS origin', () => {
    const configService = new ConfigService({
      NODE_ENV: 'production',
      CLIENT_URL: 'https://app.example.com/client-path',
      FRONTEND_URL: 'https://app.example.com',
      ADMIN_CLIENT_URL: 'https://admin.example.com/path',
    });

    expect(resolveAllowedFrontendOrigins(configService)).toEqual([
      'https://app.example.com',
      'https://admin.example.com',
    ]);
  });
});
