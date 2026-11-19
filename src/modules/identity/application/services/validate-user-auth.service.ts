import { Inject, Injectable } from '@nestjs/common';
import { verifyIdentityPassword } from 'src/modules/identity/infrastructure/security/password/password-hasher';
import {
  type UserRecord,
  type UserRepository,
} from 'src/modules/identity/domain/repositories/user.repository';
import { IDENTITY_TYPES } from 'src/modules/identity/identity.types';
import type { LoginFailureReason } from '../ports/login-attempt-recorder.port';

export type CredentialCheckResult =
  | { user: UserRecord; reason: null }
  | { user: UserRecord | null; reason: LoginFailureReason };

@Injectable()
export class ValidateUserAuthServiceImpl {
  constructor(
    @Inject(IDENTITY_TYPES.repositories.UserRepository)
    private readonly userRepository: UserRepository,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<UserRecord | null> {
    const { user, reason } = await this.checkCredentials(email, password);

    return reason ? null : user;
  }

  async checkCredentials(
    email: string,
    password: string,
  ): Promise<CredentialCheckResult> {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      return { user: null, reason: 'USER_NOT_FOUND' };
    }

    if (!user.isActive) {
      return { user, reason: 'ACCOUNT_LOCKED' };
    }

    if (!user.passwordHash) {
      return { user, reason: 'PASSWORD_NOT_SET' };
    }

    return this.comparePassword(password, user.passwordHash)
      ? { user, reason: null }
      : { user, reason: 'WRONG_PASSWORD' };
  }

  comparePassword(password: string, hash: string): boolean {
    return verifyIdentityPassword(password, hash);
  }
}
