import { Controller, Get } from '@nestjs/common';

import { Auth } from 'src/common/decorator/auth.decorator';
import { ReadRateLimit } from 'src/common/decorator/rate-limit.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { type IAuth } from 'src/types/auth';

import { GetUserProfileHandler } from '../../../application/queries/get-user-profile/get-user-profile.handler';
import { GetUserProfileQuery } from '../../../application/queries/get-user-profile/get-user-profile.query';

@Controller('user-profiles')
@ReadRateLimit()
export class UserProfilesController {
  constructor(private readonly getUserProfileHandler: GetUserProfileHandler) {}

  @Get('me')
  @ResponseMessage('Get current user profile')
  getCurrentProfile(@Auth() auth: IAuth) {
    return this.getUserProfileHandler.execute(new GetUserProfileQuery(auth.id));
  }
}
