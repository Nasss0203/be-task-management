import type { CreatorLinks } from '../../../domain/entities/creator-profile.entity';

export interface CreatorStatsDto {
  template_count: number;
  rating_average: number | null;
  rating_count: number;
  like_count: number;
}

export interface PublicCreatorProfileDto {
  handle: string;
  display_name: string;
  headline: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  links: CreatorLinks;
  stats: CreatorStatsDto;
  joined_at: Date;
}

export interface MyCreatorProfileDto {
  has_profile: boolean;
  handle: string;
  display_name: string | null;
  headline: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  links: CreatorLinks;
}
