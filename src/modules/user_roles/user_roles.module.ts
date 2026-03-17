import { Module } from '@nestjs/common';
import { UserRolesService } from './user_roles.service';
import { UserRolesController } from './user_roles.controller';

@Module({
  controllers: [UserRolesController],
  providers: [UserRolesService],
})
export class UserRolesModule {}
