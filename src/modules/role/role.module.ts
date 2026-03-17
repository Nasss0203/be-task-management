import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateRoleApplicationImpl } from './applications/create.role.application';
import { Role } from './domain/entities/role.entity';
import { ROLE_TYPES } from './interfaces/types';
import { RoleRepositoryImpl } from './repositories/role.repository';
import { CreateRoleServiceImpl } from './services/create.role.service';

@Module({
  imports: [TypeOrmModule.forFeature([Role])],
  providers: [
    {
      provide: ROLE_TYPES.repositories.RoleRepository,
      useClass: RoleRepositoryImpl,
    },
    {
      provide: ROLE_TYPES.services.CreateRoleService,
      useClass: CreateRoleServiceImpl,
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
  ],
})
export class RoleModule {}
