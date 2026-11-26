import type { AuthClientInfo } from '../services/issue-auth-token.service';

export const LOGIN_ATTEMPT_METHODS = ['PASSWORD', 'GOOGLE'] as const;

export type LoginAttemptMethod = (typeof LOGIN_ATTEMPT_METHODS)[number];

export const LOGIN_ATTEMPT_RESULTS = ['SUCCESS', 'FAILED'] as const;

export type LoginAttemptResult = (typeof LOGIN_ATTEMPT_RESULTS)[number];

export const LOGIN_FAILURE_REASONS = [
  'USER_NOT_FOUND',
  'WRONG_PASSWORD',
  'ACCOUNT_LOCKED',
  'PASSWORD_NOT_SET',
  'EMAIL_NOT_VERIFIED',
  'GOOGLE_EMAIL_UNVERIFIED',
  'GOOGLE_EMAIL_CONFLICT',
  'GOOGLE_FAILED',
] as const;

export type LoginFailureReason = (typeof LOGIN_FAILURE_REASONS)[number];

export type LoginAttemptEntry = {
  method: LoginAttemptMethod;
  userId: string | null;
  attemptedEmail: string | null;
  client?: AuthClientInfo;
} & (
  | { result: 'SUCCESS'; reason?: null }
  | { result: 'FAILED'; reason: LoginFailureReason }
);

export interface LoginAttemptRecorder {
  record(entry: LoginAttemptEntry): Promise<void>;
}
