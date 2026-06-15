import { applyDecorators, SetMetadata } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

export const RATE_LIMIT_MESSAGE_METADATA = 'rate_limit_message';

const ONE_MINUTE = 60_000;

export const RateLimitPreset = {
  auth: { default: { limit: 5, ttl: ONE_MINUTE, blockDuration: ONE_MINUTE } },
  token: { default: { limit: 20, ttl: ONE_MINUTE } },
  read: { default: { limit: 10000, ttl: ONE_MINUTE } },
  publicRead: { default: { limit: 120, ttl: ONE_MINUTE } },
  search: { default: { limit: 60, ttl: ONE_MINUTE } },
  write: { default: { limit: 80, ttl: ONE_MINUTE } },
  strictWrite: { default: { limit: 30, ttl: ONE_MINUTE } },
  upload: {
    default: { limit: 15, ttl: ONE_MINUTE, blockDuration: ONE_MINUTE },
  },
  billing: {
    default: { limit: 10, ttl: ONE_MINUTE, blockDuration: ONE_MINUTE },
  },
  invite: {
    default: { limit: 20, ttl: ONE_MINUTE, blockDuration: ONE_MINUTE },
  },
  admin: { default: { limit: 100, ttl: ONE_MINUTE } },
  webhook: { default: { limit: 300, ttl: ONE_MINUTE } },
} as const;

const defaultMessages = {
  auth: 'Too many authentication attempts. Please wait a minute and try again.',
  token: 'Too many token requests. Please wait a minute and try again.',
  read: 'Too many requests. Please slow down and try again shortly.',
  publicRead: 'Too many public requests. Please try again shortly.',
  search: 'Too many search requests. Please pause briefly and try again.',
  write: 'Too many changes submitted. Please wait a minute and try again.',
  strictWrite:
    'Too many sensitive actions. Please wait a minute and try again.',
  upload: 'Too many upload attempts. Please wait a minute and try again.',
  billing: 'Too many billing requests. Please wait a minute and try again.',
  invite: 'Too many invite requests. Please wait a minute and try again.',
  admin: 'Too many admin requests. Please slow down and try again shortly.',
  webhook: 'Too many webhook requests. Please try again shortly.',
} as const;

export const RateLimitMessage = (message: string) =>
  SetMetadata(RATE_LIMIT_MESSAGE_METADATA, message);

const rateLimit = (
  preset: (typeof RateLimitPreset)[keyof typeof RateLimitPreset],
  message: string,
) => applyDecorators(Throttle(preset), RateLimitMessage(message));

export const AuthRateLimit = (message = defaultMessages.auth) =>
  rateLimit(RateLimitPreset.auth, message);
export const TokenRateLimit = (message = defaultMessages.token) =>
  rateLimit(RateLimitPreset.token, message);
export const ReadRateLimit = (message = defaultMessages.read) =>
  rateLimit(RateLimitPreset.read, message);
export const PublicReadRateLimit = (message = defaultMessages.publicRead) =>
  rateLimit(RateLimitPreset.publicRead, message);
export const SearchRateLimit = (message = defaultMessages.search) =>
  rateLimit(RateLimitPreset.search, message);
export const WriteRateLimit = (message = defaultMessages.write) =>
  rateLimit(RateLimitPreset.write, message);
export const StrictWriteRateLimit = (message = defaultMessages.strictWrite) =>
  rateLimit(RateLimitPreset.strictWrite, message);
export const UploadRateLimit = (message = defaultMessages.upload) =>
  rateLimit(RateLimitPreset.upload, message);
export const BillingRateLimit = (message = defaultMessages.billing) =>
  rateLimit(RateLimitPreset.billing, message);
export const InviteRateLimit = (message = defaultMessages.invite) =>
  rateLimit(RateLimitPreset.invite, message);
export const AdminRateLimit = (message = defaultMessages.admin) =>
  rateLimit(RateLimitPreset.admin, message);
export const WebhookRateLimit = (message = defaultMessages.webhook) =>
  rateLimit(RateLimitPreset.webhook, message);
