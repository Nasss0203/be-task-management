import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import { hashIdentityToken } from 'src/modules/identity/infrastructure/security/token/token-hasher';
import { IUserJwtPayload } from 'src/modules/identity/identity-jwt.types';
import { type RefreshTokenRepository } from 'src/modules/identity/domain/repositories/refresh-token.repository';
import { type UserRecord } from 'src/modules/identity/domain/repositories/user.repository';
import { IDENTITY_TYPES } from 'src/modules/identity/identity.types';

export interface AuthTokenPair {
  access_token: string;
  refresh_token: string;
}

@Injectable()
export class IssueAuthTokenServiceImpl {
  constructor(
    private readonly jwt: JwtService,
    @Inject(IDENTITY_TYPES.repositories.RefreshTokenRepository)
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async issueTokens(user: UserRecord): Promise<AuthTokenPair> {
    const payload: IUserJwtPayload = {
      sub: user.id,
      id: user.id,
      email: user.email,
      username: user.username,
      systemRole: user.systemRole,
    };

    const access_token = this.jwt.sign(payload, { expiresIn: '15m' });
    const refresh_token = randomBytes(64).toString('hex');

    await this.refreshTokenRepository.create({
      userId: user.id,
      tokenHash: hashIdentityToken(refresh_token),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return {
      access_token,
      refresh_token,
    };
  }
}
