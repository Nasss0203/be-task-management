import { Module } from '@nestjs/common';
import { UserProfilesController } from './user_profiles.controller';
import { UserProfilesService } from './user_profiles.service';

@Module({
  controllers: [UserProfilesController],
  providers: [UserProfilesService],
})
export class UserProfilesModule {}
