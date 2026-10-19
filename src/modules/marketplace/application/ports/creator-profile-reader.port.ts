import type { CreatorLinks } from '../../domain/entities/creator-profile.entity';

export interface PublicCreatorRecord {
  userId: string;
  handle: string;
  hasProfile: boolean;
  displayName: string | null;
  headline: string | null;
  bio: string | null;
  links: CreatorLinks;
  avatarKey: string | null;
  coverKey: string | null;
  fallbackAvatarUrl: string | null;
  username: string;
  joinedAt: Date;
}

export interface CreatorStats {
  templateCount: number;
  ratingAverage: number | null;
  ratingCount: number;
  likeCount: number;
}

export interface CreatorProfileReader {
  findPublicByHandle(handle: string): Promise<PublicCreatorRecord | null>;

  findAccount(
    userId: string,
  ): Promise<{ username: string; avatarUrl: string | null } | null>;

  getStats(userId: string): Promise<CreatorStats>;

  isHandleTaken(handle: string, userId: string): Promise<boolean>;
}
