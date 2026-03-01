import { Module } from '@nestjs/common';
import { UserProfilesService } from './user_profiles.service';
import { UserProfilesController } from './user_profiles.controller';

@Module({
  controllers: [UserProfilesController],
  providers: [UserProfilesService],
})
export class UserProfilesModule {}
