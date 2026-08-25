import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ErrorCode } from 'src/common/constants/error-code.constant';
import {
  type UserRecord,
  type UserRepository,
} from 'src/modules/identity/domain/repositories/user.repository';
import { IDENTITY_TYPES } from 'src/modules/identity/identity.types';
import { GetProfileAuthQuery } from './get-profile-auth.query';

@Injectable()
export class GetProfileAuthHandler {
  constructor(
    @Inject(IDENTITY_TYPES.repositories.UserRepository)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(query: GetProfileAuthQuery): Promise<UserRecord> {
    const { payload } = query;
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
