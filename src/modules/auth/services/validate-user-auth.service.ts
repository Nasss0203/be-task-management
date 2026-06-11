import { Inject, Injectable } from '@nestjs/common';
import { compareSync } from 'bcrypt';
import { User } from 'src/modules/users/domain/entities/user.entity';
import { type AuthUserRepository } from '../interfaces/repositories/auth-user.repository.interface';
import { ValidateUserAuthService } from '../interfaces/services/validate-user-auth.service.interface';
import { AUTH_TYPES } from '../interfaces/types';

@Injectable()
export class ValidateUserAuthServiceImpl implements ValidateUserAuthService {
  constructor(
    @Inject(AUTH_TYPES.repositories.AuthUserRepository)
    private readonly userRepository: AuthUserRepository,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findByEmail(email);

    if (!user || !user.isActive || !user.passwordHash) {
      return null;
    }

    return this.comparePassword(password, user.passwordHash) ? user : null;
  }

  comparePassword(password: string, hash: string): boolean {
    return compareSync(password, hash);
  }
}
