import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmUnitOfWork } from 'src/common/helper/unit-work.typeorm';
import { PageModule } from '../page/page.module';
import { Role } from '../role/domain/entities/role.entity';
import { RoleModule } from '../role/role.module';
import { UserRolesModule } from '../user_roles/user_roles.module';
import { UserWorkspace } from '../user_workspace/domain/entities/user_workspace.entity';
import { UserWorkspacesModule } from '../user_workspace/user_workspace.module';
import { CreateWorkspaceApplicationImpl } from './applications/create.workspace.application';
import { WorkspacesController } from './controller/workspaces.controller';
import { Workspace } from './domain/entities/workspace.entity';
import { WORKSPACE_TYPES } from './interfaces/types';
import { WorkspaceRepositoryImpl } from './repositories/workspace.repository';
import { CreateWorkSpaceServiceImpl } from './services/create.workspace.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Workspace, Role, UserWorkspace]),
    UserWorkspacesModule,
    RoleModule,
    UserRolesModule,
    PageModule,
  ],
  controllers: [WorkspacesController],
  providers: [
    {
      provide: WORKSPACE_TYPES.applications.CreateWorkspaceApplication,
      useClass: CreateWorkspaceApplicationImpl,
    },
    {
      provide: WORKSPACE_TYPES.services.CreateWorkspaceService,
      useClass: CreateWorkSpaceServiceImpl,
    },
    {
      provide: WORKSPACE_TYPES.repositories.WorkspaceRepository,
      useClass: WorkspaceRepositoryImpl,
    },

    {
      provide: WORKSPACE_TYPES.uow.UnitOfWork,
      useClass: TypeOrmUnitOfWork,
    },
  ],
  exports: [WORKSPACE_TYPES.repositories.WorkspaceRepository],
})
export class WorkspacesModule {}
