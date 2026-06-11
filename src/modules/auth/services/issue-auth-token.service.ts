import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import { User } from 'src/modules/users/domain/entities/user.entity';
import { hashToken } from 'src/utils';
import { IUserJwtPayload } from '../interfaces/type';
import { type AuthRefreshTokenRepository } from '../interfaces/repositories/auth-refresh-token.repository.interface';
import {
  AuthTokenPair,
  IssueAuthTokenService,
} from '../interfaces/services/issue-auth-token.service.interface';
import { AUTH_TYPES } from '../interfaces/types';

@Injectable()
export class IssueAuthTokenServiceImpl implements IssueAuthTokenService {
  constructor(
    private readonly jwt: JwtService,
    @Inject(AUTH_TYPES.repositories.AuthRefreshTokenRepository)
    private readonly refreshTokenRepository: AuthRefreshTokenRepository,
  ) {}

  async issueTokens(user: User): Promise<AuthTokenPair> {
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
      tokenHash: hashToken(refresh_token),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return {
      access_token,
      refresh_token,
    };
  }
}
