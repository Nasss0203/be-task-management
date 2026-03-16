import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateUserWorkspaceApplicationImpl } from './applications/create.user_workspace.application';
import { UserWorkspacesController } from './controller/user_workspace.controller';
import { UserWorkspace } from './domain/entities/user_workspace.entity';
import { USER_WORKSPACE_TYPES } from './interfaces/types';
import { UserWorkspaceRepositoryImpl } from './repositories/user_workspace.repository';
import { CreateUserWorkspaceServiceImpl } from './services/create.user_workspace.service';
import { UserWorkspacesService } from './user_workspace.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserWorkspace])],
  controllers: [UserWorkspacesController],
  providers: [
    UserWorkspacesService,
    {
      provide: USER_WORKSPACE_TYPES.applications.CreateUserWorkspaceApplication,
      useClass: CreateUserWorkspaceApplicationImpl,
    },
    {
      provide: USER_WORKSPACE_TYPES.repositories.UserWorkspaceRepository,
      useClass: UserWorkspaceRepositoryImpl,
    },
    {
      provide: USER_WORKSPACE_TYPES.services.CreateUserWorkspaceService,
      useClass: CreateUserWorkspaceServiceImpl,
    },
  ],
  exports: [USER_WORKSPACE_TYPES.services.CreateUserWorkspaceService],
})
export class UserWorkspacesModule {}
