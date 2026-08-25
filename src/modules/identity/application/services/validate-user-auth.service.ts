import { Inject, Injectable } from '@nestjs/common';
import { verifyIdentityPassword } from 'src/modules/identity/infrastructure/security/password/password-hasher';
import {
  type UserRecord,
  type UserRepository,
} from 'src/modules/identity/domain/repositories/user.repository';
import { IDENTITY_TYPES } from 'src/modules/identity/identity.types';

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
    const user = await this.userRepository.findByEmail(email);

    if (!user || !user.isActive || !user.passwordHash) {
      return null;
    }

    return this.comparePassword(password, user.passwordHash) ? user : null;
  }

  comparePassword(password: string, hash: string): boolean {
    return verifyIdentityPassword(password, hash);
  }
}
