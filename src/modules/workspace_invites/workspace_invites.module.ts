import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmUnitOfWork } from 'src/common/helper/unit-work.typeorm';
import { MailModule } from '../mail/mail.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RoleModule } from '../role/role.module';
import { UserRolesModule } from '../user_roles/user_roles.module';
import { UserWorkspacesModule } from '../user_workspace/user_workspace.module';
import { UsersModule } from '../users/users.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { WORKSPACE_TYPES } from '../workspaces/interfaces/types';
import { AcceptWorkspaceInviteApplicationImpl } from './applications/accept-workspace-invite.application';
import { DeclineWorkspaceInviteApplicationImpl } from './applications/decline-workspace-invite.application';
import { CreateWorkspaceInviteLinkApplicationImpl } from './applications/create-workspace-invite-link.application';
import { InviteWorkspaceMemberApplicationImpl } from './applications/invite-workspace-member.application';
import { SearchInviteUsersApplicationImpl } from './applications/search-invite-users.application';
import { WorkspaceInvitesController } from './controller/workspace_invites.controller';
import { WorkspaceInvite } from './domain/entities/workspace_invite.entity';
import { WORKSPACE_INVITE_TYPES } from './interfaces/types';
import { AcceptWorkspaceInviteRepositoryImpl } from './repositories/accept-workspace-invite.repository';
import { DeclineWorkspaceInviteRepositoryImpl } from './repositories/decline-workspace-invite.repository';
import { CreateWorkspaceInviteRepositoryImpl } from './repositories/create-workspace_invite.repository';
import { FindWorkspaceInviteRepositoryImpl } from './repositories/find-workspace-invite.repository';
import { AcceptWorkspaceInviteServiceImpl } from './services/accept-workspace-invite.service';
import { DeclineWorkspaceInviteServiceImpl } from './services/decline-workspace-invite.service';
import { CreateWorkspaceInviteServiceImpl } from './services/create.workspace_invites.service';
import { FindWorkspaceInviteServiceImpl } from './services/find-workspace-invite.service';
import { WorkspaceInvitesService } from './workspace_invites.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkspaceInvite]),
    UsersModule,
    MailModule,
    RoleModule,
    UserRolesModule,
    UserWorkspacesModule,
    NotificationsModule,
    WorkspacesModule,
  ],
  controllers: [WorkspaceInvitesController],
  providers: [
    WorkspaceInvitesService,
    // Application
    {
      provide:
        WORKSPACE_INVITE_TYPES.applications.InviteWorkspaceMemberApplication,
      useClass: InviteWorkspaceMemberApplicationImpl,
    },
    {
      provide:
        WORKSPACE_INVITE_TYPES.applications.AcceptWorkspaceInviteApplication,
      useClass: AcceptWorkspaceInviteApplicationImpl,
    },
    {
      provide:
        WORKSPACE_INVITE_TYPES.applications.DeclineWorkspaceInviteApplication,
      useClass: DeclineWorkspaceInviteApplicationImpl,
    },
    {
      provide:
        WORKSPACE_INVITE_TYPES.applications
          .CreateWorkspaceInviteLinkApplication,
      useClass: CreateWorkspaceInviteLinkApplicationImpl,
    },
    {
      provide: WORKSPACE_INVITE_TYPES.applications.SearchInviteUsersApplication,
      useClass: SearchInviteUsersApplicationImpl,
    },
    // Repository
    {
      provide:
        WORKSPACE_INVITE_TYPES.repositories.CreateWorkspaceInviteRepository,
      useClass: CreateWorkspaceInviteRepositoryImpl,
    },
    {
      provide:
        WORKSPACE_INVITE_TYPES.repositories.AcceptWorkspaceInviteRepository,
      useClass: AcceptWorkspaceInviteRepositoryImpl,
    },
    {
      provide:
        WORKSPACE_INVITE_TYPES.repositories.DeclineWorkspaceInviteRepository,
      useClass: DeclineWorkspaceInviteRepositoryImpl,
    },
    {
      provide:
        WORKSPACE_INVITE_TYPES.repositories.FindWorkspaceInviteRepository,
      useClass: FindWorkspaceInviteRepositoryImpl,
    },

    // Service
    {
      provide: WORKSPACE_INVITE_TYPES.services.CreateWorkspaceInviteService,
      useClass: CreateWorkspaceInviteServiceImpl,
    },

    {
      provide: WORKSPACE_INVITE_TYPES.services.AcceptWorkspaceInviteService,
      useClass: AcceptWorkspaceInviteServiceImpl,
    },
    {
      provide: WORKSPACE_INVITE_TYPES.services.DeclineWorkspaceInviteService,
      useClass: DeclineWorkspaceInviteServiceImpl,
    },
    {
      provide: WORKSPACE_INVITE_TYPES.services.FindWorkspaceInviteService,
      useClass: FindWorkspaceInviteServiceImpl,
    },

    {
      provide: WORKSPACE_TYPES.uow.UnitOfWork,
      useClass: TypeOrmUnitOfWork,
    },
  ],
})
export class WorkspaceInvitesModule {}
