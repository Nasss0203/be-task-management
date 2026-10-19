import { randomUUID } from 'node:crypto';

import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { MARKETPLACE_TYPES } from 'src/modules/marketplace/marketplace.types';
import type { ObjectStoragePort } from 'src/shared/application/ports/object-storage.port';
import { STORAGE_TYPES } from 'src/shared/infrastructure/storage/storage.types';

import type { CreatorImageKind } from '../../../../domain/entities/creator-profile.entity';
import type { CreatorProfileRepository } from '../../../../domain/repositories/creator-profile.repository';
import type { MyCreatorProfileDto } from '../../../dto/creator-profile/creator-profile.response.dto';
import type { CreatorProfileReader } from '../../../ports/creator-profile-reader.port';
import { presentMyCreatorProfile } from '../../../services/creator-profile-presenter';
import { SetCreatorImageCommand } from './set-creator-image.command';

export const CREATOR_IMAGE_MAX_BYTES: Record<CreatorImageKind, number> = {
  avatar: 2 * 1024 * 1024,
  cover: 5 * 1024 * 1024,
};

export function detectCreatorImageType(
  buffer: Buffer,
): { contentType: string; extension: string } | null {
  if (
    buffer.length >= 8 &&
    buffer
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return { contentType: 'image/png', extension: 'png' };
  }

  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return { contentType: 'image/jpeg', extension: 'jpg' };
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return { contentType: 'image/webp', extension: 'webp' };
  }

  return null;
}

@Injectable()
export class SetCreatorImageHandler {
  private readonly logger = new Logger(SetCreatorImageHandler.name);

  constructor(
    @Inject(MARKETPLACE_TYPES.repositories.CreatorProfileRepository)
    private readonly repository: CreatorProfileRepository,

    @Inject(MARKETPLACE_TYPES.ports.CreatorProfileReader)
    private readonly reader: CreatorProfileReader,

    @Inject(STORAGE_TYPES.ObjectStorage)
    private readonly storage: ObjectStoragePort,
  ) {}

  async execute(command: SetCreatorImageCommand): Promise<MyCreatorProfileDto> {
    if (command.kind !== 'avatar' && command.kind !== 'cover') {
      throw new BadRequestException('Image kind must be avatar or cover');
    }

    const kind: CreatorImageKind = command.kind;
    const [profile, account] = await Promise.all([
      this.repository.findByUserId(command.userId),
      this.reader.findAccount(command.userId),
    ]);

    if (!account) {
      throw new NotFoundException('User not found');
    }

    if (!profile) {
      throw new BadRequestException('Save your creator profile first');
    }

    const previousKey = profile.getImageKey(kind);
    let nextKey: string | null = null;

    if (command.file) {
      if (command.file.size > CREATOR_IMAGE_MAX_BYTES[kind]) {
        throw new BadRequestException(
          `Image must be at most ${CREATOR_IMAGE_MAX_BYTES[kind] / 1024 / 1024} MB`,
        );
      }

      const type = detectCreatorImageType(command.file.buffer);

      if (!type) {
        throw new BadRequestException('Image must be PNG, JPEG or WebP');
      }

      nextKey = `creators/${command.userId}/${kind}-${randomUUID()}.${type.extension}`;
      await this.storage.upload({
        key: nextKey,
        body: command.file.buffer,
        contentType: type.contentType,
      });
    }

    profile.setImageKey(kind, nextKey);
    const saved = await this.repository.save(profile);

    if (previousKey && previousKey !== nextKey) {
      await this.storage.delete(previousKey).catch((error: unknown) => {
        this.logger.warn(
          `Failed to delete old creator ${kind} ${previousKey}: ${String(error)}`,
        );
      });
    }

    return presentMyCreatorProfile(this.storage, saved, account);
  }
}
