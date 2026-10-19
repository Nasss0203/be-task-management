import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { MARKETPLACE_TYPES } from 'src/modules/marketplace/marketplace.types';
import type { ObjectStoragePort } from 'src/shared/application/ports/object-storage.port';
import { STORAGE_TYPES } from 'src/shared/infrastructure/storage/storage.types';

import { CreatorProfile } from '../../../../domain/entities/creator-profile.entity';
import type { CreatorProfileRepository } from '../../../../domain/repositories/creator-profile.repository';
import type { MyCreatorProfileDto } from '../../../dto/creator-profile/creator-profile.response.dto';
import type { CreatorProfileReader } from '../../../ports/creator-profile-reader.port';
import { presentMyCreatorProfile } from '../../../services/creator-profile-presenter';
import { UpsertMyCreatorProfileCommand } from './upsert-my-creator-profile.command';

@Injectable()
export class UpsertMyCreatorProfileHandler {
  constructor(
    @Inject(MARKETPLACE_TYPES.repositories.CreatorProfileRepository)
    private readonly repository: CreatorProfileRepository,

    @Inject(MARKETPLACE_TYPES.ports.CreatorProfileReader)
    private readonly reader: CreatorProfileReader,

    @Inject(STORAGE_TYPES.ObjectStorage)
    private readonly storage: ObjectStoragePort,
  ) {}

  async execute(
    command: UpsertMyCreatorProfileCommand,
  ): Promise<MyCreatorProfileDto> {
    const account = await this.reader.findAccount(command.userId);

    if (!account) {
      throw new NotFoundException('User not found');
    }

    const existing = await this.repository.findByUserId(command.userId);
    let profile: CreatorProfile;

    try {
      if (existing) {
        existing.update(command.details);
        profile = existing;
      } else {
        profile = CreatorProfile.create(command.userId, command.details);
      }
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }

    if (await this.reader.isHandleTaken(profile.getHandle(), command.userId)) {
      throw new ConflictException('This handle is already taken');
    }

    let saved: CreatorProfile;

    try {
      saved = await this.repository.save(profile);
    } catch (error) {
      const constraint = (
        error as { driverError?: { constraint?: string }; constraint?: string }
      )?.driverError?.constraint;

      if (constraint === 'UQ_creator_profiles_handle') {
        throw new ConflictException('This handle is already taken');
      }

      throw error;
    }

    return presentMyCreatorProfile(this.storage, saved, account);
  }
}
