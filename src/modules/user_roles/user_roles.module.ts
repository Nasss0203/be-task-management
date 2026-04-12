import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRolesController } from './controller/user_roles.controller';
import { UserRole } from './domain/entities/user_role.entity';
import { USER_ROLE_TYPES } from './interfaces/types';
import { UserRoleRepositoryImpl } from './repositories/user_role.repository';
import { CreateUserRoleServiceImpl } from './services/create.user_role.service';
import { UserRolesService } from './user_roles.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserRole])],
  controllers: [UserRolesController],
  providers: [
    UserRolesService, // {
    //   provide: USER_ROLE_TYPES.applications.CreateUserRoleApplication,
    //   useClass: Crea,
    // },
    {
      provide: USER_ROLE_TYPES.services.CreateUserRoleService,
      useClass: CreateUserRoleServiceImpl,
    },
    {
      provide: USER_ROLE_TYPES.repositories.UserRoleRepository,
      useClass: UserRoleRepositoryImpl,
    },
  ],
  exports: [
    USER_ROLE_TYPES.services.CreateUserRoleService,
    USER_ROLE_TYPES.repositories.UserRoleRepository,
  ],
})
export class UserRolesModule {}
