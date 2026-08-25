import { Inject, Injectable } from '@nestjs/common';
import { hashIdentityToken } from 'src/modules/identity/infrastructure/security/token/token-hasher';
import { type RefreshTokenRepository } from 'src/modules/identity/domain/repositories/refresh-token.repository';
import { IDENTITY_TYPES } from 'src/modules/identity/identity.types';
import { LogoutAuthCommand } from './logout-auth.command';

export interface LogoutAuthResult {
  success: boolean;
}

@Injectable()
export class LogoutAuthHandler {
  constructor(
    @Inject(IDENTITY_TYPES.repositories.RefreshTokenRepository)
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async execute(command: LogoutAuthCommand): Promise<LogoutAuthResult> {
    const { refreshToken } = command;
    if (!refreshToken) {
      return { success: true };
    }

    const stored = await this.refreshTokenRepository.findByTokenHash(
      hashIdentityToken(refreshToken),
    );

    if (stored && !stored.revoked_at) {
      stored.revoked_at = new Date();
      await this.refreshTokenRepository.save(stored);
    }

    return { success: true };
  }
}
