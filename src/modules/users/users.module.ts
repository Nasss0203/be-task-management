import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './domain/entities/user.entity';
import { USER_TYPES } from './interfaces/types';
import { FindUserRepositoryImpl } from './repositories/find-user.repository';
import { FindUserServiceImpl } from './services/find-user.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [
    UsersService,
    {
      provide: USER_TYPES.repositories.FindUserRepository,
      useClass: FindUserRepositoryImpl,
    },

    {
      provide: USER_TYPES.services.FindUserService,
      useClass: FindUserServiceImpl,
    },
  ],
  exports: [USER_TYPES.services.FindUserService],
})
export class UsersModule {}
