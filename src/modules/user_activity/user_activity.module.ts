import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserActivityController } from './controller/user_activity.controller';
import { UserActivity } from './domain/entities/user_activity.entity';
import { UserActivityService } from './user_activity.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserActivity])],
  controllers: [UserActivityController],
  providers: [UserActivityService],
  exports: [UserActivityService],
})
export class UserActivityModule {}
