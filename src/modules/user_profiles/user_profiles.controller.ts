import { Controller } from '@nestjs/common';
import { UserProfilesService } from './user_profiles.service';

@Controller('user-profiles')
export class UserProfilesController {
  constructor(private readonly userProfilesService: UserProfilesService) {}
}
