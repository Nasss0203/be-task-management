import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { Strategy } from 'passport-local';
import { ErrorCode } from '../constants/error-code.constant';
import { ValidateUserAuthServiceImpl } from 'src/modules/identity/application/services/validate-user-auth.service';
import type { LoginAttemptRecorder } from 'src/modules/identity/application/ports/login-attempt-recorder.port';
import { IDENTITY_TYPES } from 'src/modules/identity/identity.types';
import { authClientOf } from 'src/modules/identity/presentation/http/auth-client';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly validateUserAuthService: ValidateUserAuthServiceImpl,
    @Inject(IDENTITY_TYPES.ports.LoginAttemptRecorder)
    private readonly loginAttemptRecorder: LoginAttemptRecorder,
  ) {
    super({
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true,
    });
  }

  async validate(req: Request, email: string, password: string) {
    const { user, reason } =
      await this.validateUserAuthService.checkCredentials(email, password);

    if (reason) {
      await this.loginAttemptRecorder.record({
        method: 'PASSWORD',
        result: 'FAILED',
        reason,
        userId: user?.id ?? null,
        attemptedEmail: email,
        client: authClientOf(req),
      });

      throw new HttpException(
        {
          code: ErrorCode.AUTH_INVALID_CREDENTIALS,
          message: 'Invalid credentials',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    return user;
  }
}
