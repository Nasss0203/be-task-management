import type {
  LoginAttemptMethod,
  LoginAttemptResult,
} from 'src/modules/identity/application/ports/login-attempt-recorder.port';

export class ListAdminLoginAttemptsQuery {
  constructor(
    public readonly page: number,
    public readonly limit: number,
    public readonly result?: LoginAttemptResult,
    public readonly method?: LoginAttemptMethod,
    public readonly search?: string,
    public readonly userId?: string,
  ) {}
}
