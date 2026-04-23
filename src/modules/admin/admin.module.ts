import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { AdminService } from './admin.service';
import { AdminFindAllWorkspaceApplicationImpl } from './applications/admin-findAll-workspace.application';
import { AdminController } from './controller/admin.controller';
import { ADMIN_TYPES } from './interfaces/types';

@Module({
  imports: [TypeOrmModule.forFeature([]), WorkspacesModule],
  controllers: [AdminController],
  providers: [
    AdminService,
    {
      provide: ADMIN_TYPES.applications.AdminFindAllWorkspaceApplication,
      useClass: AdminFindAllWorkspaceApplicationImpl,
    },
  ],
})
export class AdminModule {}
