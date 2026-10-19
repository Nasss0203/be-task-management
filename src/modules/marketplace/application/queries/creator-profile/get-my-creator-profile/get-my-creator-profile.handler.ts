import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { MARKETPLACE_TYPES } from 'src/modules/marketplace/marketplace.types';
import type { ObjectStoragePort } from 'src/shared/application/ports/object-storage.port';
import { STORAGE_TYPES } from 'src/shared/infrastructure/storage/storage.types';

import type { CreatorProfileRepository } from '../../../../domain/repositories/creator-profile.repository';
import type { MyCreatorProfileDto } from '../../../dto/creator-profile/creator-profile.response.dto';
import type { CreatorProfileReader } from '../../../ports/creator-profile-reader.port';
import { presentMyCreatorProfile } from '../../../services/creator-profile-presenter';
import { GetMyCreatorProfileQuery } from './get-my-creator-profile.query';

@Injectable()
export class GetMyCreatorProfileHandler {
  constructor(
    @Inject(MARKETPLACE_TYPES.repositories.CreatorProfileRepository)
    private readonly repository: CreatorProfileRepository,

    @Inject(MARKETPLACE_TYPES.ports.CreatorProfileReader)
    private readonly reader: CreatorProfileReader,

    @Inject(STORAGE_TYPES.ObjectStorage)
    private readonly storage: ObjectStoragePort,
  ) {}

  async execute(query: GetMyCreatorProfileQuery): Promise<MyCreatorProfileDto> {
    const [profile, account] = await Promise.all([
      this.repository.findByUserId(query.userId),
      this.reader.findAccount(query.userId),
    ]);

    if (!account) {
      throw new NotFoundException('User not found');
    }

    return presentMyCreatorProfile(this.storage, profile, account);
  }
}
