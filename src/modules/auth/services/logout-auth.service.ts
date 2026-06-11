import { Inject, Injectable } from '@nestjs/common';
import { hashToken } from 'src/utils';
import { type AuthRefreshTokenRepository } from '../interfaces/repositories/auth-refresh-token.repository.interface';
import {
  LogoutAuthResult,
  LogoutAuthService,
} from '../interfaces/services/logout-auth.service.interface';
import { AUTH_TYPES } from '../interfaces/types';

@Injectable()
export class LogoutAuthServiceImpl implements LogoutAuthService {
  constructor(
    @Inject(AUTH_TYPES.repositories.AuthRefreshTokenRepository)
    private readonly refreshTokenRepository: AuthRefreshTokenRepository,
  ) {}

  async logout(refreshToken?: string): Promise<LogoutAuthResult> {
    if (!refreshToken) {
      return { success: true };
    }

    const stored = await this.refreshTokenRepository.findByTokenHash(
      hashToken(refreshToken),
    );

    if (stored && !stored.revoked_at) {
      stored.revoked_at = new Date();
      await this.refreshTokenRepository.save(stored);
    }

    return { success: true };
  }
}
