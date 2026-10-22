import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityModule } from 'src/modules/activity/activity.module';
import { ContentModule } from 'src/modules/content/content.module';
import { IdentityModule } from 'src/modules/identity/identity.module';
import { MailModule } from 'src/modules/mail/mail.module';
import { NotificationsModule } from 'src/modules/notifications/notifications.module';
import { AcceptWorkspaceInviteHandler } from './application/commands/workspace-invite/accept-workspace-invite/accept-workspace-invite.handler';
import { CreateWorkspaceInviteLinkHandler } from './application/commands/workspace-invite/create-workspace-invite-link/create-workspace-invite-link.handler';
import { DeclineWorkspaceInviteHandler } from './application/commands/workspace-invite/decline-workspace-invite/decline-workspace-invite.handler';
import { InviteWorkspaceMemberHandler } from './application/commands/workspace-invite/invite-workspace-member/invite-workspace-member.handler';
import { ResendWorkspaceInviteHandler } from './application/commands/workspace-invite/resend-workspace-invite/resend-workspace-invite.handler';
import { RevokeWorkspaceInviteHandler } from './application/commands/workspace-invite/revoke-workspace-invite/revoke-workspace-invite.handler';
import { AddWorkspaceMemberHandler } from './application/commands/workspace-member/add-workspace-member/add-workspace-member.handler';
import { DeleteWorkspaceMemberHandler } from './application/commands/workspace-member/delete-workspace-member/delete-workspace-member.handler';
import { UpdateWorkspaceMemberRoleHandler } from './application/commands/workspace-member/update-workspace-member-role/update-workspace-member-role.handler';
import { CreateDefaultWorkspaceHandler } from './application/commands/workspace/create-default-workspace/create-default-workspace.handler';
import { CreateWorkspaceHandler } from './application/commands/workspace/create-workspace/create-workspace.handler';
import { RemoveWorkspaceFromTrashHandler } from './application/commands/workspace/remove-workspace-from-trash/remove-workspace-from-trash.handler';
import { RestoreWorkspaceHandler } from './application/commands/workspace/restore-workspace/restore-workspace.handler';
import { SoftDeleteWorkspaceHandler } from './application/commands/workspace/soft-delete-workspace/soft-delete-workspace.handler';
import { UpdateWorkspaceLayoutModeHandler } from './application/commands/workspace/update-workspace-layout-mode/update-workspace-layout-mode.handler';
import { UpdateWorkspaceHandler } from './application/commands/workspace/update-workspace/update-workspace.handler';
import { SearchInviteUsersHandler } from './application/queries/workspace-invite/search-invite-users/search-invite-users.handler';
import { ListWorkspaceMembersHandler } from './application/queries/workspace-member/list-workspace-members/list-workspace-members.handler';
import { ListWorkspacePeopleHandler } from './application/queries/workspace-member/list-workspace-people/list-workspace-people.handler';
import { GetWorkspaceAccessHandler } from './application/queries/workspace/get-workspace-access/get-workspace-access.handler';
import { GetWorkspaceOverviewHandler } from './application/queries/workspace/get-workspace-overview/get-workspace-overview.handler';
import { GetWorkspaceHandler } from './application/queries/workspace/get-workspace/get-workspace.handler';
import { ListDeletedWorkspacesHandler } from './application/queries/workspace/list-deleted-workspaces/list-deleted-workspaces.handler';
import { ListWorkspacesHandler } from './application/queries/workspace/list-workspaces/list-workspaces.handler';
import { ListWorkspaceStartersHandler } from './application/queries/workspace/list-workspace-starters/list-workspace-starters.handler';
import { WorkspaceInviteOrmEntity } from './infrastructure/persistence/typeorm/entities/workspace-invite.orm-entity';
import { WorkspaceMemberOrmEntity } from './infrastructure/persistence/typeorm/entities/workspace-member.orm-entity';
import { WorkspaceOrmEntity } from './infrastructure/persistence/typeorm/entities/workspace.orm-entity';
import { TypeOrmWorkspaceInviteRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-workspace-invite.repository';
import { TypeOrmWorkspaceMemberRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-workspace-member.repository';
import { TypeOrmWorkspaceRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-workspace.repository';
import { TypeOrmTeamspaceOwnershipGuard } from './infrastructure/persistence/typeorm/adapters/typeorm-teamspace-ownership.guard';
import { WorkspaceInviteController } from './presentation/http/controllers/workspace-invite.controller';
import { WorkspaceMemberController } from './presentation/http/controllers/workspace-member.controller';
import { WorkspacesController } from './presentation/http/controllers/workspace.controller';
import { WORKSPACE_TYPES } from './workspace.types';

import { DatabaseModule } from 'src/database/database.module';
import { PermissionModule } from '../permission/permission.module';
import { SelectWorkspaceHandler } from './application/commands/workspace/select-workspace/select-workspace.handler';
import { GetPendingWorkspaceInvitesHandler } from './application/queries/workspace-invite/get-pending-workspace-invites/get-pending-workspace-invites.handler';
import { WorkspaceSoftDeleteService } from './application/services/workspace-soft-delete.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorkspaceOrmEntity,
      WorkspaceMemberOrmEntity,
      WorkspaceInviteOrmEntity,
    ]),
    forwardRef(() => ContentModule),
    forwardRef(() => ActivityModule),
    forwardRef(() => IdentityModule),
    MailModule,
    NotificationsModule,
    DatabaseModule,
    PermissionModule,
  ],
  controllers: [
    WorkspacesController,
    WorkspaceMemberController,
    WorkspaceInviteController,
  ],
  providers: [
    WorkspaceSoftDeleteService,
    {
      provide: WORKSPACE_TYPES.applications.CreateDefaultWorkspaceHandler,
      useClass: CreateDefaultWorkspaceHandler,
    },
    {
      provide: CreateDefaultWorkspaceHandler,
      useExisting: WORKSPACE_TYPES.applications.CreateDefaultWorkspaceHandler,
    },
    {
      provide: WORKSPACE_TYPES.applications.CreateWorkspaceHandler,
      useClass: CreateWorkspaceHandler,
    },
    {
      provide: WORKSPACE_TYPES.applications.ListWorkspacesHandler,
      useClass: ListWorkspacesHandler,
    },
    {
      provide: WORKSPACE_TYPES.applications.ListWorkspaceStartersHandler,
      useClass: ListWorkspaceStartersHandler,
    },
    {
      provide: WORKSPACE_TYPES.applications.GetWorkspaceHandler,
      useClass: GetWorkspaceHandler,
    },
    {
      provide: WORKSPACE_TYPES.applications.GetWorkspaceAccessHandler,
      useClass: GetWorkspaceAccessHandler,
    },
    {
      provide: WORKSPACE_TYPES.applications.ListDeletedWorkspacesHandler,
      useClass: ListDeletedWorkspacesHandler,
    },
    {
      provide: WORKSPACE_TYPES.applications.GetWorkspaceOverviewHandler,
      useClass: GetWorkspaceOverviewHandler,
    },
    {
      provide: WORKSPACE_TYPES.applications.UpdateWorkspaceHandler,
      useClass: UpdateWorkspaceHandler,
    },
    {
      provide: WORKSPACE_TYPES.applications.UpdateWorkspaceLayoutModeHandler,
      useClass: UpdateWorkspaceLayoutModeHandler,
    },
    {
      provide: WORKSPACE_TYPES.applications.SoftDeleteWorkspaceHandler,
      useClass: SoftDeleteWorkspaceHandler,
    },
    {
      provide: WORKSPACE_TYPES.applications.RestoreWorkspaceHandler,
      useClass: RestoreWorkspaceHandler,
    },
    {
      provide: WORKSPACE_TYPES.applications.RemoveWorkspaceFromTrashHandler,
      useClass: RemoveWorkspaceFromTrashHandler,
    },
    {
      provide: WORKSPACE_TYPES.applications.SelectWorkspaceHandler,
      useClass: SelectWorkspaceHandler,
    },
    {
      provide: WORKSPACE_TYPES.applications.InviteWorkspaceMemberHandler,
      useClass: InviteWorkspaceMemberHandler,
    },
    {
      provide: WORKSPACE_TYPES.applications.AcceptWorkspaceInviteHandler,
      useClass: AcceptWorkspaceInviteHandler,
    },
    {
      provide: WORKSPACE_TYPES.applications.DeclineWorkspaceInviteHandler,
      useClass: DeclineWorkspaceInviteHandler,
    },
    {
      provide: WORKSPACE_TYPES.applications.CreateWorkspaceInviteLinkHandler,
      useClass: CreateWorkspaceInviteLinkHandler,
    },
    {
      provide: WORKSPACE_TYPES.applications.SearchInviteUsersHandler,
      useClass: SearchInviteUsersHandler,
    },
    {
      provide: WORKSPACE_TYPES.applications.RevokeWorkspaceInviteHandler,
      useClass: RevokeWorkspaceInviteHandler,
    },
    {
      provide: WORKSPACE_TYPES.applications.ResendWorkspaceInviteHandler,
      useClass: ResendWorkspaceInviteHandler,
    },
    {
      provide: WORKSPACE_TYPES.applications.GetPendingWorkspaceInvitesHandler,
      useClass: GetPendingWorkspaceInvitesHandler,
    },
    {
      provide: WORKSPACE_TYPES.applications.AddWorkspaceMemberHandler,
      useClass: AddWorkspaceMemberHandler,
    },
    {
      provide: WORKSPACE_TYPES.applications.UpdateWorkspaceMemberRoleHandler,
      useClass: UpdateWorkspaceMemberRoleHandler,
    },
    {
      provide: WORKSPACE_TYPES.applications.DeleteWorkspaceMemberHandler,
      useClass: DeleteWorkspaceMemberHandler,
    },
    {
      provide: WORKSPACE_TYPES.applications.ListWorkspaceMembersHandler,
      useClass: ListWorkspaceMembersHandler,
    },
    {
      provide: WORKSPACE_TYPES.applications.ListWorkspacePeopleHandler,
      useClass: ListWorkspacePeopleHandler,
    },
    {
      provide: WORKSPACE_TYPES.ports.TeamspaceOwnershipGuard,
      useClass: TypeOrmTeamspaceOwnershipGuard,
    },
    {
      provide: WORKSPACE_TYPES.repositories.WorkspaceRepository,
      useClass: TypeOrmWorkspaceRepository,
    },
    {
      provide: WORKSPACE_TYPES.repositories.WorkspaceMemberRepository,
      useClass: TypeOrmWorkspaceMemberRepository,
    },
    {
      provide: WORKSPACE_TYPES.repositories.WorkspaceInviteRepository,
      useClass: TypeOrmWorkspaceInviteRepository,
    },
  ],
  exports: [
    CreateDefaultWorkspaceHandler,
    WORKSPACE_TYPES.repositories.WorkspaceMemberRepository,
    WORKSPACE_TYPES.repositories.WorkspaceRepository,
  ],
})
export class WorkspaceModule {}
