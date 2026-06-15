import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ErrorCode } from 'src/common/constants/error-code.constant';
import { IAuth } from 'src/types/auth';
import { type AuthUserRepository } from '../interfaces/repositories/auth-user.repository.interface';
import { type IssueAuthTokenService } from '../interfaces/services/issue-auth-token.service.interface';
import { LoginAuthService } from '../interfaces/services/login-auth.service.interface';
import { AUTH_TYPES } from '../interfaces/types';

@Injectable()
export class LoginAuthServiceImpl implements LoginAuthService {
  constructor(
    @Inject(AUTH_TYPES.repositories.AuthUserRepository)
    private readonly userRepository: AuthUserRepository,
    @Inject(AUTH_TYPES.services.IssueAuthTokenService)
    private readonly issueAuthTokenService: IssueAuthTokenService,
  ) {}

  async login(auth: IAuth) {
    const { email, username } = auth;

    const user = await this.userRepository.findByEmailAndUsername(
      email,
      username,
    );

    if (!user || !user.isActive) {
      throw new HttpException(
        {
          code: ErrorCode.AUTH_INVALID_CREDENTIALS,
          message: 'Invalid credentials',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (!user.isEmailVerified) {
      throw new HttpException(
        {
          code: ErrorCode.EMAIL_NOT_VERIFIED,
          message: 'Please verify your email address before logging in',
        },
        HttpStatus.FORBIDDEN,
      );
    }

    return this.issueAuthTokenService.issueTokens(user);
  }
}
