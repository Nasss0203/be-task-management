import { ConfigService } from '@nestjs/config';

const DEVELOPMENT_CLIENT_ORIGIN = 'http://localhost:3000';
const DEVELOPMENT_ADMIN_ORIGIN = 'http://localhost:5173';

const isProduction = (configService: ConfigService): boolean =>
  configService.get<string>('NODE_ENV') === 'production';

const parseConfiguredUrl = (value: string, configName: string): URL => {
  try {
    return new URL(value);
  } catch {
    throw new Error(`${configName} must be a valid absolute URL`);
  }
};

const assertProductionHttps = (
  url: URL,
  configName: string,
  production: boolean,
): void => {
  if (production && url.protocol !== 'https:') {
    throw new Error(`${configName} must use HTTPS in production`);
  }
};

export const resolveFrontendOrigin = (configService: ConfigService): string => {
  const production = isProduction(configService);
  const configuredUrl =
    configService.get<string>('FRONTEND_URL') ||
    configService.get<string>('CLIENT_URL');

  if (!configuredUrl) {
    if (production) {
      throw new Error('FRONTEND_URL or CLIENT_URL is required in production');
    }

    return DEVELOPMENT_CLIENT_ORIGIN;
  }

  const url = parseConfiguredUrl(configuredUrl, 'Frontend URL');
  assertProductionHttps(url, 'Frontend URL', production);

  return url.origin;
};

export const createFrontendCallbackUrl = (
  configService: ConfigService,
  errorCode?: 'google_auth_failed',
): string => {
  const callbackUrl = new URL(
    '/callback',
    resolveFrontendOrigin(configService),
  );

  if (errorCode) {
    callbackUrl.searchParams.set('error', errorCode);
  }

  return callbackUrl.toString();
};

export const resolveAllowedFrontendOrigins = (
  configService: ConfigService,
): string[] => {
  const production = isProduction(configService);
  const configuredOrigins = [
    ['CLIENT_URL', configService.get<string>('CLIENT_URL')],
    ['FRONTEND_URL', configService.get<string>('FRONTEND_URL')],
    ['ADMIN_CLIENT_URL', configService.get<string>('ADMIN_CLIENT_URL')],
  ] as const;

  const origins: string[] = [resolveFrontendOrigin(configService)];
  for (const [configName, value] of configuredOrigins) {
    if (!value) {
      continue;
    }

    const url = parseConfiguredUrl(value, configName);
    assertProductionHttps(url, configName, production);
    origins.push(url.origin);
  }

  if (!production) {
    origins.push(DEVELOPMENT_CLIENT_ORIGIN, DEVELOPMENT_ADMIN_ORIGIN);
  }

  return [...new Set(origins)];
};
