import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmUnitOfWork } from 'src/common/helper/unit-work.typeorm';
import { Role } from '../role/entities/role.entity';
import { WorkspaceMember } from '../workspace_members/domain/entities/workspace_member.entity';
import { WorkspaceMembersModule } from '../workspace_members/workspace_members.module';
import { CreateWorkspaceApplicationImpl } from './applications/create.workspace.application';
import { WorkspacesController } from './controller/workspaces.controller';
import { Workspace } from './domain/entities/workspace.entity';
import { WORKSPACE_TYPES } from './interfaces/types';
import { WorkspaceRepositoryImpl } from './repositories/workspace.repository';
import { CreateWorkSpaceServiceImpl } from './services/create.workspace.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Workspace, Role, WorkspaceMember]),
    WorkspaceMembersModule,
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
