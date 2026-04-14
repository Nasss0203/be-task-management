import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateRoleApplicationImpl } from './applications/create.role.application';
import { Role } from './domain/entities/role.entity';
import { ROLE_TYPES } from './interfaces/types';
import { FindRoleRepositoryImpl } from './repositories/find-role.repository';
import { RoleRepositoryImpl } from './repositories/role.repository';
import { CreateRoleServiceImpl } from './services/create.role.service';
import { FindRoleServiceImpl } from './services/find-role.service';

@Module({
  imports: [TypeOrmModule.forFeature([Role])],
  providers: [
    // Repository
    {
      provide: ROLE_TYPES.repositories.RoleRepository,
      useClass: RoleRepositoryImpl,
    },
    {
      provide: ROLE_TYPES.repositories.FindRoleRepository,
      useClass: FindRoleRepositoryImpl,
    },
    {
      provide: ROLE_TYPES.services.CreateRoleService,
      useClass: CreateRoleServiceImpl,
    },
    {
      provide: ROLE_TYPES.services.FindRoleService,
      useClass: FindRoleServiceImpl,
    },
    {
      provide: ROLE_TYPES.applications.CreateRoleApplication,
      useClass: CreateRoleApplicationImpl,
    },
  ],
  exports: [
    ROLE_TYPES.repositories.RoleRepository,
    ROLE_TYPES.services.CreateRoleService,
    ROLE_TYPES.applications.CreateRoleApplication,
    ROLE_TYPES.repositories.FindRoleRepository,
    ROLE_TYPES.services.FindRoleService,
  ],
})
export class RoleModule {}
