import { UserProfileAggregate } from '../../../domain/aggregates/user-profile/user-profile.aggregate';

export class UserProfileResponseDto {
  id: string;
  userId: string;
  lastActiveWorkspaceId: string | null;

  displayName: string | null;
  fullName: string | null;
  bio: string | null;
  phoneNumber: string | null;
  location: string | null;
  jobTitle: string | null;
  website: string | null;
  coverUrl: string | null;
  timezone: string | null;
  language: string | null;

  createdAt: Date;
  updatedAt: Date;

  static fromDomain(profile: UserProfileAggregate): UserProfileResponseDto {
    const dto = new UserProfileResponseDto();

    dto.id = profile.id;
    dto.userId = profile.userId;
    dto.lastActiveWorkspaceId = profile.lastActiveWorkspaceId;

    dto.displayName = profile.displayName;
    dto.fullName = profile.fullName;
    dto.bio = profile.bio;
    dto.phoneNumber = profile.phoneNumber;
    dto.location = profile.location;
    dto.jobTitle = profile.jobTitle;
    dto.website = profile.website;
    dto.coverUrl = profile.coverUrl;
    dto.timezone = profile.timezone;
    dto.language = profile.language;

    dto.createdAt = profile.createdAt;
    dto.updatedAt = profile.updatedAt;

    return dto;
  }
}
