import { UserRecord } from './user.repository';

export interface CreateRefreshTokenInput {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface RefreshTokenRecord {
  id: string;
  user_id: string;
  token: string;
  user: UserRecord | null;
  expires_at: Date;
  revoked_at: Date | null;
  created_at: Date;
}

export interface RefreshTokenRepository {
  create(input: CreateRefreshTokenInput): Promise<RefreshTokenRecord>;
  findByTokenHash(tokenHash: string): Promise<RefreshTokenRecord | null>;
  findByTokenHashWithUser(
    tokenHash: string,
  ): Promise<RefreshTokenRecord | null>;
  save(refreshToken: RefreshTokenRecord): Promise<RefreshTokenRecord>;
}
