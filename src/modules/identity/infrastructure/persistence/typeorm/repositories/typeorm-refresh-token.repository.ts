import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshToken } from 'src/modules/identity/infrastructure/persistence/typeorm/entities/refresh-token.orm-entity';
import { Repository } from 'typeorm';
import {
  CreateRefreshTokenInput,
  RefreshTokenRecord,
  RefreshTokenRepository,
} from 'src/modules/identity/domain/repositories/refresh-token.repository';

@Injectable()
export class TypeOrmRefreshTokenRepository implements RefreshTokenRepository {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshRepo: Repository<RefreshToken>,
  ) {}

  async create(input: CreateRefreshTokenInput): Promise<RefreshTokenRecord> {
    const saved = await this.refreshRepo.save({
      user_id: input.userId,
      token: input.tokenHash,
      expires_at: input.expiresAt,
    });
    return saved as RefreshTokenRecord;
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
    return this.refreshRepo.findOne({
      where: { token: tokenHash },
    }) as Promise<RefreshTokenRecord | null>;
  }

  async findByTokenHashWithUser(
    tokenHash: string,
  ): Promise<RefreshTokenRecord | null> {
    return this.refreshRepo.findOne({
      where: { token: tokenHash },
      relations: ['user'],
    }) as Promise<RefreshTokenRecord | null>;
  }

  async save(refreshToken: RefreshTokenRecord): Promise<RefreshTokenRecord> {
    const saved = await this.refreshRepo.save(refreshToken as RefreshToken);
    return saved as RefreshTokenRecord;
  }
}
