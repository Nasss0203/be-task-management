import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ErrorCode } from 'src/common/constants/error-code.constant';
import { hashToken } from 'src/utils';
import { type AuthRefreshTokenRepository } from '../interfaces/repositories/auth-refresh-token.repository.interface';
import { type IssueAuthTokenService } from '../interfaces/services/issue-auth-token.service.interface';
import { RefreshAuthService } from '../interfaces/services/refresh-auth.service.interface';
import { AUTH_TYPES } from '../interfaces/types';

@Injectable()
export class RefreshAuthServiceImpl implements RefreshAuthService {
  constructor(
    @Inject(AUTH_TYPES.repositories.AuthRefreshTokenRepository)
    private readonly refreshTokenRepository: AuthRefreshTokenRepository,
    @Inject(AUTH_TYPES.services.IssueAuthTokenService)
    private readonly issueAuthTokenService: IssueAuthTokenService,
  ) {}

  async refresh(refreshToken?: string) {
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
      hashToken(refreshToken),
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
