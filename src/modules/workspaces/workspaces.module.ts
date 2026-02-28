import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmUnitOfWork } from 'src/common/helper/unit-work.typeorm';
import { CreateWorkspaceApplicationImpl } from './applications/create.workspace.application';
import { WorkspacesController } from './controller/workspaces.controller';
import { Workspace } from './domain/entities/workspace.entity';
import { WORKSPACETYPES } from './interfaces/types';
import { WorkspaceTypeOrmRepository } from './repositories/workspace.typeorm.repository';
import { CreateWorkSpaceServiceImpl } from './services/create.workspace.service';
import { WorkspacesService } from './workspaces.service';

@Module({
  imports: [TypeOrmModule.forFeature([Workspace])],
  controllers: [WorkspacesController],
  providers: [
    WorkspacesService,
    {
      provide: WORKSPACETYPES.applications.CreateWorkspaceApplication,
      useClass: CreateWorkspaceApplicationImpl,
    },
    {
      provide: WORKSPACETYPES.services.CreateWorkspaceService,
      useClass: CreateWorkSpaceServiceImpl,
    },
    {
      provide: WORKSPACETYPES.repositories.WorkspaceRepository,
      useClass: WorkspaceTypeOrmRepository,
    },

    {
      provide: WORKSPACETYPES.uow.UnitOfWork,
      useClass: TypeOrmUnitOfWork,
    },
  ],
  exports: [
    {
      provide: WORKSPACETYPES.repositories.WorkspaceRepository,
      useClass: WorkspaceTypeOrmRepository,
    },
  ],
})
export class WorkspacesModule {}
