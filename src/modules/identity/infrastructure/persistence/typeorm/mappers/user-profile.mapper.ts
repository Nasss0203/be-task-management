import { UserProfileAggregate } from 'src/modules/identity/domain/aggregates/user-profile/user-profile.aggregate';
import { UserProfile } from '../entities/user-profile.orm-entity';

export class UserProfileMapper {
  static toDomain(entity: UserProfile): UserProfileAggregate {
    return new UserProfileAggregate(
      entity.id,
      entity.userId,
      entity.lastActiveWorkspaceId,
      entity.displayName,
      entity.fullName,
      entity.bio,
      entity.phoneNumber,
      entity.location,
      entity.jobTitle,
      entity.website,
      entity.coverUrl,
      entity.timezone,
      entity.language,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  static toPersistence(domain: UserProfileAggregate): UserProfile {
    const entity = new UserProfile();

    entity.id = domain.id;
    entity.userId = domain.userId;
    entity.lastActiveWorkspaceId = domain.lastActiveWorkspaceId;

    entity.displayName = domain.displayName;
    entity.fullName = domain.fullName;
    entity.bio = domain.bio;
    entity.phoneNumber = domain.phoneNumber;
    entity.location = domain.location;
    entity.jobTitle = domain.jobTitle;
    entity.website = domain.website;
    entity.coverUrl = domain.coverUrl;
    entity.timezone = domain.timezone;
    entity.language = domain.language;

    entity.createdAt = domain.createdAt;
    entity.updatedAt = domain.updatedAt;

    return entity;
  }
}
