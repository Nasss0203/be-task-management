import { ConfigService } from '@nestjs/config';

const DEVELOPMENT_CLIENT_ORIGIN = 'http://localhost:3000';
const DEVELOPMENT_ADMIN_ORIGIN = 'http://localhost:5173';
const PUBLIC_SITE_SUBDOMAIN_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;
const DOMAIN_LABEL_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;
const RESERVED_PUBLIC_SITE_SUBDOMAINS = new Set(['api', 'www']);

export const isAllowedFrontendOrigin = (
  configService: ConfigService,
  origin: string | undefined,
): boolean => {
  if (!origin) {
    return true;
  }

  const parsedOrigin = parseRequestOrigin(origin);
  if (!parsedOrigin) {
    return false;
  }

  const allowedOrigins = resolveAllowedFrontendOrigins(configService);

  if (allowedOrigins.includes(parsedOrigin.origin)) {
    return true;
  }

  if (!isProduction(configService)) {
    return isDevelopmentPublicSiteOrigin(parsedOrigin);
  }

  return isProductionPublicSiteOrigin(configService, parsedOrigin);
};

const isProduction = (configService: ConfigService): boolean =>
  configService.get<string>('NODE_ENV') === 'production';

const parseConfiguredUrl = (value: string, configName: string): URL => {
  try {
    return new URL(value);
  } catch {
    throw new Error(`${configName} must be a valid absolute URL`);
  }
};

const parseRequestOrigin = (origin: string): URL | null => {
  try {
    const parsedOrigin = new URL(origin);

    if (
      parsedOrigin.username ||
      parsedOrigin.password ||
      parsedOrigin.pathname !== '/' ||
      parsedOrigin.search ||
      parsedOrigin.hash
    ) {
      return null;
    }

    return parsedOrigin;
  } catch {
    return null;
  }
};

const isValidPublicSiteSubdomain = (value: string): boolean =>
  PUBLIC_SITE_SUBDOMAIN_PATTERN.test(value) &&
  !RESERVED_PUBLIC_SITE_SUBDOMAINS.has(value.toLowerCase());

const isDevelopmentPublicSiteOrigin = (origin: URL): boolean => {
  if (
    origin.protocol !== 'http:' ||
    origin.port !== '3000' ||
    !origin.hostname.toLowerCase().endsWith('.localhost')
  ) {
    return false;
  }

  const subdomain = origin.hostname.slice(0, -'.localhost'.length);
  return isValidPublicSiteSubdomain(subdomain);
};

const resolvePublicSiteDomain = (
  configService: ConfigService,
): string | null => {
  const value = configService.get<string>('PUBLIC_SITE_DOMAIN');
  if (!value) {
    return null;
  }

  const domain = value.trim().toLowerCase().replace(/\.$/, '');
  const labels = domain.split('.');

  if (
    domain.includes('/') ||
    domain.includes(':') ||
    labels.some((label) => !DOMAIN_LABEL_PATTERN.test(label))
  ) {
    throw new Error('PUBLIC_SITE_DOMAIN must be a valid hostname');
  }

  return domain;
};

const isProductionPublicSiteOrigin = (
  configService: ConfigService,
  origin: URL,
): boolean => {
  const publicSiteDomain = resolvePublicSiteDomain(configService);
  if (!publicSiteDomain || origin.protocol !== 'https:' || origin.port) {
    return false;
  }

  const suffix = `.${publicSiteDomain}`;
  const hostname = origin.hostname.toLowerCase();
  if (!hostname.endsWith(suffix)) {
    return false;
  }

  const subdomain = hostname.slice(0, -suffix.length);
  return isValidPublicSiteSubdomain(subdomain);
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
