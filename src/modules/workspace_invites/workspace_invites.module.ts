import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailModule } from '../mail/mail.module';
import { UsersModule } from '../users/users.module';
import { InviteWorkspaceMemberApplicationImpl } from './applications/invite-workspace-member.application';
import { WorkspaceInvitesController } from './controller/workspace_invites.controller';
import { WorkspaceInvite } from './domain/entities/workspace_invite.entity';
import { WORKSPACE_INVITE_TYPES } from './interfaces/types';
import { CreateWorkspaceInviteRepositoryImpl } from './repositories/create-workspace_invite.repository';
import { CreateWorkspaceInviteServiceImpl } from './services/create.workspace_invites.service';
import { WorkspaceInvitesService } from './workspace_invites.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkspaceInvite]),
    UsersModule,
    MailModule,
  ],
  controllers: [WorkspaceInvitesController],
  providers: [
    WorkspaceInvitesService,
    {
      provide:
        WORKSPACE_INVITE_TYPES.applications.InviteWorkspaceMemberApplication,
      useClass: InviteWorkspaceMemberApplicationImpl,
    },
    {
      provide:
        WORKSPACE_INVITE_TYPES.repositories.CreateWorkspaceInviteRepository,
      useClass: CreateWorkspaceInviteRepositoryImpl,
    },
    {
      provide: WORKSPACE_INVITE_TYPES.services.CreateWorkspaceInviteService,
      useClass: CreateWorkspaceInviteServiceImpl,
    },
  ],
})
export class WorkspaceInvitesModule {}
