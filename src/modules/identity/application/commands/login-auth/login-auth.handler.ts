import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ErrorCode } from 'src/common/constants/error-code.constant';
import { SystemRole } from 'src/modules/identity/domain/enums/system-role.enum';
import { type UserRepository } from 'src/modules/identity/domain/repositories/user.repository';
import { IssueAuthTokenServiceImpl } from '../../services/issue-auth-token.service';
import { IDENTITY_TYPES } from 'src/modules/identity/identity.types';
import { LoginAuthCommand } from './login-auth.command';

@Injectable()
export class LoginAuthHandler {
  constructor(
    @Inject(IDENTITY_TYPES.repositories.UserRepository)
    private readonly userRepository: UserRepository,
    private readonly issueAuthTokenService: IssueAuthTokenServiceImpl,
  ) {}

  async execute(command: LoginAuthCommand) {
    const { email, username } = command.auth;

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

    const isSuperAdmin = user.systemRole === SystemRole.SUPER_ADMIN;
    if (!user.isEmailVerified && !isSuperAdmin) {
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
