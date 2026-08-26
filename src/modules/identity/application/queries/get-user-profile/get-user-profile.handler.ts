import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { UserProfileRepository } from '../../../domain/repositories/user-profile.repository';
import { IDENTITY_TYPES } from '../../../identity.types';
import { UserProfileResponseDto } from '../../dto/profile/user-profile.response.dto';
import { GetUserProfileQuery } from './get-user-profile.query';

@Injectable()
export class GetUserProfileHandler {
  constructor(
    @Inject(IDENTITY_TYPES.repositories.UserProfileRepository)
    private readonly userProfileRepository: UserProfileRepository,
  ) {}

  async execute(query: GetUserProfileQuery): Promise<UserProfileResponseDto> {
    const profile = await this.userProfileRepository.findByUserId(query.userId);

    if (!profile) {
      throw new NotFoundException('User profile not found');
    }

    return UserProfileResponseDto.fromDomain(profile);
  }
}
