import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ErrorCode } from 'src/common/constants/error-code.constant';
import { SystemRole } from 'src/modules/identity/domain/enums/system-role.enum';
import { type UserRepository } from 'src/modules/identity/domain/repositories/user.repository';
import { IssueAuthTokenServiceImpl } from '../../services/issue-auth-token.service';
import { IDENTITY_TYPES } from 'src/modules/identity/identity.types';
import type { LoginAttemptRecorder } from '../../ports/login-attempt-recorder.port';
import { LoginAuthCommand } from './login-auth.command';

@Injectable()
export class LoginAuthHandler {
  constructor(
    @Inject(IDENTITY_TYPES.repositories.UserRepository)
    private readonly userRepository: UserRepository,
    private readonly issueAuthTokenService: IssueAuthTokenServiceImpl,
    @Inject(IDENTITY_TYPES.ports.LoginAttemptRecorder)
    private readonly loginAttemptRecorder: LoginAttemptRecorder,
  ) {}

  async execute(command: LoginAuthCommand) {
    const { email, username } = command.auth;
    const attempt = {
      method: 'PASSWORD' as const,
      attemptedEmail: email,
      client: command.client,
    };

    const user = await this.userRepository.findByEmailAndUsername(
      email,
      username,
    );

    if (!user || !user.isActive) {
      await this.loginAttemptRecorder.record({
        ...attempt,
        result: 'FAILED',
        reason: user ? 'ACCOUNT_LOCKED' : 'USER_NOT_FOUND',
        userId: user?.id ?? null,
      });

      throw new HttpException(
        {
          code: ErrorCode.AUTH_INVALID_CREDENTIALS,
          message: 'Invalid credentials',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    const isSuperAdmin = user.systemRole === SystemRole.SUPER_ADMIN;
    if (!user.isEmailVerified && !isSuperAdmin) {
      await this.loginAttemptRecorder.record({
        ...attempt,
        result: 'FAILED',
        reason: 'EMAIL_NOT_VERIFIED',
        userId: user.id,
      });

      throw new HttpException(
        {
          code: ErrorCode.EMAIL_NOT_VERIFIED,
          message: 'Please verify your email address before logging in',
        },
        HttpStatus.FORBIDDEN,
      );
    }

    const tokens = await this.issueAuthTokenService.issueTokens(
      user,
      command.client,
    );

    await this.loginAttemptRecorder.record({
      ...attempt,
      result: 'SUCCESS',
      userId: user.id,
    });

    return tokens;
  }
}
