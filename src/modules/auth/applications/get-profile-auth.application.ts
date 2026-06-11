import { Inject, Injectable } from '@nestjs/common';
import { User } from 'src/modules/users/domain/entities/user.entity';
import { GetProfileAuthApplication } from '../interfaces/applications/get-profile-auth.application.interface';
import { IUserJwtPayload } from '../interfaces/type';
import { type GetProfileAuthService } from '../interfaces/services/get-profile-auth.service.interface';
import { AUTH_TYPES } from '../interfaces/types';

@Injectable()
export class GetProfileAuthApplicationImpl implements GetProfileAuthApplication {
  constructor(
    @Inject(AUTH_TYPES.services.GetProfileAuthService)
    private readonly service: GetProfileAuthService,
  ) {}

  getProfile(payload: IUserJwtPayload): Promise<User> {
    return this.service.getProfile(payload);
  }
}
