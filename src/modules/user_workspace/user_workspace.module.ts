import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmUnitOfWork } from 'src/common/helper/unit-work.typeorm';
import { RoleModule } from '../role/role.module';
import { UserRolesModule } from '../user_roles/user_roles.module';
import { AddWorkspaceMemberApplicationImpl } from './applications/add-member-worlspace.application';
import { CreateUserWorkspaceApplicationImpl } from './applications/create.user_workspace.application';
import { FindAllMemberApplicationImpl } from './applications/find-user-workspace.application';
import { UserWorkspacesController } from './controller/user_workspace.controller';
import { UserWorkspace } from './domain/entities/user_workspace.entity';
import { USER_WORKSPACE_TYPES } from './interfaces/types';
import { FindUserWorkspaceRepositoryImpl } from './repositories/find-user-workspace.repository';
import { UserWorkspaceRepositoryImpl } from './repositories/user_workspace.repository';
import { AddMemberWorkspaceServiceImpl } from './services/add-member-workspace.service';
import { CreateUserWorkspaceServiceImpl } from './services/create.user_workspace.service';
import { FindAllMemberServiceImpl } from './services/find-user-workspace.service';
import { UserWorkspacesService } from './user_workspace.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserWorkspace]),
    RoleModule,
    UserRolesModule,
  ],
  controllers: [UserWorkspacesController],
  providers: [
    UserWorkspacesService,
    // Application
    {
      provide: USER_WORKSPACE_TYPES.applications.CreateUserWorkspaceApplication,
      useClass: CreateUserWorkspaceApplicationImpl,
    },
    {
      provide: USER_WORKSPACE_TYPES.applications.AddWorkspaceMemberApplication,
      useClass: AddWorkspaceMemberApplicationImpl,
    },
    {
      provide: USER_WORKSPACE_TYPES.applications.FindAllMemberApplication,
      useClass: FindAllMemberApplicationImpl,
    },
    //Repository
    {
      provide: USER_WORKSPACE_TYPES.repositories.UserWorkspaceRepository,
      useClass: UserWorkspaceRepositoryImpl,
    },
    {
      provide: USER_WORKSPACE_TYPES.repositories.FindUserWorkspaceRepository,
      useClass: FindUserWorkspaceRepositoryImpl,
    },
    //Service
    {
      provide: USER_WORKSPACE_TYPES.services.CreateUserWorkspaceService,
      useClass: CreateUserWorkspaceServiceImpl,
    },
    {
      provide: USER_WORKSPACE_TYPES.services.AddMemberWorkspaceService,
      useClass: AddMemberWorkspaceServiceImpl,
    },
    {
      provide: USER_WORKSPACE_TYPES.services.FindAllMemberService,
      useClass: FindAllMemberServiceImpl,
    },
    {
      provide: USER_WORKSPACE_TYPES.uow.UnitOfWork,
      useClass: TypeOrmUnitOfWork,
    },
  ],
  exports: [
    USER_WORKSPACE_TYPES.services.CreateUserWorkspaceService,
    USER_WORKSPACE_TYPES.services.FindAllMemberService,
  ],
})
export class UserWorkspacesModule {}
