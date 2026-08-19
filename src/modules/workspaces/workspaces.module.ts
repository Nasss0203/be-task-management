import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmUnitOfWork } from 'src/common/helper/unit-work.typeorm';
import { PageModule } from '../page/page.module';
import { PageBlockModule } from '../page_block/page_block.module';
import { PermissionModule } from '../permission/permission.module';
import { WorkspaceMember } from '../workspace_member/domain/entities/workspace-member.entity';
import { WorkspaceMemberModule } from '../workspace_member/workspace_member.module';
import { User } from '../users/domain/entities/user.entity';
import { WorkspaceInvite } from '../workspace_invites/domain/entities/workspace_invite.entity';
import { AccessWorkspaceApplicationImpl } from './applications/access-workspace.application';
import { CreateWorkspaceApplicationImpl } from './applications/create-workspace.application';
import { FindWorkspaceOverviewApplicationImpl } from './applications/find-workspace-overview.application';
import { FindWorkspaceApplicationImpl } from './applications/find.workspace.application';
import { UpdateWorkspaceApplicationImpl } from './applications/update-workspace.application';
import { UpdateWorkspaceLayoutModeApplicationImpl } from './applications/update-workspace-layout-mode.application';
import { WorkspaceTrashApplicationImpl } from './applications/workspace-trash.application';
import { WorkspacesController } from './controller/workspaces.controller';
import { Workspace } from './domain/entities/workspace.entity';
import { WORKSPACE_TYPES } from './interfaces/types';
import { AccessWorkspaceRepositoryImpl } from './repositories/access-workspace.repository';
import { WorkspaceRepositoryImpl } from './repositories/create-workspace.repository';
import { FindWorkspaceOverviewRepositoryImpl } from './repositories/find-workspace-overview.repository';
import { FindWorkspaceRepositoryImpl } from './repositories/find.workspace.repository';
import { WorkspaceTrashRepositoryImpl } from './repositories/workspace-trash.repository';
import { AccessWorkspaceServiceImpl } from './services/access-workspace.service';
import { CreateWorkspaceServiceImpl } from './services/create-workspace.service';
import { FindWorkspaceOverviewServiceImpl } from './services/find-workspace-overview.service';
import { FindWorkspaceServiceImpl } from './services/find.workspace.service';
import { UpdateWorkspaceServiceImpl } from './services/update-workspace.service';
import { WorkspaceTrashServiceImpl } from './services/workspace-trash.service';
import { UpdateWorkspaceLayoutModeServiceImpl } from './services/update-workspace-layout-mode.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Workspace,
      WorkspaceMember,
      WorkspaceInvite,
      User,
    ]),
    WorkspaceMemberModule,
    PageModule,
    PageBlockModule,
    PermissionModule,
  ],
  controllers: [WorkspacesController],
  providers: [
    //Application
    {
      provide: WORKSPACE_TYPES.applications.CreateWorkspaceApplication,
      useClass: CreateWorkspaceApplicationImpl,
    },
    {
      provide: WORKSPACE_TYPES.applications.FindWorkspaceApplication,
      useClass: FindWorkspaceApplicationImpl,
    },
    {
      provide: WORKSPACE_TYPES.applications.AccessWorkspaceApplication,
      useClass: AccessWorkspaceApplicationImpl,
    },
    {
      provide: WORKSPACE_TYPES.applications.WorkspaceTrashApplication,
      useClass: WorkspaceTrashApplicationImpl,
    },
    {
      provide: WORKSPACE_TYPES.applications.FindWorkspaceOverviewApplication,
      useClass: FindWorkspaceOverviewApplicationImpl,
    },
    {
      provide: WORKSPACE_TYPES.applications.UpdateWorkspaceApplication,
      useClass: UpdateWorkspaceApplicationImpl,
    },
    {
      provide:
        WORKSPACE_TYPES.applications.UpdateWorkspaceLayoutModeApplication,
      useClass: UpdateWorkspaceLayoutModeApplicationImpl,
    },
    //Service
    {
      provide: WORKSPACE_TYPES.services.CreateWorkspaceService,
      useClass: CreateWorkspaceServiceImpl,
    },
    {
      provide: WORKSPACE_TYPES.services.FindWorkspaceService,
      useClass: FindWorkspaceServiceImpl,
    },
    {
      provide: WORKSPACE_TYPES.services.AccessWorkspaceService,
      useClass: AccessWorkspaceServiceImpl,
    },
    {
      provide: WORKSPACE_TYPES.services.WorkspaceTrashService,
      useClass: WorkspaceTrashServiceImpl,
    },
    {
      provide: WORKSPACE_TYPES.services.FindWorkspaceOverviewService,
      useClass: FindWorkspaceOverviewServiceImpl,
    },
    {
      provide: WORKSPACE_TYPES.services.UpdateWorkspaceService,
      useClass: UpdateWorkspaceServiceImpl,
    },
    {
      provide: WORKSPACE_TYPES.services.UpdateWorkspaceLayoutModeService,
      useClass: UpdateWorkspaceLayoutModeServiceImpl,
    },
    //Repository
    {
      provide: WORKSPACE_TYPES.repositories.WorkspaceRepository,
      useClass: WorkspaceRepositoryImpl,
    },
    {
      provide: WORKSPACE_TYPES.repositories.FindWorkspaceRepository,
      useClass: FindWorkspaceRepositoryImpl,
    },
    {
      provide: WORKSPACE_TYPES.repositories.AccessWorkspaceRepository,
      useClass: AccessWorkspaceRepositoryImpl,
    },
    {
      provide: WORKSPACE_TYPES.repositories.WorkspaceTrashRepository,
      useClass: WorkspaceTrashRepositoryImpl,
    },
    {
      provide: WORKSPACE_TYPES.repositories.FindWorkspaceOverviewRepository,
      useClass: FindWorkspaceOverviewRepositoryImpl,
    },
    // Manager
    {
      provide: WORKSPACE_TYPES.uow.UnitOfWork,
      useClass: TypeOrmUnitOfWork,
    },
  ],
  exports: [
    WORKSPACE_TYPES.repositories.WorkspaceRepository,
    WORKSPACE_TYPES.services.CreateWorkspaceService,
    WORKSPACE_TYPES.services.FindWorkspaceService,
    WORKSPACE_TYPES.uow.UnitOfWork,
  ],
})
export class WorkspacesModule {}
