import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { UserProfileRepository } from '../../domain/repositories/user-profile.repository';
import { IDENTITY_TYPES } from '../../identity.types';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { UserProfilePreferenceService } from '../ports/user-profile-preference.service.interface';

@Injectable()
export class UserProfilePreferenceServiceImpl implements UserProfilePreferenceService {
  constructor(
    @Inject(IDENTITY_TYPES.repositories.UserProfileRepository)
    private readonly userProfileRepository: UserProfileRepository,
  ) {}

  async getLastActiveWorkspace(
    userId: string,
    context?: PersistenceContext,
  ): Promise<string | null> {
    const profile = await this.userProfileRepository.findByUserId(
      userId,
      context,
    );

    if (!profile) {
      throw new NotFoundException('User profile not found');
    }

    return profile.lastActiveWorkspaceId;
  }

  async updateLastActiveWorkspace(
    userId: string,
    workspaceId: string | null,
    context?: PersistenceContext,
  ): Promise<void> {
    const profile = await this.userProfileRepository.findByUserId(
      userId,
      context,
    );

    if (!profile) {
      throw new NotFoundException('User profile not found');
    }

    profile.changeLastActiveWorkspace(workspaceId);

    await this.userProfileRepository.save(profile, context);
  }
}
