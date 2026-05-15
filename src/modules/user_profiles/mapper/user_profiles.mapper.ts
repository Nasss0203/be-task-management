import { UserProfile } from '../domain/entities/user_profile.entity';
import { UserProfileModel } from '../domain/models/user-profile.model';
import { UserProfileResponseDto } from '../dto/response/user_profile.response.dto';

export class UserProfileMapper {
  static toModel(entity: UserProfile): UserProfileModel {
    return new UserProfileModel(
      entity.id,
      entity.userId,

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

  static toEntity(model: Partial<UserProfileModel>): UserProfile {
    const entity = new UserProfile();

    if (model.id !== undefined) entity.id = model.id;
    if (model.userId !== undefined) entity.userId = model.userId;

    if (model.displayName !== undefined) entity.displayName = model.displayName;
    if (model.fullName !== undefined) entity.fullName = model.fullName;
    if (model.bio !== undefined) entity.bio = model.bio;
    if (model.phoneNumber !== undefined) entity.phoneNumber = model.phoneNumber;
    if (model.location !== undefined) entity.location = model.location;
    if (model.jobTitle !== undefined) entity.jobTitle = model.jobTitle;
    if (model.website !== undefined) entity.website = model.website;
    if (model.coverUrl !== undefined) entity.coverUrl = model.coverUrl;
    if (model.timezone !== undefined) entity.timezone = model.timezone;
    if (model.language !== undefined) entity.language = model.language;

    return entity;
  }

  static toResponse(model: UserProfileModel): UserProfileResponseDto {
    return {
      id: model.id,
      userId: model.userId,

      displayName: model.displayName,
      fullName: model.fullName,
      bio: model.bio,
      phoneNumber: model.phoneNumber,
      location: model.location,
      jobTitle: model.jobTitle,
      website: model.website,
      coverUrl: model.coverUrl,
      timezone: model.timezone,
      language: model.language,

      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }
}
