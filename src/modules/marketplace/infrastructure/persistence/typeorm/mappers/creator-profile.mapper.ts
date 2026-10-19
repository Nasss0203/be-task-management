import { CreatorProfile } from '../../../../domain/entities/creator-profile.entity';
import { CreatorProfileOrmEntity } from '../entities/creator-profile.orm-entity';

export class CreatorProfileMapper {
  static toDomain(entity: CreatorProfileOrmEntity): CreatorProfile {
    return CreatorProfile.reconstitute({
      userId: entity.userId,
      handle: entity.handle,
      displayName: entity.displayName,
      headline: entity.headline,
      bio: entity.bio,
      links: {
        website: entity.websiteUrl,
        x: entity.xUrl,
        github: entity.githubUrl,
        linkedin: entity.linkedinUrl,
        youtube: entity.youtubeUrl,
        facebook: entity.facebookUrl,
      },
      avatarKey: entity.avatarKey,
      coverKey: entity.coverKey,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  static toOrm(domain: CreatorProfile): CreatorProfileOrmEntity {
    const entity = new CreatorProfileOrmEntity();
    const links = domain.getLinks();

    entity.userId = domain.getUserId();
    entity.handle = domain.getHandle();
    entity.displayName = domain.getDisplayName();
    entity.headline = domain.getHeadline();
    entity.bio = domain.getBio();
    entity.websiteUrl = links.website;
    entity.xUrl = links.x;
    entity.githubUrl = links.github;
    entity.linkedinUrl = links.linkedin;
    entity.youtubeUrl = links.youtube;
    entity.facebookUrl = links.facebook;
    entity.avatarKey = domain.getAvatarKey();
    entity.coverKey = domain.getCoverKey();
    entity.createdAt = domain.getCreatedAt();
    entity.updatedAt = domain.getUpdatedAt();

    return entity;
  }
}
