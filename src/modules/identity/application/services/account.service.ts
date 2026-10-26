import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

import {
  hashIdentityPassword,
  verifyIdentityPassword,
} from 'src/modules/identity/infrastructure/security/password/password-hasher';
import type {
  UserRecord,
  UserRepository,
} from 'src/modules/identity/domain/repositories/user.repository';
import { IDENTITY_TYPES } from 'src/modules/identity/identity.types';

import type { AvatarStoragePort } from '../ports/avatar-storage.port';

export interface AccountResponse {
  id: string;
  email: string;
  username: string;
  avatarUrl: string | null;
  hasPassword: boolean;
}

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);

  constructor(
    @Inject(IDENTITY_TYPES.repositories.UserRepository)
    private readonly userRepository: UserRepository,

    @Inject(IDENTITY_TYPES.ports.AvatarStorage)
    private readonly avatarStorage: AvatarStoragePort,
  ) {}

  async getAccount(userId: string): Promise<AccountResponse> {
    return this.toResponse(await this.findUser(userId));
  }

  async updateUsername(
    userId: string,
    username: string,
  ): Promise<AccountResponse> {
    const user = await this.findUser(userId);
    const nextUsername = username.trim();

    if (nextUsername === user.username) {
      return this.toResponse(user);
    }

    const taken = await this.userRepository.findUserByUsername(nextUsername);
    if (taken && taken.id !== userId) {
      throw new ConflictException('This username is already taken');
    }

    user.username = nextUsername;

    try {
      return this.toResponse(await this.userRepository.save(user));
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string })?.code === '23505'
      ) {
        throw new ConflictException('This username is already taken');
      }
      throw error;
    }
  }

  async changePassword(
    userId: string,
    currentPassword: string | undefined,
    newPassword: string,
  ): Promise<void> {
    const user = await this.findUser(userId);

    if (user.passwordHash) {
      if (
        !currentPassword ||
        !verifyIdentityPassword(currentPassword, user.passwordHash)
      ) {
        throw new BadRequestException('Current password is incorrect');
      }

      if (verifyIdentityPassword(newPassword, user.passwordHash)) {
        throw new BadRequestException(
          'New password must be different from the current one',
        );
      }
    }

    user.passwordHash = hashIdentityPassword(newPassword);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await this.userRepository.save(user);
  }

  async setAvatar(userId: string, image: Buffer): Promise<AccountResponse> {
    const user = await this.findUser(userId);

    user.avatarUrl = await this.avatarStorage.upload(userId, image);

    return this.toResponse(await this.userRepository.save(user));
  }

  async removeAvatar(userId: string): Promise<AccountResponse> {
    const user = await this.findUser(userId);

    user.avatarUrl = null;
    const saved = await this.userRepository.save(user);

    await this.avatarStorage.remove(userId).catch((error: unknown) => {
      this.logger.warn(
        `Failed to delete avatar for user ${userId}: ${String(error)}`,
      );
    });

    return this.toResponse(saved);
  }

  private async findUser(userId: string): Promise<UserRecord> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private toResponse(user: UserRecord): AccountResponse {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      avatarUrl: user.avatarUrl,
      hasPassword: Boolean(user.passwordHash),
    };
  }
}
