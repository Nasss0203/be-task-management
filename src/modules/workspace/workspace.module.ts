import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmUnitOfWork } from 'src/common/helper/unit-work.typeorm';
import { ActivityModule } from 'src/modules/activity/activity.module';
import { MailModule } from 'src/modules/mail/mail.module';
import { NotificationsModule } from 'src/modules/notifications/notifications.module';
import { PageModule } from 'src/modules/page/page.module';
import { UsersModule } from 'src/modules/users/users.module';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import { CreateWorkspaceHandler } from './application/commands/workspace/create-workspace/create-workspace.handler';
import { RemoveWorkspaceFromTrashHandler } from './application/commands/workspace/remove-workspace-from-trash/remove-workspace-from-trash.handler';
import { RestoreWorkspaceHandler } from './application/commands/workspace/restore-workspace/restore-workspace.handler';
import { SoftDeleteWorkspaceHandler } from './application/commands/workspace/soft-delete-workspace/soft-delete-workspace.handler';
import { UpdateWorkspaceHandler } from './application/commands/workspace/update-workspace/update-workspace.handler';
import { UpdateWorkspaceLayoutModeHandler } from './application/commands/workspace/update-workspace-layout-mode/update-workspace-layout-mode.handler';
import { AcceptWorkspaceInviteHandler } from './application/commands/workspace-invite/accept-workspace-invite/accept-workspace-invite.handler';
import { CreateWorkspaceInviteLinkHandler } from './application/commands/workspace-invite/create-workspace-invite-link/create-workspace-invite-link.handler';
import { DeclineWorkspaceInviteHandler } from './application/commands/workspace-invite/decline-workspace-invite/decline-workspace-invite.handler';
import { InviteWorkspaceMemberHandler } from './application/commands/workspace-invite/invite-workspace-member/invite-workspace-member.handler';
import { RevokeWorkspaceInviteHandler } from './application/commands/workspace-invite/revoke-workspace-invite/revoke-workspace-invite.handler';
import { ResendWorkspaceInviteHandler } from './application/commands/workspace-invite/resend-workspace-invite/resend-workspace-invite.handler';
import { AddWorkspaceMemberHandler } from './application/commands/workspace-member/add-workspace-member/add-workspace-member.handler';
import { DeleteWorkspaceMemberHandler } from './application/commands/workspace-member/delete-workspace-member/delete-workspace-member.handler';
import { UpdateWorkspaceMemberRoleHandler } from './application/commands/workspace-member/update-workspace-member-role/update-workspace-member-role.handler';
import { GetWorkspaceHandler } from './application/queries/workspace/get-workspace/get-workspace.handler';
import { GetWorkspaceAccessHandler } from './application/queries/workspace/get-workspace-access/get-workspace-access.handler';
import { GetWorkspaceOverviewHandler } from './application/queries/workspace/get-workspace-overview/get-workspace-overview.handler';
import { ListDeletedWorkspacesHandler } from './application/queries/workspace/list-deleted-workspaces/list-deleted-workspaces.handler';
import { ListWorkspacesHandler } from './application/queries/workspace/list-workspaces/list-workspaces.handler';
import { SearchInviteUsersHandler } from './application/queries/workspace-invite/search-invite-users/search-invite-users.handler';
import { ListWorkspaceMembersHandler } from './application/queries/workspace-member/list-workspace-members/list-workspace-members.handler';
import { WorkspaceInviteOrmEntity } from './infrastructure/persistence/typeorm/entities/workspace-invite.orm-entity';
import { WorkspaceMemberOrmEntity } from './infrastructure/persistence/typeorm/entities/workspace-member.orm-entity';
import { WorkspaceOrmEntity } from './infrastructure/persistence/typeorm/entities/workspace.orm-entity';
import { TypeOrmWorkspaceInviteRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-workspace-invite.repository';
import { TypeOrmWorkspaceMemberRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-workspace-member.repository';
import { TypeOrmWorkspaceRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-workspace.repository';
import { WorkspaceMemberController } from './presentation/http/controllers/workspace-member.controller';
import { WorkspacesController } from './presentation/http/controllers/workspace.controller';
import { WorkspaceInviteController } from './presentation/http/controllers/workspace-invite.controller';
import { WORKSPACE_TYPES } from './workspace.types';

import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorkspaceOrmEntity,
      WorkspaceMemberOrmEntity,
      WorkspaceInviteOrmEntity,
    ]),
    PageModule,
    ActivityModule,
    UsersModule,
    MailModule,
    NotificationsModule,
    DatabaseModule,
  ],
  controllers: [
    WorkspacesController,
    WorkspaceMemberController,
    WorkspaceInviteController,
  ],
  providers: [
    CreateWorkspaceHandler,
    UpdateWorkspaceHandler,
    UpdateWorkspaceLayoutModeHandler,
    SoftDeleteWorkspaceHandler,
    RestoreWorkspaceHandler,
    RemoveWorkspaceFromTrashHandler,
    ListWorkspacesHandler,
    GetWorkspaceHandler,
    GetWorkspaceAccessHandler,
    GetWorkspaceOverviewHandler,
    ListDeletedWorkspacesHandler,
    InviteWorkspaceMemberHandler,
    AcceptWorkspaceInviteHandler,
    DeclineWorkspaceInviteHandler,
    CreateWorkspaceInviteLinkHandler,
    RevokeWorkspaceInviteHandler,
    ResendWorkspaceInviteHandler,
    SearchInviteUsersHandler,
    AddWorkspaceMemberHandler,
    UpdateWorkspaceMemberRoleHandler,
    DeleteWorkspaceMemberHandler,
    ListWorkspaceMembersHandler,
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
  exports: [CreateWorkspaceHandler],
})
export class WorkspaceModule {}
