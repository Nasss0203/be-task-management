import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ErrorCode } from 'src/common/constants/error-code.constant';
import { hashIdentityToken } from 'src/modules/identity/infrastructure/security/token/token-hasher';
import { type RefreshTokenRepository } from 'src/modules/identity/domain/repositories/refresh-token.repository';
import {
  IssueAuthTokenServiceImpl,
  AuthTokenPair,
} from '../../services/issue-auth-token.service';
import { IDENTITY_TYPES } from 'src/modules/identity/identity.types';
import { RefreshAuthCommand } from './refresh-auth.command';

@Injectable()
export class RefreshAuthHandler {
  constructor(
    @Inject(IDENTITY_TYPES.repositories.RefreshTokenRepository)
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly issueAuthTokenService: IssueAuthTokenServiceImpl,
  ) {}

  async execute(command: RefreshAuthCommand): Promise<AuthTokenPair> {
    const { refreshToken } = command;
    if (!refreshToken) {
      throw new HttpException(
        {
          code: ErrorCode.AUTH_INVALID_TOKEN,
          message: 'Refresh token is required',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    const stored = await this.refreshTokenRepository.findByTokenHashWithUser(
      hashIdentityToken(refreshToken),
    );

    if (
      !stored ||
      stored.revoked_at ||
      stored.expires_at.getTime() <= Date.now()
    ) {
      throw new HttpException(
        {
          code: ErrorCode.AUTH_INVALID_TOKEN,
          message: 'Invalid refresh token',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (!stored.user || !stored.user.isActive) {
      throw new HttpException(
        {
          code: ErrorCode.USER_INACTIVE,
          message: 'User is inactive',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    stored.revoked_at = new Date();
    await this.refreshTokenRepository.save(stored);

    return this.issueAuthTokenService.issueTokens(stored.user);
  }
}
