import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserProfilesController } from './controller/user_profiles.controller';
import { UserProfile } from './domain/entities/user_profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserProfile])],
  controllers: [UserProfilesController],
  providers: [],
  exports: [],
})
export class UserProfilesModule {}
