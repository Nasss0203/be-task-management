import { ConfigService } from '@nestjs/config';
import {
  createFrontendCallbackUrl,
  isAllowedFrontendOrigin,
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

  it('allows the root frontend and a valid development published subdomain', () => {
    const configService = new ConfigService({
      NODE_ENV: 'development',
      FRONTEND_URL: 'http://localhost:3000',
    });

    expect(
      isAllowedFrontendOrigin(configService, 'http://localhost:3000'),
    ).toBe(true);
    expect(
      isAllowedFrontendOrigin(configService, 'http://asss.localhost:3000'),
    ).toBe(true);
  });

  it.each([
    'http://evil-localhost.com:3000',
    'http://localhost.attacker.com',
    'http://foo.example.com',
    'http://foo.bar.localhost:3000',
    'http://-invalid.localhost:3000',
    'http://www.localhost:3000',
  ])('rejects unrelated or invalid development origin %s', (origin) => {
    const configService = new ConfigService({ NODE_ENV: 'development' });
    expect(isAllowedFrontendOrigin(configService, origin)).toBe(false);
  });

  it('allows only one valid subdomain of the configured production public-site domain', () => {
    const configService = new ConfigService({
      NODE_ENV: 'production',
      FRONTEND_URL: 'https://app.example.com',
      PUBLIC_SITE_DOMAIN: 'published.example.com',
    });

    expect(
      isAllowedFrontendOrigin(
        configService,
        'https://customer.published.example.com',
      ),
    ).toBe(true);
    expect(
      isAllowedFrontendOrigin(
        configService,
        'https://nested.customer.published.example.com',
      ),
    ).toBe(false);
    expect(
      isAllowedFrontendOrigin(
        configService,
        'https://customer.other.example.com',
      ),
    ).toBe(false);
    expect(
      isAllowedFrontendOrigin(
        configService,
        'http://customer.published.example.com',
      ),
    ).toBe(false);
  });
});
