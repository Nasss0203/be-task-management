import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { MARKETPLACE_TYPES } from 'src/modules/marketplace/marketplace.types';
import type { ObjectStoragePort } from 'src/shared/application/ports/object-storage.port';
import { STORAGE_TYPES } from 'src/shared/infrastructure/storage/storage.types';

import type { PublicCreatorProfileDto } from '../../../dto/creator-profile/creator-profile.response.dto';
import type { CreatorProfileReader } from '../../../ports/creator-profile-reader.port';
import { resolveCreatorImageUrl } from '../../../services/creator-profile-presenter';
import { GetPublicCreatorProfileQuery } from './get-public-creator-profile.query';

@Injectable()
export class GetPublicCreatorProfileHandler {
  constructor(
    @Inject(MARKETPLACE_TYPES.ports.CreatorProfileReader)
    private readonly reader: CreatorProfileReader,

    @Inject(STORAGE_TYPES.ObjectStorage)
    private readonly storage: ObjectStoragePort,
  ) {}

  async execute(
    query: GetPublicCreatorProfileQuery,
  ): Promise<PublicCreatorProfileDto> {
    const creator = await this.reader.findPublicByHandle(query.handle);

    if (!creator) {
      throw new NotFoundException('Creator not found');
    }

    const stats = await this.reader.getStats(creator.userId);

    if (!creator.hasProfile && stats.templateCount === 0) {
      throw new NotFoundException('Creator not found');
    }

    const [avatarUrl, coverUrl] = await Promise.all([
      resolveCreatorImageUrl(this.storage, creator.avatarKey),
      resolveCreatorImageUrl(this.storage, creator.coverKey),
    ]);

    return {
      handle: creator.handle,
      display_name: creator.displayName ?? creator.username,
      headline: creator.headline,
      bio: creator.bio,
      avatar_url: avatarUrl ?? creator.fallbackAvatarUrl,
      cover_url: coverUrl,
      links: creator.links,
      stats: {
        template_count: stats.templateCount,
        rating_average: stats.ratingAverage,
        rating_count: stats.ratingCount,
        like_count: stats.likeCount,
      },
      joined_at: creator.joinedAt,
    };
  }
}
