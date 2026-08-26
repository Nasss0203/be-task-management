import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { UserProfileRepository } from '../../domain/repositories/user-profile.repository';
import { IDENTITY_TYPES } from '../../identity.types';
import { UserProfilePreferenceService } from '../ports/user-profile-preference.service.interface';

@Injectable()
export class UserProfilePreferenceServiceImpl implements UserProfilePreferenceService {
  constructor(
    @Inject(IDENTITY_TYPES.repositories.UserProfileRepository)
    private readonly userProfileRepository: UserProfileRepository,
  ) {}

  async updateLastActiveWorkspace(
    userId: string,
    workspaceId: string | null,
  ): Promise<void> {
    const profile = await this.userProfileRepository.findByUserId(userId);

    if (!profile) {
      throw new NotFoundException('User profile not found');
    }

    profile.changeLastActiveWorkspace(workspaceId);

    await this.userProfileRepository.save(profile);
  }
}
