import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshToken } from 'src/modules/refresh_token/entities/refresh_token.entity';
import { Repository } from 'typeorm';
import {
  AuthRefreshTokenRepository,
  CreateRefreshTokenInput,
} from '../interfaces/repositories/auth-refresh-token.repository.interface';

@Injectable()
export class AuthRefreshTokenRepositoryImpl
  implements AuthRefreshTokenRepository
{
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshRepo: Repository<RefreshToken>,
  ) {}

  create(input: CreateRefreshTokenInput): Promise<RefreshToken> {
    return this.refreshRepo.save({
      user_id: input.userId,
      token: input.tokenHash,
      expires_at: input.expiresAt,
    });
  }

  findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    return this.refreshRepo.findOne({
      where: { token: tokenHash },
    });
  }

  findByTokenHashWithUser(tokenHash: string): Promise<RefreshToken | null> {
    return this.refreshRepo.findOne({
      where: { token: tokenHash },
      relations: ['user'],
    });
  }

  save(refreshToken: RefreshToken): Promise<RefreshToken> {
    return this.refreshRepo.save(refreshToken);
  }
}
