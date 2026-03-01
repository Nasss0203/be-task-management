import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmUnitOfWork } from 'src/common/helper/unit-work.typeorm';
import { CreateWorkspaceApplicationImpl } from './applications/create.workspace.application';
import { WorkspacesController } from './controller/workspaces.controller';
import { Workspace } from './domain/entities/workspace.entity';
import { WORKSPACETYPES } from './interfaces/types';
import { WorkspaceRepositoryImpl } from './repositories/workspace.repository';
import { CreateWorkSpaceServiceImpl } from './services/create.workspace.service';

@Module({
  imports: [TypeOrmModule.forFeature([Workspace])],
  controllers: [WorkspacesController],
  providers: [
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
      useClass: WorkspaceRepositoryImpl,
    },

    {
      provide: WORKSPACETYPES.uow.UnitOfWork,
      useClass: TypeOrmUnitOfWork,
    },
  ],
  exports: [WORKSPACETYPES.repositories.WorkspaceRepository],
})
export class WorkspacesModule {}
