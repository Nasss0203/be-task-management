import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ErrorCode } from 'src/common/constants/error-code.constant';
import { User } from 'src/modules/users/domain/entities/user.entity';
import { type AuthUserRepository } from '../interfaces/repositories/auth-user.repository.interface';
import { IUserJwtPayload } from '../interfaces/type';
import { GetProfileAuthService } from '../interfaces/services/get-profile-auth.service.interface';
import { AUTH_TYPES } from '../interfaces/types';

@Injectable()
export class GetProfileAuthServiceImpl implements GetProfileAuthService {
  constructor(
    @Inject(AUTH_TYPES.repositories.AuthUserRepository)
    private readonly userRepository: AuthUserRepository,
  ) {}

  async getProfile(payload: IUserJwtPayload): Promise<User> {
    const user = await this.userRepository.findProfileById(payload.id);

    if (!user) {
      throw new HttpException(
        {
          code: ErrorCode.USER_NOT_FOUND,
          message: 'User not found',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    if (!user.isActive) {
      throw new HttpException(
        {
          code: ErrorCode.USER_INACTIVE,
          message: 'User is inactive',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    return user;
  }
}
