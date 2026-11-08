import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import type { ObjectStoragePort } from 'src/shared/application/ports/object-storage.port';
import { STORAGE_TYPES } from 'src/shared/infrastructure/storage/storage.types';

import type { AvatarStoragePort } from '../../application/ports/avatar-storage.port';

@Injectable()
export class S3AvatarStorageAdapter implements AvatarStoragePort {
  private readonly publicBaseUrl: string;

  constructor(
    @Inject(STORAGE_TYPES.ObjectStorage)
    private readonly objectStorage: ObjectStoragePort,
    configService: ConfigService,
  ) {
    this.publicBaseUrl = configService
      .getOrThrow<string>('AWS_S3_PUBLIC_BASE_URL')
      .replace(/\/+$/, '');
  }

  async upload(
    userId: string,
    image: Buffer,
    contentType: string,
  ): Promise<string> {
    const key = `${this.keyPrefix(userId)}avatar-${randomUUID()}`;

    await this.objectStorage.upload({ key, body: image, contentType });

    return `${this.publicBaseUrl}/${key}`;
  }

  async remove(userId: string, avatarUrl: string): Promise<void> {
    const ownPrefix = `${this.publicBaseUrl}/${this.keyPrefix(userId)}`;

    if (!avatarUrl.startsWith(ownPrefix)) {
      return;
    }

    await this.objectStorage.delete(
      avatarUrl.slice(this.publicBaseUrl.length + 1),
    );
  }

  private keyPrefix(userId: string): string {
    return `public/users/${userId}/`;
  }
}
