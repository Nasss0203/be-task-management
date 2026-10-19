import type { ObjectStoragePort } from 'src/shared/application/ports/object-storage.port';

import {
  CREATOR_LINK_KEYS,
  type CreatorLinks,
  type CreatorProfile,
} from '../../domain/entities/creator-profile.entity';
import type { MyCreatorProfileDto } from '../dto/creator-profile/creator-profile.response.dto';

export const CREATOR_IMAGE_URL_TTL_SECONDS = 60 * 60;

export const EMPTY_CREATOR_LINKS = Object.fromEntries(
  CREATOR_LINK_KEYS.map((key) => [key, null]),
) as CreatorLinks;

export function resolveCreatorImageUrl(
  storage: ObjectStoragePort,
  key: string | null,
): Promise<string | null> {
  return key
    ? storage.getSignedDownloadUrl(key, CREATOR_IMAGE_URL_TTL_SECONDS)
    : Promise.resolve(null);
}

export function suggestCreatorHandle(username: string): string {
  const slug = username
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30)
    .replace(/-+$/g, '');

  return slug.length >= 3 ? slug : `${slug}-creator`.replace(/^-/, '');
}

export async function presentMyCreatorProfile(
  storage: ObjectStoragePort,
  profile: CreatorProfile | null,
  account: { username: string; avatarUrl: string | null },
): Promise<MyCreatorProfileDto> {
  if (!profile) {
    return {
      has_profile: false,
      handle: suggestCreatorHandle(account.username),
      display_name: null,
      headline: null,
      bio: null,
      avatar_url: account.avatarUrl,
      cover_url: null,
      links: EMPTY_CREATOR_LINKS,
    };
  }

  const [avatarUrl, coverUrl] = await Promise.all([
    resolveCreatorImageUrl(storage, profile.getAvatarKey()),
    resolveCreatorImageUrl(storage, profile.getCoverKey()),
  ]);

  return {
    has_profile: true,
    handle: profile.getHandle(),
    display_name: profile.getDisplayName(),
    headline: profile.getHeadline(),
    bio: profile.getBio(),
    avatar_url: avatarUrl ?? account.avatarUrl,
    cover_url: coverUrl,
    links: profile.getLinks(),
  };
}
